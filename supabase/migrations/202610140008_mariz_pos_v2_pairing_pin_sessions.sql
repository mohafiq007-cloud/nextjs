-- MARIZ POS V2 / secure, staged terminal pairing and staff PIN sessions.
-- MIGRATION 008. DO NOT APPLY outside a fresh isolated MARIZ HQ V2 database.
-- Prerequisites: 001-007; POS activation entitlement still separately enforced.
begin;
-- Supabase normally installs pgcrypto in extensions. Refuse to deploy if unavailable.
do $$ begin
 if to_regprocedure('extensions.crypt(text,text)') is null
    or to_regprocedure('extensions.gen_salt(text,integer)') is null then
  raise exception 'pgcrypto crypt/gen_salt in extensions schema required. Check fresh V2 Supabase setup.';
 end if;
end $$;

create table mariz_private.pos_device_credentials(
 device_id uuid primary key references public.mariz_pos_devices(id),
 organization_id uuid not null references public.mariz_organizations(id),
 token_sha256 text not null check(token_sha256 ~ '^[a-f0-9]{64}$'),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 revoked_at timestamptz
);
create unique index pos_device_token_unique on mariz_private.pos_device_credentials(token_sha256);
create table mariz_private.pos_operator_sessions(
 token_sha256 text primary key check(token_sha256 ~ '^[a-f0-9]{64}$'),
 organization_id uuid not null,
 device_id uuid not null,
 staff_id uuid not null,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 revoked_at timestamptz,
 foreign key(device_id,organization_id) references public.mariz_pos_devices(id,organization_id),
 foreign key(staff_id,organization_id) references public.mariz_pos_staff(id,organization_id)
);
create index pos_operator_sessions_device_expiry on mariz_private.pos_operator_sessions(device_id,expires_at);
revoke all on mariz_private.pos_device_credentials,mariz_private.pos_operator_sessions from public,anon,authenticated;

-- A company administrator generates a short-lived 6-digit pairing secret
-- for a previously created PENDING device. Never put returned code in a URL, log or audit event.
create function public.mariz_pos_admin_start_pairing(p_organization uuid,p_device uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_device record;v_challenge uuid:=gen_random_uuid();
 v_rand bigint;v_code text;
begin
 perform mariz_private.require_pos_admin(p_organization);
 select id,status into v_device from public.mariz_pos_devices
 where id=p_device and organization_id=p_organization for update;
 if not found or v_device.status<>'pending' then raise exception 'Device is not pending for this company';end if;
 -- No more than 10 issuance attempts per device in a rolling day.
 if (select count(*) from mariz_private.pos_pairing_challenges
     where device_id=p_device and created_at>now()-interval '24 hours')>=10
 then raise exception 'Pairing issue limit reached';end if;
 update mariz_private.pos_pairing_challenges set used_at=now()
 where device_id=p_device and used_at is null;
 -- gen_random_uuid provides cryptographic entropy; six digits serve as a brief possession test,
 -- NOT a long-term device credential.
 v_rand:=('x'||substring(replace(gen_random_uuid()::text,'-','') from 1 for 8))::bit(32)::bigint;
 v_code:=lpad(((v_rand % 900000)+100000)::text,6,'0');
 insert into mariz_private.pos_pairing_challenges(id,organization_id,device_id,code_hash,expires_at)
 values(v_challenge,p_organization,p_device,
 encode(sha256(convert_to(v_code||':'||v_challenge::text,'UTF8')),'hex'),
 now()+interval '5 minutes');
 insert into public.mariz_audit_events(actor_id,organization_id,event_type,entity_id)
 values(auth.uid(),p_organization,'pos.device.pairing_issued',p_device);
 return jsonb_build_object('challenge_id',v_challenge,'device_id',p_device,
  'pairing_code',v_code,'expires_in_seconds',300);
end $$;
revoke all on function public.mariz_pos_admin_start_pairing(uuid,uuid) from public,anon;
grant execute on function public.mariz_pos_admin_start_pairing(uuid,uuid) to authenticated;

-- Check device status, company verification and active POS workspace on EACH request.
-- This privileged RPC is exposed only to the trusted server role.
create function public.mariz_pos_terminal_validate_device(p_device uuid,p_token_sha256 text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_row record;
begin
 select d.organization_id,d.outlet_id,d.id into v_row
 from public.mariz_pos_devices d
 join mariz_private.pos_device_credentials c on c.device_id=d.id
 join public.mariz_pos_outlets o on o.id=d.outlet_id and o.organization_id=d.organization_id
 join public.mariz_organizations org on org.id=d.organization_id
 join public.mariz_pos_workspaces w on w.organization_id=d.organization_id
 where d.id=p_device and d.status='paired' and d.revoked_at is null
 and o.outlet_status='active' and org.verification_status='verified' and w.status='active'
 and c.revoked_at is null and c.expires_at>now()
 and c.token_sha256=p_token_sha256;
 if not found then return jsonb_build_object('ok',false);end if;
 return jsonb_build_object('ok',true,'organization_id',v_row.organization_id,
   'outlet_id',v_row.outlet_id,'device_id',v_row.id);
end $$;
revoke all on function public.mariz_pos_terminal_validate_device(uuid,text) from public,anon,authenticated;
grant execute on function public.mariz_pos_terminal_validate_device(uuid,text) to service_role;

-- This is called with a 256-bit cryptographically random token generated server-side.
-- Invalid codes increment attempts DURABLY: do not RAISE and roll back failures.
create function public.mariz_pos_terminal_complete_pairing(
 p_device uuid,p_challenge uuid,p_code text,p_token_sha256 text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_challenge mariz_private.pos_pairing_challenges%rowtype;v_device record;v_expected text;
begin
 if p_token_sha256 !~ '^[a-f0-9]{64}$' or p_code !~ '^[0-9]{6}$'
 then return jsonb_build_object('ok',false);end if;
 select d.id,d.organization_id,d.status into v_device from public.mariz_pos_devices d
 where d.id=p_device for update;
 if not found or v_device.status<>'pending' then return jsonb_build_object('ok',false);end if;
 select * into v_challenge from mariz_private.pos_pairing_challenges
 where id=p_challenge and device_id=p_device and organization_id=v_device.organization_id for update;
 if not found or v_challenge.used_at is not null or v_challenge.expires_at<=now()
    or v_challenge.attempts>=5 then return jsonb_build_object('ok',false);end if;
 update mariz_private.pos_pairing_challenges set attempts=attempts+1 where id=p_challenge;
 v_expected:=encode(sha256(convert_to(p_code||':'||p_challenge::text,'UTF8')),'hex');
 if v_expected<>v_challenge.code_hash then
   return jsonb_build_object('ok',false);
 end if;
 if not exists(
  select 1 from public.mariz_organizations org
  join public.mariz_pos_workspaces w on w.organization_id=org.id
  join public.mariz_pos_outlets o on o.organization_id=org.id
  where org.id=v_device.organization_id and o.id=(select outlet_id from public.mariz_pos_devices where id=p_device)
   and org.verification_status='verified' and w.status='active' and o.outlet_status='active'
 ) then return jsonb_build_object('ok',false);end if;
 update public.mariz_pos_devices set status='paired',paired_at=now() where id=p_device;
 update mariz_private.pos_pairing_challenges set used_at=now() where id=p_challenge;
 insert into mariz_private.pos_device_credentials(device_id,organization_id,token_sha256,expires_at)
 values(p_device,v_device.organization_id,p_token_sha256,now()+interval '30 days')
 on conflict(device_id) do update set token_sha256=excluded.token_sha256,
 expires_at=excluded.expires_at,revoked_at=null,created_at=now();
 insert into public.mariz_audit_events(organization_id,event_type,entity_id)
 values(v_device.organization_id,'pos.device.paired',p_device);
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.mariz_pos_terminal_complete_pairing(uuid,uuid,text,text)
 from public,anon,authenticated;
grant execute on function public.mariz_pos_terminal_complete_pairing(uuid,uuid,text,text) to service_role;

-- The ONLY admin PIN enrollment interface accepts a 64-character HMAC generated by
-- trusted Next.js server code using a private pepper. Six-to-eight digit PINs never reach storage.
create function public.mariz_pos_admin_enroll_pin(p_organization uuid,p_staff uuid,p_hmac text)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
 perform mariz_private.require_pos_admin(p_organization);
 if p_hmac !~ '^[a-f0-9]{64}$' then raise exception 'Invalid server-hashed PIN';end if;
 if not exists(select 1 from public.mariz_pos_staff where id=p_staff
    and organization_id=p_organization and status<>'suspended' for update)
 then raise exception 'Staff not in this organization';end if;
 insert into mariz_private.pos_staff_pin_credentials(staff_id,pin_hash,failed_attempts,locked_until)
 values(p_staff,extensions.crypt(p_hmac,extensions.gen_salt('bf',12)),0,null)
 on conflict(staff_id) do update set pin_hash=excluded.pin_hash,
 failed_attempts=0,locked_until=null,rotated_at=now();
 update public.mariz_pos_staff set status='active' where id=p_staff and organization_id=p_organization;
 update mariz_private.pos_operator_sessions set revoked_at=now()
 where staff_id=p_staff and revoked_at is null;
 insert into public.mariz_audit_events(actor_id,organization_id,event_type,entity_id)
 values(auth.uid(),p_organization,'pos.staff.pin_enrolled',p_staff);
 return true;
end $$;
revoke all on function public.mariz_pos_admin_enroll_pin(uuid,uuid,text) from public,anon;
grant execute on function public.mariz_pos_admin_enroll_pin(uuid,uuid,text) to authenticated;

-- PIN validation + failure lockout + 12-hour staff session, ALL atomic.
-- Only the application server with an independently verified device credential may call this.
create function public.mariz_pos_terminal_sign_in(
 p_device uuid,p_device_sha256 text,p_staff uuid,p_pin_hmac text,p_session_sha256 text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_device jsonb;v_creds mariz_private.pos_staff_pin_credentials%rowtype;
 v_org uuid;
begin
 if p_pin_hmac !~ '^[a-f0-9]{64}$' or p_session_sha256 !~ '^[a-f0-9]{64}$'
 then return jsonb_build_object('ok',false);end if;
 v_device:=public.mariz_pos_terminal_validate_device(p_device,p_device_sha256);
 if coalesce((v_device->>'ok')::boolean,false)=false then return jsonb_build_object('ok',false);end if;
 v_org:=(v_device->>'organization_id')::uuid;
 if not exists(select 1 from public.mariz_pos_staff
  where id=p_staff and organization_id=v_org and status='active')
 then return jsonb_build_object('ok',false);end if;
 select * into v_creds from mariz_private.pos_staff_pin_credentials
 where staff_id=p_staff for update;
 if not found or (v_creds.locked_until is not null and v_creds.locked_until>now())
 then return jsonb_build_object('ok',false);end if;
 if extensions.crypt(p_pin_hmac,v_creds.pin_hash)<>v_creds.pin_hash then
   update mariz_private.pos_staff_pin_credentials set failed_attempts=failed_attempts+1,
     locked_until=case when failed_attempts+1>=5 then now()+interval '15 minutes' else null end
   where staff_id=p_staff;
   insert into public.mariz_audit_events(organization_id,event_type,entity_id)
   values(v_org,'pos.staff.pin_failed',p_staff);
   return jsonb_build_object('ok',false);
 end if;
 update mariz_private.pos_staff_pin_credentials
 set failed_attempts=0,locked_until=null where staff_id=p_staff;
 update mariz_private.pos_operator_sessions set revoked_at=now()
 where device_id=p_device and revoked_at is null;
 insert into mariz_private.pos_operator_sessions(token_sha256,organization_id,device_id,staff_id,expires_at)
 values(p_session_sha256,v_org,p_device,p_staff,now()+interval '12 hours');
 insert into public.mariz_audit_events(organization_id,event_type,entity_id)
 values(v_org,'pos.staff.signed_in',p_staff);
 return jsonb_build_object('ok',true,'staff_id',p_staff);
end $$;
revoke all on function public.mariz_pos_terminal_sign_in(uuid,text,uuid,text,text)
 from public,anon,authenticated;
grant execute on function public.mariz_pos_terminal_sign_in(uuid,text,uuid,text,text) to service_role;

create function public.mariz_pos_terminal_validate_operator(
 p_device uuid,p_device_sha256 text,p_operator_sha256 text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_dev jsonb;v_staff record;
begin
 v_dev:=public.mariz_pos_terminal_validate_device(p_device,p_device_sha256);
 if coalesce((v_dev->>'ok')::boolean,false)=false then return jsonb_build_object('ok',false);end if;
 select s.id,s.staff_name,s.role into v_staff
 from mariz_private.pos_operator_sessions ses
 join public.mariz_pos_staff s on s.id=ses.staff_id and s.organization_id=ses.organization_id
 where ses.device_id=p_device and ses.token_sha256=p_operator_sha256
 and ses.revoked_at is null and ses.expires_at>now() and s.status='active';
 if not found then return jsonb_build_object('ok',false);end if;
 return jsonb_build_object('ok',true,'staff_id',v_staff.id,'staff_name',v_staff.staff_name,'role',v_staff.role);
end $$;
revoke all on function public.mariz_pos_terminal_validate_operator(uuid,text,text)
 from public,anon,authenticated;
grant execute on function public.mariz_pos_terminal_validate_operator(uuid,text,text) to service_role;

create function public.mariz_pos_terminal_sign_out(
 p_device uuid,p_device_sha256 text,p_operator_sha256 text)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
 if coalesce((public.mariz_pos_terminal_validate_device(p_device,p_device_sha256)->>'ok')::boolean,false)=false
 then return false;end if;
 update mariz_private.pos_operator_sessions
 set revoked_at=now() where device_id=p_device and token_sha256=p_operator_sha256
 and revoked_at is null;
 return found;
end $$;
revoke all on function public.mariz_pos_terminal_sign_out(uuid,text,text) from public,anon,authenticated;
grant execute on function public.mariz_pos_terminal_sign_out(uuid,text,text) to service_role;
commit;
