-- MARIZ HQ V2 / POS operational foundation.
-- STAGED ONLY: apply after MARIZ V2 migrations 001-004 on a NEW dedicated V2 database.
-- This migration is NOT a live POS implementation and MUST NOT run on Shahira or HQ V1.
begin;

create table public.mariz_pos_workspaces (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null unique references public.mariz_organizations(id),
 product_code text not null default 'pos' check(product_code='pos'),
 status text not null default 'pending' check(status in ('pending','active','suspended','closed')),
 created_at timestamptz not null default now(),
 unique(id,organization_id)
);

create table public.mariz_pos_outlets (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null,
 organization_id uuid not null,
 outlet_name text not null check(length(trim(outlet_name)) between 2 and 140),
 timezone text not null default 'Asia/Kuala_Lumpur',
 currency text not null default 'MYR' check(currency='MYR'),
 outlet_status text not null default 'active' check(outlet_status in ('active','inactive')),
 created_at timestamptz not null default now(),
 foreign key(workspace_id,organization_id) references public.mariz_pos_workspaces(id,organization_id),
 unique(id,organization_id)
);

create table public.mariz_pos_staff (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.mariz_organizations(id),
 staff_name text not null check(length(trim(staff_name)) between 2 and 140),
 role text not null check(role in ('cashier','manager','kitchen')),
 status text not null default 'pending' check(status in ('pending','active','suspended')),
 linked_user_id uuid references auth.users(id),
 created_at timestamptz not null default now(),
 unique(id,organization_id)
);

create table mariz_private.pos_staff_pin_credentials (
 staff_id uuid primary key references public.mariz_pos_staff(id),
 pin_hash text not null,
 failed_attempts integer not null default 0 check(failed_attempts>=0),
 locked_until timestamptz,
 rotated_at timestamptz not null default now()
);
revoke all on mariz_private.pos_staff_pin_credentials from public,anon,authenticated;

create table public.mariz_pos_devices (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null,
 outlet_id uuid not null,
 display_name text not null check(length(trim(display_name)) between 2 and 80),
 status text not null default 'pending' check(status in ('pending','paired','suspended','revoked')),
 credential_fingerprint text,
 paired_at timestamptz,
 revoked_at timestamptz,
 created_at timestamptz not null default now(),
 foreign key(outlet_id,organization_id) references public.mariz_pos_outlets(id,organization_id),
 unique(id,organization_id)
);

create table mariz_private.pos_pairing_challenges (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.mariz_organizations(id),
 device_id uuid not null references public.mariz_pos_devices(id),
 code_hash text not null,
 expires_at timestamptz not null,
 used_at timestamptz,
 attempts integer not null default 0 check(attempts>=0),
 created_at timestamptz not null default now()
);
revoke all on mariz_private.pos_pairing_challenges from public,anon,authenticated;
create index pos_pairing_device_active on mariz_private.pos_pairing_challenges(device_id,expires_at);

create table public.mariz_pos_products (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.mariz_organizations(id),
 name text not null check(length(trim(name)) between 2 and 140),
 price_minor bigint not null check(price_minor>=0),
 currency text not null default 'MYR' check(currency='MYR'),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 unique(id,organization_id)
);

create table public.mariz_pos_shifts (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null,
 device_id uuid not null,
 staff_id uuid not null,
 opened_at timestamptz not null default now(),
 closed_at timestamptz,
 opened_cash_minor bigint not null default 0 check(opened_cash_minor>=0),
 closing_cash_minor bigint check(closing_cash_minor is null or closing_cash_minor>=0),
 foreign key(device_id,organization_id) references public.mariz_pos_devices(id,organization_id),
 foreign key(staff_id,organization_id) references public.mariz_pos_staff(id,organization_id),
 unique(id,organization_id),
 check(closed_at is null or closed_at>=opened_at)
);
create unique index pos_one_open_shift_per_device on public.mariz_pos_shifts(device_id) where closed_at is null;

create table public.mariz_pos_sales (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null,
 shift_id uuid not null,
 outlet_id uuid not null,
 terminal_id uuid not null,
 status text not null default 'recorded' check(status in ('recorded','voided','refunded')),
 currency text not null default 'MYR' check(currency='MYR'),
 total_minor bigint not null check(total_minor>=0),
 idempotency_key text not null check(length(idempotency_key) between 8 and 150),
 created_at timestamptz not null default now(),
 foreign key(shift_id,organization_id) references public.mariz_pos_shifts(id,organization_id),
 foreign key(outlet_id,organization_id) references public.mariz_pos_outlets(id,organization_id),
 foreign key(terminal_id,organization_id) references public.mariz_pos_devices(id,organization_id),
 unique(organization_id,idempotency_key),
 unique(id,organization_id)
);
create index pos_sales_reporting on public.mariz_pos_sales(organization_id,created_at desc);

create table public.mariz_pos_sale_lines (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null,
 sale_id uuid not null,
 product_id uuid,
 item_name_snapshot text not null,
 quantity integer not null check(quantity between 1 and 10000),
 unit_price_minor bigint not null check(unit_price_minor>=0),
 line_total_minor bigint not null check(line_total_minor>=0),
 foreign key(sale_id,organization_id) references public.mariz_pos_sales(id,organization_id),
 foreign key(product_id,organization_id) references public.mariz_pos_products(id,organization_id)
);

create table public.mariz_pos_payments (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null,
 sale_id uuid not null,
 method text not null check(method in ('cash','card','qr','credit','other')),
 paid_minor bigint not null check(paid_minor>=0),
 provider_reference text,
 recorded_at timestamptz not null default now(),
 foreign key(sale_id,organization_id) references public.mariz_pos_sales(id,organization_id)
);

-- Disable accidental direct browser mutations: only future audited server-side RPCs
-- will manage setup, device binding, sessions and immutable transactions.
alter table public.mariz_pos_workspaces enable row level security;
alter table public.mariz_pos_outlets enable row level security;
alter table public.mariz_pos_staff enable row level security;
alter table public.mariz_pos_devices enable row level security;
alter table public.mariz_pos_products enable row level security;
alter table public.mariz_pos_shifts enable row level security;
alter table public.mariz_pos_sales enable row level security;
alter table public.mariz_pos_sale_lines enable row level security;
alter table public.mariz_pos_payments enable row level security;
alter table mariz_private.pos_staff_pin_credentials enable row level security;
alter table mariz_private.pos_pairing_challenges enable row level security;

revoke all on public.mariz_pos_workspaces,public.mariz_pos_outlets,public.mariz_pos_staff,
 public.mariz_pos_devices,public.mariz_pos_products,public.mariz_pos_shifts,
 public.mariz_pos_sales,public.mariz_pos_sale_lines,public.mariz_pos_payments
 from anon,authenticated;
grant select on public.mariz_pos_workspaces,public.mariz_pos_outlets,public.mariz_pos_staff,
 public.mariz_pos_devices,public.mariz_pos_products,public.mariz_pos_shifts,
 public.mariz_pos_sales,public.mariz_pos_sale_lines,public.mariz_pos_payments to authenticated;

create policy pos_ws_admin_read on public.mariz_pos_workspaces for select to authenticated
 using(mariz_private.is_owner(organization_id));
create policy pos_outlet_admin_read on public.mariz_pos_outlets for select to authenticated
 using(mariz_private.is_owner(organization_id));
create policy pos_staff_admin_read on public.mariz_pos_staff for select to authenticated
 using(mariz_private.is_owner(organization_id));
create policy pos_device_admin_read on public.mariz_pos_devices for select to authenticated
 using(mariz_private.is_owner(organization_id));
create policy pos_menu_admin_read on public.mariz_pos_products for select to authenticated
 using(mariz_private.is_owner(organization_id));
create policy pos_shifts_admin_read on public.mariz_pos_shifts for select to authenticated
 using(mariz_private.is_owner(organization_id));
create policy pos_sales_admin_read on public.mariz_pos_sales for select to authenticated
 using(mariz_private.is_owner(organization_id));
create policy pos_lines_admin_read on public.mariz_pos_sale_lines for select to authenticated
 using(mariz_private.is_owner(organization_id));
create policy pos_payments_admin_read on public.mariz_pos_payments for select to authenticated
 using(mariz_private.is_owner(organization_id));

-- No self-service activation RPC until billing acceptance and entitlement verification
-- are implemented. No client-accessible PIN verification RPC until device credentials
-- and rate limiting are implemented. No financial inserts until atomic sale posting exists.
commit;
