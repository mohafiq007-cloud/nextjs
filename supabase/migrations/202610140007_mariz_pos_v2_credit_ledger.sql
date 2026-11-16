-- MARIZ POS V2 / customer credit ledger data model.
-- STAGED ONLY. NEVER apply to Shahira, production MARIZ HQ V1, or existing shared databases.
-- Apply only after migrations 001-006 on a brand-new V2 database.
begin;
create table public.mariz_pos_customers(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.mariz_organizations(id),
 display_name text not null check(length(trim(display_name)) between 2 and 140),
 phone_e164 text not null check(phone_e164 ~ '^[+][1-9][0-9]{7,14}$'),
 created_at timestamptz not null default now(),
 unique(organization_id,phone_e164),
 unique(id,organization_id)
);
-- Payment references must be constrained to the SAME organization.
alter table public.mariz_pos_payments
 add constraint mariz_pos_payments_org_id_unique unique(id,organization_id);
create table public.mariz_pos_credit_ledger(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null,
 customer_id uuid not null,
 source_payment_id uuid,
 source_sale_id uuid,
 entry_type text not null check(entry_type in ('credit_issued','credit_used','credit_reversed')),
 amount_minor bigint not null check(amount_minor <> 0),
 currency text not null default 'MYR' check(currency='MYR'),
 idempotency_key text not null check(length(idempotency_key) between 8 and 150),
 created_at timestamptz not null default now(),
 foreign key(customer_id,organization_id) references public.mariz_pos_customers(id,organization_id),
 foreign key(source_sale_id,organization_id) references public.mariz_pos_sales(id,organization_id),
 foreign key(source_payment_id,organization_id) references public.mariz_pos_payments(id,organization_id),
 unique(organization_id,idempotency_key),
 check(
    (entry_type='credit_issued' and amount_minor>0) or
    (entry_type in ('credit_used','credit_reversed') and amount_minor<0)
 )
);
create unique index mariz_credit_issue_once_per_payment
 on public.mariz_pos_credit_ledger(source_payment_id) where entry_type='credit_issued';
create index mariz_pos_credit_customer_history
 on public.mariz_pos_credit_ledger(organization_id,customer_id,created_at desc);
alter table public.mariz_pos_customers enable row level security;
alter table public.mariz_pos_credit_ledger enable row level security;
revoke all on public.mariz_pos_customers,public.mariz_pos_credit_ledger from anon,authenticated;
grant select on public.mariz_pos_customers,public.mariz_pos_credit_ledger to authenticated;
create policy pos_customer_admin_read on public.mariz_pos_customers for select to authenticated
using(mariz_private.is_owner(organization_id));
create policy pos_customer_credit_admin_read on public.mariz_pos_credit_ledger for select to authenticated
using(mariz_private.is_owner(organization_id));
-- No authenticated INSERT/UPDATE/DELETE; trusted atomic posting must enforce
-- payment linkage, customer identity, company ownership, sufficient credit balance,
-- and credit-to-sale posting in the same DB transaction. Out-of-scope until verified.
commit;
