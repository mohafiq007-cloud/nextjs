-- Privacy hardening for V2 reviewers. Requires initial foundation + review guard.
begin;
drop policy if exists checks_read on public.mariz_kyb_checks;
create policy mariz_kyb_checks_reviewer_only on public.mariz_kyb_checks
 for select to authenticated using(mariz_private.is_reviewer());

create or replace function public.mariz_authorize_document_view(p_document uuid)
returns text language plpgsql security definer set search_path=''
as $$
declare v_org uuid;v_path text;v_app uuid;
begin
 if auth.uid() is null or not mariz_private.is_reviewer() then raise exception 'Reviewer required'; end if;
 select a.organization_id,d.storage_path,a.id into v_org,v_path,v_app
 from public.mariz_kyb_documents d
 join public.mariz_kyb_applications a on a.id=d.application_id
 where d.id=p_document;
 if v_org is null then raise exception 'Document not found'; end if;
 if exists(select 1 from public.mariz_memberships where organization_id=v_org and user_id=auth.uid()) then
  raise exception 'Conflict of interest';
 end if;
 insert into public.mariz_audit_events(actor_id,organization_id,event_type,entity_id,detail)
 values(auth.uid(),v_org,'kyb.document_view',p_document,jsonb_build_object('application',v_app));
 return v_path;
end $$;
revoke all on function public.mariz_authorize_document_view(uuid) from public;
grant execute on function public.mariz_authorize_document_view(uuid) to authenticated;
commit;