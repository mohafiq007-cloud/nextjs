-- MARIZ POS V2 / security revocation controls.
-- MIGRATION 009: only on isolated V2 project after 001-008.
begin;
create function public.mariz_pos_admin_revoke_device(p_organization uuid,p_device uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_changed uuid;
begin
 if auth.uid() is null or not mariz_private.is_owner(p_organization) then
  raise exception 'Authorized company administrator required';end if;
 update public.mariz_pos_devices
 set status='revoked',revoked_at=now(),credential_fingerprint=null
 where id=p_device and organization_id=p_organization and status<>'revoked'
 returning id into v_changed;
 if v_changed is null then return false;end if;
 update mariz_private.pos_pairing_challenges set used_at=now()
 where device_id=p_device and used_at is null;
 update mariz_private.pos_device_credentials set revoked_at=now()
 where device_id=p_device and revoked_at is null;
 update mariz_private.pos_operator_sessions set revoked_at=now()
 where device_id=p_device and revoked_at is null;
 insert into public.mariz_audit_events(actor_id,organization_id,event_type,entity_id)
 values(auth.uid(),p_organization,'pos.device.revoked',p_device);
 return true;
end $$;
revoke all on function public.mariz_pos_admin_revoke_device(uuid,uuid) from public,anon;
grant execute on function public.mariz_pos_admin_revoke_device(uuid,uuid) to authenticated;

create function public.mariz_pos_admin_suspend_staff(p_organization uuid,p_staff uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_changed uuid;
begin
 if auth.uid() is null or not mariz_private.is_owner(p_organization) then
  raise exception 'Authorized company administrator required';end if;
 update public.mariz_pos_staff
 set status='suspended' where id=p_staff and organization_id=p_organization
 and status<>'suspended' returning id into v_changed;
 if v_changed is null then return false;end if;
 update mariz_private.pos_operator_sessions set revoked_at=now()
 where staff_id=p_staff and revoked_at is null;
 insert into public.mariz_audit_events(actor_id,organization_id,event_type,entity_id)
 values(auth.uid(),p_organization,'pos.staff.suspended',p_staff);
 return true;
end $$;
revoke all on function public.mariz_pos_admin_suspend_staff(uuid,uuid) from public,anon;
grant execute on function public.mariz_pos_admin_suspend_staff(uuid,uuid) to authenticated;
commit;
