-- MARIZ Commerce schema — DESIGN REFERENCE ONLY (21 October 2026)
-- NO migration was executed. Review actual MARIZ HQ V2 Neon schema and permissions
-- before creating a production migration. Do not create a second HQ identity database.
-- Use existing HQ organization/tenant IDs, auth subject IDs and audit policies.
-- All amounts in MYR sen as integers (BIGINT). Times stored in timestamptz UTC.
-- Hostnames, email, phone, PII and provider credentials require privacy/security review.

CREATE TABLE commerce_merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hq_tenant_id uuid NOT NULL UNIQUE,
  display_name text NOT NULL,
  currency char(3) NOT NULL DEFAULT 'MYR' CHECK (currency='MYR'),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sandbox','active','suspended','closed')),
  timezone text NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE commerce_customer_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES commerce_merchants(id),
  auth_subject text NOT NULL, -- verified tenant-scoped auth subject from server provider
  display_name text NOT NULL,
  email_ciphertext bytea, -- avoid raw PII where not essential
  phone_ciphertext bytea,
  consent_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (merchant_id, auth_subject),
  UNIQUE (merchant_id, id)
);
CREATE TABLE commerce_customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES commerce_merchants(id),
  customer_id uuid NOT NULL,
  label text,
  address_ciphertext bytea NOT NULL,
  lat numeric(10,7),
  lng numeric(10,7),
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (merchant_id,customer_id) REFERENCES commerce_customer_accounts(merchant_id,id)
);
CREATE TABLE commerce_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES commerce_merchants(id),
  sku text,
  name text NOT NULL,
  category text,
  description text,
  price_sen bigint NOT NULL CHECK (price_sen>=0),
  enabled boolean NOT NULL DEFAULT true,
  image_asset_key text,
  external_inventory_ref text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (merchant_id,sku),
  UNIQUE (merchant_id,id)
);
CREATE TABLE commerce_storefront_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES commerce_merchants(id),
  version_number integer NOT NULL CHECK (version_number>0),
  state text NOT NULL CHECK (state IN ('draft','reviewed','published','archived')),
  design_json jsonb NOT NULL, -- sanitized tokens, sections, image keys, never scripts
  catalog_snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (merchant_id,version_number),
  UNIQUE (merchant_id,id)
);
CREATE TABLE commerce_published_storefronts (
  merchant_id uuid PRIMARY KEY REFERENCES commerce_merchants(id),
  published_version_id uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (merchant_id,published_version_id) REFERENCES commerce_storefront_versions(merchant_id,id)
);
CREATE TABLE commerce_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES commerce_merchants(id),
  normalized_hostname text NOT NULL UNIQUE,
  provider_domain_ref text,
  verification_state text NOT NULL DEFAULT 'pending'
    CHECK (verification_state IN ('pending','challenge','verified','failed','released')),
  tls_state text NOT NULL DEFAULT 'pending',
  verified_at timestamptz,
  last_checked_at timestamptz,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (merchant_id,id)
);
CREATE TABLE commerce_connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES commerce_merchants(id),
  provider text NOT NULL CHECK (provider IN ('billplz','lalamove','easyparcel','grabexpress','manual')),
  environment text NOT NULL CHECK (environment IN ('sandbox','production')),
  status text NOT NULL DEFAULT 'unconfigured',
  credential_vault_ref text, -- pointer only, encrypted per-merchant secrets elsewhere
  provider_account_ref text,
  capabilities jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_verified_at timestamptz,
  UNIQUE (merchant_id,provider,environment),
  UNIQUE (merchant_id,id)
);
CREATE TABLE commerce_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES commerce_merchants(id),
  customer_id uuid,
  public_order_ref text NOT NULL,
  state text NOT NULL DEFAULT 'DRAFT',
  payment_state text NOT NULL DEFAULT 'PENDING',
  fulfilment text NOT NULL CHECK (fulfilment IN ('pickup','delivery','manual')),
  requested_at timestamptz,
  subtotal_sen bigint NOT NULL CHECK (subtotal_sen>=0),
  customer_delivery_fee_sen bigint NOT NULL DEFAULT 0 CHECK (customer_delivery_fee_sen>=0),
  tax_sen bigint NOT NULL DEFAULT 0 CHECK (tax_sen>=0),
  discount_sen bigint NOT NULL DEFAULT 0 CHECK (discount_sen>=0),
  total_sen bigint NOT NULL CHECK (total_sen>=0),
  currency char(3) NOT NULL DEFAULT 'MYR' CHECK (currency='MYR'),
  order_idempotency_key text NOT NULL,
  delivery_address_ciphertext bytea,
  customer_note_ciphertext bytea,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (merchant_id,public_order_ref),
  UNIQUE (merchant_id,order_idempotency_key),
  UNIQUE (merchant_id,id),
  FOREIGN KEY (merchant_id,customer_id) REFERENCES commerce_customer_accounts(merchant_id,id)
);
CREATE TABLE commerce_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL,
  order_id uuid NOT NULL,
  product_id uuid,
  product_name_snapshot text NOT NULL,
  sku_snapshot text,
  options_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  unit_price_sen bigint NOT NULL CHECK (unit_price_sen>=0),
  quantity integer NOT NULL CHECK (quantity>0),
  line_total_sen bigint NOT NULL CHECK (line_total_sen>=0),
  FOREIGN KEY (merchant_id,order_id) REFERENCES commerce_orders(merchant_id,id),
  FOREIGN KEY (merchant_id,product_id) REFERENCES commerce_products(merchant_id,id)
);
CREATE TABLE commerce_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL,
  order_id uuid NOT NULL,
  connector_id uuid,
  provider text NOT NULL,
  provider_bill_id text,
  provider_collection_id text,
  state text NOT NULL DEFAULT 'PENDING',
  amount_sen bigint NOT NULL CHECK (amount_sen>=0),
  currency char(3) NOT NULL DEFAULT 'MYR',
  checkout_url text,
  attempt_key text NOT NULL,
  verified_paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (merchant_id,order_id,attempt_key),
  UNIQUE (provider,provider_bill_id),
  FOREIGN KEY (merchant_id,order_id) REFERENCES commerce_orders(merchant_id,id),
  FOREIGN KEY (merchant_id,connector_id) REFERENCES commerce_connectors(merchant_id,id)
);
CREATE TABLE commerce_delivery_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL,
  order_id uuid NOT NULL,
  connector_id uuid NOT NULL,
  provider_quote_id text,
  state text NOT NULL DEFAULT 'QUOTED',
  service_type text NOT NULL,
  merchant_provider_cost_sen bigint NOT NULL CHECK (merchant_provider_cost_sen>=0),
  customer_charge_sen bigint NOT NULL CHECK (customer_charge_sen>=0),
  currency char(3) NOT NULL DEFAULT 'MYR',
  expires_at timestamptz NOT NULL,
  location_snapshot jsonb NOT NULL, -- encrypt if provider-supplied addresses are sensitive
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (merchant_id,order_id) REFERENCES commerce_orders(merchant_id,id),
  FOREIGN KEY (merchant_id,connector_id) REFERENCES commerce_connectors(merchant_id,id),
  UNIQUE (merchant_id,id)
);
CREATE TABLE commerce_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL,
  order_id uuid NOT NULL,
  quote_id uuid,
  connector_id uuid,
  provider_order_id text,
  booking_idempotency_key text NOT NULL,
  state text NOT NULL DEFAULT 'NOT_BOOKED',
  provider_cost_sen bigint CHECK (provider_cost_sen>=0),
  booked_at timestamptz,
  delivered_at timestamptz,
  UNIQUE (merchant_id,order_id,booking_idempotency_key),
  UNIQUE (connector_id,provider_order_id),
  FOREIGN KEY (merchant_id,order_id) REFERENCES commerce_orders(merchant_id,id),
  FOREIGN KEY (merchant_id,quote_id) REFERENCES commerce_delivery_quotes(merchant_id,id),
  FOREIGN KEY (merchant_id,connector_id) REFERENCES commerce_connectors(merchant_id,id)
);
CREATE TABLE commerce_provider_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL,
  connector_id uuid NOT NULL,
  event_type text NOT NULL,
  provider_event_key text NOT NULL,
  signature_valid boolean NOT NULL DEFAULT false,
  payload_hash text NOT NULL, -- redacted payload retained under data retention policy
  processed_at timestamptz,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connector_id,provider_event_key),
  FOREIGN KEY (merchant_id,connector_id) REFERENCES commerce_connectors(merchant_id,id)
);
CREATE TABLE commerce_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid REFERENCES commerce_merchants(id),
  actor_subject text,
  action text NOT NULL,
  entity_kind text,
  entity_id uuid,
  request_id text,
  redacted_detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Apply RLS/policies and full auth validation in a separately reviewed migration.
-- Before any live API, tenant isolation MUST be enforced on all rows by session
-- identity AND server-authenticated domain mapping. NEVER use merchant_id from
-- untrusted client input as the sole authorization condition.
-- RLS policies, triggers, role grants, encryption, deletion/retention and indexes
-- require alignment with actual HQ V2 Neon schema; these are not supplied here.
