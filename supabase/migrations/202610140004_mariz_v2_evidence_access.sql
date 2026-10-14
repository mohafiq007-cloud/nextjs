-- Prevent reviewer bypass of audited document download routes.
-- Reviewers may see KYB metadata; document bytes are signed only by trusted server code
-- after mariz_authorize_document_view records an audit event and checks conflicts.
begin;
drop policy if exists mariz_kyb_read_private on storage.objects;
create policy mariz_kyb_company_owner_read on storage.objects for select to authenticated
using(bucket_id='mariz-kyb-private' and
 exists(select 1 from public.mariz_kyb_applications a
  where a.organization_id::text=split_part(name,'/',1)
    and a.id::text=split_part(name,'/',2)
    and mariz_private.is_owner(a.organization_id)));
commit;