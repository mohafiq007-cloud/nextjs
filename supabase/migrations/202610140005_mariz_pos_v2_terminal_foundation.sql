-- MARIZ HQ V2 / MARIZ POS foundation (DESIGN-READY; requires dedicated V2 DB).
-- Apply ONLY to a new isolated V2 project, after KYB migrations 001-004.
-- Does NOT migrate, modify, or connect to the Shahira/legacy POS database.
begin;

create table public.mariz_pos_workspaces (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null unique references public.mariz_organizations(id) on delete restrict,
 activation_request_id uuid not null unique references public.mariz_activation_requests(id) on delete restrict,
 workspace_status text not null default 'setup'
   check(workspace_status in ('setup','ready','active','suspended','closed')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.mariz_pos_outlets (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.mariz_pos_workspaces(id) on delete restrict,
 outlet_name text not null check (length(trim(outlet_name)) between 2 and 120),
 outlet_code text not null check (length(trim(outlet_code)) between 2 and 32),
 outlet_status text not null default 'setup' check(outlet_status in ('setup','active','inactive')),
 timezone text not null default 'Asia/Kuala_Lumpur',
 created_at timestamptz not null default now(),
 unique(workspace_id,outlet_code),
 unique(id,workspace_id)
);
create table public.mariz_pos_staff (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.mariz_pos_workspaces(id) on delete restrict,
 user_id uuid references auth.users(id) on delete restrict,
 display_name text not null check(length(trim(display_name)) between 2 and 150),
 role text not null check(role in ('owner','manager','cashier','kitchen','backoffice')),
 staff_status text not null default 'pending'
   check(staff_status in ('pending','approved','suspended','revoked')),
 created_at timestamptz not null default now(),
 unique(id,workspace_id),
 unique(workspace_id,user_id)
);
create table public.mariz_pos_terminal_devices (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.mariz_pos_workspaces(id) on delete restrict,
 outlet_id uuid not null,
 terminal_label text not null check(length(trim(terminal_label)) between 2 and 80),
 device_status text not null default 'unpaired'
   check(device_status in ('unpaired','paired','suspended','revoked')),
 device_secret_hash text,
 paired_at timestamptz,
 last_seen_at timestamptz,
 created_at timestamptz not null default now(),
 unique(id,workspace_id),
 unique(outlet_id,terminal_label),
 foreign key(outlet_id,workspace_id) references public.mariz_pos_outlets(id,workspace_id) on delete restrict
);
create table public.mariz_pos_terminal_pairing (
 id uuid primary key default gen_random_uuid(),
 terminal_id uuid not null references public.mariz_pos_terminal_devices(id) on delete cascade,
 token_hash text not null,
 expires_at timestamptz not null,
 claimed_at timestamptz,
 failed_attempts integer not null default 0 check (failed_attempts between 0 and 20),
 created_at timestamptz not null default now()
);
create unique index mariz_pos_terminal_unclaimed_code on public.mariz_pos_terminal_pairing(terminal_id)
 where claimed_at is null;
create table public.mariz_pos_staff_pin_credentials (
 staff_id uuid primary key references public.mariz_pos_staff(id) on delete cascade,
 pin_hash text not null,
 failures integer not null default 0 check(failures>=0),
 locked_until timestamptz,
 updated_at timestamptz not null default now()
);
create table public.mariz_pos_terminal_sessions (
 id uuid primary key default gen_random_uuid(),
 terminal_id uuid not null references public.mariz_pos_terminal_devices(id) on delete restrict,
 staff_id uuid not null references public.mariz_pos_staff(id) on delete restrict,
 session_token_hash text not null unique,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 revoked_at timestamptz,
 check (expires_at>created_at)
);
create table public.mariz_pos_security_audit (
 id bigint generated always as identity primary key,
 organization_id uuid not null references public.mariz_organizations(id) on delete restrict,
 workspace_id uuid references public.mariz_pos_workspaces(id) on delete restrict,
 actor_id uuid references auth.users(id),
 event_type text not null,
 target_id uuid,
 details jsonb not null default '{}'::jsonb,
 recorded_at timestamptz not null default now()
);

-- Only a trusted provisioning service may create workspaces after confirming
-- company KYB, active plan, accepted terms, payment, and consistent activation ownership.
-- NEVER expose device pairing secrets, staff PIN hashes or terminal session credentials.
alter table public.mariz_pos_workspaces enable row level security;
alter table public.mariz_pos_outlets enable row level security;
alter table public.mariz_pos_staff enable row level security;
alter table public.mariz_pos_terminal_devices enable row level security;
alter table public.mariz_pos_terminal_pairing enable row level security;
alter table public.mariz_pos_staff_pin_credentials enable row level security;
alter table public.mariz_pos_terminal_sessions enable row level security;
alter table public.mariz_pos_security_audit enable row level security;

revoke all on public.mariz_pos_workspaces,public.mariz_pos_outlets,
 public.mariz_pos_staff,public.mariz_pos_terminal_devices,public.mariz_pos_terminal_pairing,
 public.mariz_pos_staff_pin_credentials,public.mariz_pos_terminal_sessions,
 public.mariz_pos_security_audit from anon,authenticated;

-- Back Office can view only workspaces within an organization it manages.
grant select on public.mariz_pos_workspaces,public.mariz_pos_outlets,
 public.mariz_pos_staff,public.mariz_pos_terminal_devices to authenticated;
create policy mariz_pos_workspace_admin_view on public.mariz_pos_workspaces
 for select to authenticated using(mariz_private.is_owner(organization_id));
create policy mariz_pos_outlet_admin_view on public.mariz_pos_outlets
 for select to authenticated using(exists(
   select 1 from public.mariz_pos_workspaces w
   where w.id=workspace_id and mariz_private.is_owner(w.organization_id)
 ));
create policy mariz_pos_staff_admin_view on public.mariz_pos_staff
 for select to authenticated using(exists(
   select 1 from public.mariz_pos_workspaces w
   where w.id=workspace_id and mariz_private.is_owner(w.organization_id)
 ));
create policy mariz_pos_terminal_admin_view on public.mariz_pos_terminal_devices
 for select to authenticated using(exists(
   select 1 from public.mariz_pos_workspaces w
   where w.id=workspace_id and mariz_private.is_owner(w.organization_id)
 ));

-- Deny all direct client writes to business provisioning, pairing, PIN credentials,
-- and sessions. Implement dedicated rate-limited server-side commands only after
-- isolated DB tests and payment/entitlement integration.
commit;
