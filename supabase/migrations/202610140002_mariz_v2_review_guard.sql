-- MARIZ HQ V2 reviewer controls. Apply after 202610140001_mariz_v2_foundation.sql.
begin;
create or replace function public.mariz_my_reviewer_status() returns boolean
language sql stable security definer set search_path=''
as $$ select auth.uid() is not null and mariz_private.is_reviewer() $$;
revoke all on function public.mariz_my_reviewer_status() from public;
grant execute on function public.mariz_my_reviewer_status() to authenticated;

create or replace function public.mariz_record_kyb_check(
 p_application uuid, p_check_code text,p_result text,p_notes text default ''
) returns boolean
language plpgsql security definer set search_path=''
as $$
declare v_org uuid; v_status text;
begin
 if auth.uid() is null or not mariz_private.is_reviewer() then raise exception 'Reviewer permission required'; end if;
 if p_check_code not in ('registry','identity','authority','documents','duplicate','contact')
   or p_result not in ('pass','fail','needs_review') then raise exception 'Invalid check'; end if;
 select organization_id,status into v_org,v_status from public.mariz_kyb_applications
 where id=p_application for update;
 if v_org is null or v_status not in ('submitted','under_review') then raise exception 'Application not reviewable'; end if;
 if exists(select 1 from public.mariz_memberships where organization_id=v_org and user_id=auth.uid()) then
  raise exception 'Applicant reviewer conflict';
 end if;
 insert into public.mariz_kyb_checks(application_id,check_code,result,notes,checked_by)
 values(p_application,p_check_code,p_result,left(trim(p_notes),2000),auth.uid());
 update public.mariz_kyb_applications set status='under_review' where id=p_application;
 insert into public.mariz_audit_events(actor_id,organization_id,event_type,entity_id,detail)
 values(auth.uid(),v_org,'kyb.check',p_application,jsonb_build_object('code',p_check_code,'result',p_result));
 return true;
end $$;
revoke all on function public.mariz_record_kyb_check(uuid,text,text,text) from public;
grant execute on function public.mariz_record_kyb_check(uuid,text,text,text) to authenticated;

create or replace function public.mariz_review_kyb(p_application uuid,p_decision text,p_reason text) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare v_org uuid; v_status text; v_passes integer;
begin
 if auth.uid() is null or not mariz_private.is_reviewer() then raise exception 'Reviewer permission required'; end if;
 if p_decision not in ('approved','rejected','needs_information') or length(trim(p_reason))<4 then
  raise exception 'Invalid decision';
 end if;
 select organization_id,status into v_org,v_status from public.mariz_kyb_applications
 where id=p_application for update;
 if v_org is null or v_status not in ('submitted','under_review') then raise exception 'Not reviewable'; end if;
 if exists(select 1 from public.mariz_memberships where organization_id=v_org and user_id=auth.uid()) then
  raise exception 'Conflict of interest: reviewer belongs to applicant company';
 end if;
 if p_decision='approved' then
   select count(*) into v_passes from (
     select distinct on(check_code) check_code,result
     from public.mariz_kyb_checks where application_id=p_application
     order by check_code,checked_at desc,id desc
   ) x where result='pass';
   if v_passes<>6 then raise exception 'All six latest KYB checks must pass'; end if;
   if not exists(select 1 from public.mariz_kyb_documents
     where application_id=p_application and document_type='registration_profile') then
     raise exception 'Registration profile is missing';
   end if;
 end if;
 insert into public.mariz_kyb_decisions(application_id,reviewer_id,decision,reason)
 values(p_application,auth.uid(),p_decision,trim(p_reason));
 update public.mariz_kyb_applications set
 status=case when p_decision='approved' then 'approved'
             when p_decision='rejected' then 'rejected' else 'needs_information' end,
 decided_at=now() where id=p_application;
 update public.mariz_organizations set
 verification_status=case when p_decision='approved' then 'verified' else 'unverified' end,
 verified_at=case when p_decision='approved' then now() else null end,
 updated_at=now() where id=v_org;
 insert into public.mariz_audit_events(actor_id,organization_id,event_type,entity_id,detail)
 values(auth.uid(),v_org,'kyb.'||p_decision,p_application,jsonb_build_object('reason',trim(p_reason)));
 return true;
end $$;
revoke all on function public.mariz_review_kyb(uuid,text,text) from public;
grant execute on function public.mariz_review_kyb(uuid,text,text) to authenticated;
commit;
