-- MARIZ POS V2 staged admin setup RPCs.
-- NEVER apply to Shahira, MARIZ HQ V1 or an existing shared production project.
-- Apply only to a new dedicated V2 project, after migrations 001-005.
begin;
create or replace function mariz_private.require_pos_admin(p_org uuid)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_ws uuid;
begin
 if auth.uid() is null or not mariz_private.is_owner(p_org) then
  raise exception 'Authorized company administrator required';
 end if;
 if not exists(select 1 from public.mariz_organizations
   where id=p_org and verification_status='verified') then
  raise exception 'Approved KYB is required';
 end if;
 select id into v_ws from public.mariz_pos_workspaces
  where organization_id=p_org and status='active';
 if v_ws is null then raise exception 'An active MARIZ POS product entitlement is required'; end if;
 return v_ws;
end $$;
revoke all on function mariz_private.require_pos_admin(uuid) from public,anon,authenticated;

create or replace function public.mariz_pos_admin_create_outlet(p_organization uuid,p_name text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_ws uuid;v_id uuid;
begin
 v_ws:=mariz_private.require_pos_admin(p_organization);
 if length(trim(p_name)) not between 2 and 140 then raise exception 'Invalid outlet name'; end if;
 if (select count(*) from public.mariz_pos_outlets where organization_id=p_organization)>=100 then
  raise exception 'Outlet quota exceeded';
 end if;
 insert into public.mariz_pos_outlets(workspace_id,organization_id,outlet_name)
 values(v_ws,p_organization,trim(p_name)) returning id into v_id;
 insert into public.mariz_audit_events(actor_id,organization_id,event_type,entity_id)
 values(auth.uid(),p_organization,'pos.outlet.created',v_id);
 return v_id;
end $$;
revoke all on function public.mariz_pos_admin_create_outlet(uuid,text) from public,anon;
grant execute on function public.mariz_pos_admin_create_outlet(uuid,text) to authenticated;

create or replace function public.mariz_pos_admin_create_staff(p_organization uuid,p_name text,p_role text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid;
begin
 perform mariz_private.require_pos_admin(p_organization);
 if length(trim(p_name)) not between 2 and 140 or p_role not in ('cashier','manager','kitchen')
 then raise exception 'Invalid staff record';end if;
 if (select count(*) from public.mariz_pos_staff where organization_id=p_organization)>=500
 then raise exception 'Staff quota exceeded';end if;
 insert into public.mariz_pos_staff(organization_id,staff_name,role,status)
 values(p_organization,trim(p_name),p_role,'pending') returning id into v_id;
 insert into public.mariz_audit_events(actor_id,organization_id,event_type,entity_id)
 values(auth.uid(),p_organization,'pos.staff.created',v_id);
 return v_id;
end $$;
revoke all on function public.mariz_pos_admin_create_staff(uuid,text,text) from public,anon;
grant execute on function public.mariz_pos_admin_create_staff(uuid,text,text) to authenticated;

create or replace function public.mariz_pos_admin_create_item(p_organization uuid,p_name text,p_price_minor bigint)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid;
begin
 perform mariz_private.require_pos_admin(p_organization);
 if length(trim(p_name)) not between 2 and 140 or p_price_minor is null
    or p_price_minor<0 or p_price_minor>100000000 then raise exception 'Invalid product';end if;
 insert into public.mariz_pos_products(organization_id,name,price_minor)
 values(p_organization,trim(p_name),p_price_minor) returning id into v_id;
 insert into public.mariz_audit_events(actor_id,organization_id,event_type,entity_id)
 values(auth.uid(),p_organization,'pos.product.created',v_id);
 return v_id;
end $$;
revoke all on function public.mariz_pos_admin_create_item(uuid,text,bigint) from public,anon;
grant execute on function public.mariz_pos_admin_create_item(uuid,text,bigint) to authenticated;

create or replace function public.mariz_pos_admin_register_pending_device(p_organization uuid,p_outlet uuid,p_name text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid;
begin
 perform mariz_private.require_pos_admin(p_organization);
 if not exists(select 1 from public.mariz_pos_outlets
    where id=p_outlet and organization_id=p_organization and outlet_status='active')
 then raise exception 'Outlet is not active in this company';end if;
 if length(trim(p_name)) not between 2 and 80 then raise exception 'Invalid terminal name';end if;
 if (select count(*) from public.mariz_pos_devices where organization_id=p_organization
  and status<>'revoked')>=200 then raise exception 'Terminal limit reached';end if;
 insert into public.mariz_pos_devices(organization_id,outlet_id,display_name)
 values(p_organization,p_outlet,trim(p_name)) returning id into v_id;
 insert into public.mariz_audit_events(actor_id,organization_id,event_type,entity_id)
 values(auth.uid(),p_organization,'pos.device.pending',v_id);
 return v_id;
end $$;
revoke all on function public.mariz_pos_admin_register_pending_device(uuid,uuid,text) from public,anon;
grant execute on function public.mariz_pos_admin_register_pending_device(uuid,uuid,text) to authenticated;
-- Deliberately no public pairing-completion or staff-PIN functions.
-- Those require trusted, revocable device credentials, cryptographic challenge verification
-- and rate-limit tests, not just a PIN field.
commit;
