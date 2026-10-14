-- MARIZ HQ V2: isolated bootstrap schema. Apply ONLY to a newly provisioned V2 Supabase project.
-- Never apply to Shahira, MARIZ HQ Productions, or a legacy project.
begin;
create extension if not exists pgcrypto;
create schema if not exists mariz_private;
revoke all on schema mariz_private from public, anon, authenticated;

create table public.mariz_organizations (
 id uuid primary key default gen_random_uuid(),
 country_code text not null default 'MY' check (country_code ~ '^[A-Z]{2}$'),
 registrar text not null default 'SSM' check (length(registrar) between 2 and 80),
 entity_type text not null check(entity_type in ('company','sole_proprietor','partnership','llp','society','foreign','other')),
 legal_name text not null check (length(trim(legal_name)) between 3 and 200),
 registration_no text not null check (length(trim(registration_no)) between 4 and 80),
 registration_normalized text generated always as (regexp_replace(upper(registration_no),'[^A-Z0-9]','','g')) stored,
 registered_address text not null check (length(trim(registered_address)) between 8 and 700),
 business_email text not null check (business_email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'),
 created_by uuid not null references auth.users(id),
 verification_status text not null default 'unverified'
   check (verification_status in ('unverified','pending','verified','suspended','revoked')),
 verified_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(country_code,registrar,registration_normalized)
);

create table public.mariz_memberships (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.mariz_organizations(id),
 user_id uuid not null references auth.users(id),
 member_role text not null check(member_role in ('owner','admin','member')),
 membership_status text not null default 'active' check (membership_status in ('active','invited','disabled')),
 created_at timestamptz not null default now(),
 unique(organization_id,user_id)
);

create table public.mariz_kyb_applications (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.mariz_organizations(id),
 submitted_by uuid references auth.users(id),
 policy_version text not null default 'MY-2026-10-v1',
 status text not null default 'draft' check (status in ('draft','submitted','under_review','needs_information','approved','rejected','withdrawn')),
 submitted_at timestamptz,
 decided_at timestamptz,
 created_at timestamptz not null default now()
);
create unique index mariz_kyb_one_current on public.mariz_kyb_applications(organization_id)
 where status in ('draft','submitted','under_review','needs_information');

create table public.mariz_kyb_documents (
 id uuid primary key default gen_random_uuid(),
 application_id uuid not null references public.mariz_kyb_applications(id),
 uploaded_by uuid not null references auth.users(id),
 document_type text not null check(document_type in ('registration_profile','authority_letter','registration_certificate','other')),
 storage_path text not null unique check(length(storage_path) between 20 and 350),
 file_sha256 text check(file_sha256 is null or file_sha256 ~ '^[a-f0-9]{64}$'),
 upload_status text not null default 'uploaded' check(upload_status in ('uploaded','accepted','rejected')),
 created_at timestamptz not null default now()
);

create table public.mariz_kyb_checks (
 id uuid primary key default gen_random_uuid(),
 application_id uuid not null references public.mariz_kyb_applications(id),
 check_code text not null check(check_code in ('registry','identity','authority','documents','duplicate','contact')),
 result text not null check(result in ('pass','fail','needs_review')),
 notes text,
 checked_by uuid not null references auth.users(id),
 checked_at timestamptz not null default now()
);
create table public.mariz_kyb_decisions (
 id uuid primary key default gen_random_uuid(),
 application_id uuid not null references public.mariz_kyb_applications(id),
 reviewer_id uuid not null references auth.users(id),
 decision text not null check(decision in ('approved','rejected','needs_information')),
 reason text not null check(length(trim(reason)) between 4 and 2000),
 created_at timestamptz not null default now()
);
create table public.mariz_reviewer_grants (
 user_id uuid primary key references auth.users(id),
 granted_at timestamptz not null default now(),
 granted_by uuid references auth.users(id)
);
create table public.mariz_audit_events (
 id bigint generated always as identity primary key,
 actor_id uuid references auth.users(id),
 organization_id uuid references public.mariz_organizations(id),
 event_type text not null,
 entity_id uuid,
 detail jsonb not null default '{}'::jsonb,
 recorded_at timestamptz not null default now()
);

create table public.mariz_products (
 product_code text primary key,
 product_name text not null,
 description text not null,
 demo_available boolean not null default true,
 live_available boolean not null default false,
 created_at timestamptz not null default now()
);
-- MARIZ CO is organization infrastructure, not a product. Custom software is quotation-led.
insert into public.mariz_products (product_code,product_name,description,demo_available,live_available) values
 ('pos','MARIZ POS','Store terminal and back-office operations',true,false),
 ('custom_web','Custom Web Software','Bespoke hosted software scoped to each business',false,false);
create table public.mariz_plan_versions (
 id uuid primary key default gen_random_uuid(),
 product_code text not null references public.mariz_products(product_code),
 plan_name text not null,
 currency text not null default 'MYR',
 price_minor bigint not null check(price_minor>=0),
 billing_interval text not null check(billing_interval in ('month','year','one_time')),
 terms_version text not null,
 active boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.mariz_activation_requests (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.mariz_organizations(id),
 plan_version_id uuid not null references public.mariz_plan_versions(id),
 requested_by uuid not null references auth.users(id),
 accepted_terms_version text not null,
 status text not null default 'pending_checkout' check(status in ('pending_checkout','payment_pending','active','failed','cancelled')),
 created_at timestamptz not null default now()
);
create table public.mariz_billing_events (
 id uuid primary key default gen_random_uuid(),
 provider text not null default 'stripe',
 provider_event_id text not null,
 payload_hash text,
 processed_at timestamptz,
 unique(provider,provider_event_id)
);

-- No public role can directly mutate legal identity, KYB decisions, billing or entitlements.
alter table public.mariz_organizations enable row level security;
alter table public.mariz_memberships enable row level security;
alter table public.mariz_kyb_applications enable row level security;
alter table public.mariz_kyb_documents enable row level security;
alter table public.mariz_kyb_checks enable row level security;
alter table public.mariz_kyb_decisions enable row level security;
alter table public.mariz_reviewer_grants enable row level security;
alter table public.mariz_audit_events enable row level security;
alter table public.mariz_products enable row level security;
alter table public.mariz_plan_versions enable row level security;
alter table public.mariz_activation_requests enable row level security;
alter table public.mariz_billing_events enable row level security;

revoke all on public.mariz_organizations, public.mariz_memberships,public.mariz_kyb_applications,
 public.mariz_kyb_documents,public.mariz_kyb_checks,public.mariz_kyb_decisions,
 public.mariz_reviewer_grants,public.mariz_audit_events,public.mariz_products,
 public.mariz_plan_versions,public.mariz_activation_requests,public.mariz_billing_events
 from anon,authenticated;
grant select on public.mariz_organizations, public.mariz_memberships,
 public.mariz_kyb_applications,public.mariz_kyb_documents,public.mariz_kyb_checks,
 public.mariz_kyb_decisions,public.mariz_products,public.mariz_plan_versions,
 public.mariz_activation_requests to authenticated;
grant insert on public.mariz_kyb_documents to authenticated;
grant select on public.mariz_products to anon;

create function mariz_private.is_member(p_org uuid) returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.mariz_memberships m where m.organization_id=p_org and m.user_id=(select auth.uid()) and m.membership_status='active') $$;
create function mariz_private.is_owner(p_org uuid) returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.mariz_memberships m where m.organization_id=p_org and m.user_id=(select auth.uid()) and m.member_role in ('owner','admin') and m.membership_status='active') $$;
create function mariz_private.is_reviewer() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.mariz_reviewer_grants g where g.user_id=(select auth.uid())) $$;
revoke all on function mariz_private.is_member(uuid),mariz_private.is_owner(uuid),mariz_private.is_reviewer() from public;
grant usage on schema mariz_private to authenticated;
grant execute on function mariz_private.is_member(uuid),mariz_private.is_owner(uuid),mariz_private.is_reviewer() to authenticated;

create policy org_read on public.mariz_organizations for select to authenticated
using (mariz_private.is_member(id) or mariz_private.is_reviewer());
create policy member_self_read on public.mariz_memberships for select to authenticated
using(user_id=(select auth.uid()) or mariz_private.is_reviewer());
create policy kyb_read on public.mariz_kyb_applications for select to authenticated
using(mariz_private.is_member(organization_id) or mariz_private.is_reviewer());
create policy doc_read on public.mariz_kyb_documents for select to authenticated
using(exists(select 1 from public.mariz_kyb_applications a where a.id=application_id and
 (mariz_private.is_member(a.organization_id) or mariz_private.is_reviewer())));
create policy checks_read on public.mariz_kyb_checks for select to authenticated
using(exists(select 1 from public.mariz_kyb_applications a where a.id=application_id and
 (mariz_private.is_member(a.organization_id) or mariz_private.is_reviewer())));
create policy decisions_read on public.mariz_kyb_decisions for select to authenticated
using(exists(select 1 from public.mariz_kyb_applications a where a.id=application_id and
 (mariz_private.is_member(a.organization_id) or mariz_private.is_reviewer())));
create policy product_catalog_public on public.mariz_products for select to anon,authenticated using(true);
create policy plan_read on public.mariz_plan_versions for select to authenticated using(active=true);
create policy activation_read on public.mariz_activation_requests for select to authenticated
using(mariz_private.is_member(organization_id));

create function public.mariz_register_company(
 p_legal_name text,p_entity_type text,p_registration_no text,p_registered_address text,p_business_email text,
 p_country text default 'MY',p_registrar text default 'SSM'
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := auth.uid(); v_org uuid;
begin
 if v_user is null or not exists(select 1 from auth.users where id=v_user and email_confirmed_at is not null) then
   raise exception 'Verified account required';
 end if;
 if length(trim(p_legal_name))<3 or length(trim(p_registration_no))<4 or length(trim(p_registered_address))<8 then
   raise exception 'Incomplete legal registration details';
 end if;
 if (select count(*) from public.mariz_organizations where created_by=v_user and created_at>now()-interval '24 hours')>=3 then
   raise exception 'Registration rate limit exceeded';
 end if;
 insert into public.mariz_organizations
  (legal_name,entity_type,registration_no,registered_address,business_email,country_code,registrar,created_by)
 values (trim(p_legal_name),p_entity_type,trim(p_registration_no),trim(p_registered_address),lower(trim(p_business_email)),
         upper(trim(p_country)),upper(trim(p_registrar)),v_user)
 returning id into v_org;
 insert into public.mariz_memberships(organization_id,user_id,member_role) values(v_org,v_user,'owner');
 insert into public.mariz_audit_events(actor_id,organization_id,event_type,entity_id)
 values(v_user,v_org,'company.created',v_org);
 return v_org;
exception when unique_violation then
 raise exception 'A company with this registration already exists. Request authorized company access instead.';
end $$;
revoke all on function public.mariz_register_company(text,text,text,text,text,text,text) from public;
grant execute on function public.mariz_register_company(text,text,text,text,text,text,text) to authenticated;

create function public.mariz_start_kyb(p_org uuid) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_user uuid:=auth.uid(); v_id uuid;
begin
 if not mariz_private.is_owner(p_org) then raise exception 'Not authorized'; end if;
 if not exists(select 1 from public.mariz_organizations where id=p_org and verification_status='unverified') then
  raise exception 'Company is not eligible for a new application';
 end if;
 select id into v_id from public.mariz_kyb_applications where organization_id=p_org
 and status in ('draft','submitted','under_review','needs_information') limit 1;
 if v_id is null then
  insert into public.mariz_kyb_applications(organization_id,submitted_by)
  values(p_org,v_user) returning id into v_id;
  insert into public.mariz_audit_events(actor_id,organization_id,event_type,entity_id)
  values(v_user,p_org,'kyb.started',v_id);
 end if;
 return v_id;
end $$;
revoke all on function public.mariz_start_kyb(uuid) from public;
grant execute on function public.mariz_start_kyb(uuid) to authenticated;

-- Users only supply private-file references belonging to their own draft application.
create policy kyb_doc_insert on public.mariz_kyb_documents for insert to authenticated
with check (
 uploaded_by=(select auth.uid()) and
 exists(
 select 1 from public.mariz_kyb_applications a
 join storage.objects o on o.bucket_id='mariz-kyb-private' and o.name=storage_path
 where a.id=application_id
 and a.status in ('draft','needs_information')
 and mariz_private.is_owner(a.organization_id)
 and storage_path like a.organization_id::text || '/' || a.id::text || '/%'
 )
);

create function public.mariz_submit_kyb(p_application uuid) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare v_org uuid;
begin
 select organization_id into v_org from public.mariz_kyb_applications
 where id=p_application and status in ('draft','needs_information') for update;
 if v_org is null or not mariz_private.is_owner(v_org) then raise exception 'Application unavailable'; end if;
 if not exists(select 1 from public.mariz_kyb_documents d where d.application_id=p_application and d.document_type='registration_profile') then
   raise exception 'Official registration profile required';
 end if;
 update public.mariz_kyb_applications set status='submitted', submitted_at=now(),submitted_by=auth.uid() where id=p_application;
 update public.mariz_organizations set verification_status='pending',updated_at=now() where id=v_org;
 insert into public.mariz_audit_events(actor_id,organization_id,event_type,entity_id)
 values(auth.uid(),v_org,'kyb.submitted',p_application);
 return true;
end $$;
revoke all on function public.mariz_submit_kyb(uuid) from public;
grant execute on function public.mariz_submit_kyb(uuid) to authenticated;

create function public.mariz_review_kyb(p_application uuid,p_decision text,p_reason text) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare v_org uuid; v_status text;
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
 insert into public.mariz_kyb_decisions(application_id,reviewer_id,decision,reason)
 values(p_application,auth.uid(),p_decision,trim(p_reason));
 update public.mariz_kyb_applications set
 status=case when p_decision='approved' then 'approved'
             when p_decision='rejected' then 'rejected' else 'needs_information' end,
 decided_at=now() where id=p_application;
 update public.mariz_organizations set
 verification_status=case when p_decision='approved' then 'verified'
                          when p_decision='rejected' then 'unverified' else 'unverified' end,
 verified_at=case when p_decision='approved' then now() else null end,
 updated_at=now() where id=v_org;
 insert into public.mariz_audit_events(actor_id,organization_id,event_type,entity_id,detail)
 values(auth.uid(),v_org,'kyb.'||p_decision,p_application,jsonb_build_object('reason',trim(p_reason)));
 return true;
end $$;
revoke all on function public.mariz_review_kyb(uuid,text,text) from public;
grant execute on function public.mariz_review_kyb(uuid,text,text) to authenticated;

-- Staff grants are deliberately service-role / SQL-console only, never client APIs.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('mariz-kyb-private','mariz-kyb-private',false,10485760,array['application/pdf','image/jpeg','image/png'])
on conflict(id) do nothing;
create policy mariz_kyb_upload on storage.objects for insert to authenticated
with check (bucket_id='mariz-kyb-private' and
 exists(select 1 from public.mariz_kyb_applications a
  where a.organization_id::text=split_part(name,'/',1)
    and a.id::text=split_part(name,'/',2)
    and a.status in ('draft','needs_information')
    and mariz_private.is_owner(a.organization_id)));
create policy mariz_kyb_read_private on storage.objects for select to authenticated
using(bucket_id='mariz-kyb-private' and
 exists(select 1 from public.mariz_kyb_applications a
  where a.organization_id::text=split_part(name,'/',1)
    and a.id::text=split_part(name,'/',2)
    and (mariz_private.is_owner(a.organization_id) or mariz_private.is_reviewer())));

-- No authenticated update/delete policies on sensitive evidence.
-- Subscription provisioning/Stripe webhook service will be implemented after independent security tests.
commit;
