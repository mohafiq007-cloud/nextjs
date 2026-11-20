-- MARIZ HQ V2 / Billplz sandbox preparation only.
-- NOT APPLIED TO NEON. No prices, customer charges, subscriptions, or
-- entitlement activation are introduced by this migration.
-- Apply only after V2 role/tenant authorization blockers are resolved.

BEGIN;

CREATE SCHEMA IF NOT EXISTS mariz_billing;
REVOKE ALL ON SCHEMA mariz_billing FROM PUBLIC;

CREATE TABLE IF NOT EXISTS mariz_billing.payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES mariz_core.company_profiles(organization_id),
  product_code text NULL REFERENCES mariz_core.products(product_code),
  provider text NOT NULL DEFAULT 'billplz' CHECK (provider='billplz'),
  provider_bill_id text UNIQUE,
  collection_id text,
  payment_url text,
  currency text NOT NULL DEFAULT 'MYR' CHECK (currency='MYR'),
  amount_minor integer NOT NULL CHECK (amount_minor>0),
  customer_email text NOT NULL,
  description text NOT NULL,
  billing_kind text NOT NULL DEFAULT 'one_off'
    CHECK (billing_kind IN ('one_off','manual_recurring_invoice','setup_fee')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','due','paid','void')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE INDEX IF NOT EXISTS billplz_payment_requests_organization_created
  ON mariz_billing.payment_requests(organization_id,created_at DESC);

CREATE TABLE IF NOT EXISTS mariz_billing.provider_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payment_request_id uuid NOT NULL REFERENCES mariz_billing.payment_requests(id),
  provider text NOT NULL DEFAULT 'billplz' CHECK (provider='billplz'),
  event_signature_sha256 text NOT NULL UNIQUE,
  bill_state text NOT NULL,
  reported_paid boolean NOT NULL,
  amount_minor integer NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

-- App server verifies Billplz X Signature before this function is called.
-- Function confirms a previously registered bill matches the amount, records
-- the callback once, and marks it paid. It NEVER grants product entitlements.
CREATE OR REPLACE FUNCTION mariz_billing.record_billplz_callback(
  p_provider_bill_id text,
  p_amount_minor integer,
  p_paid boolean,
  p_bill_state text,
  p_event_signature_sha256 text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $body$
DECLARE
  v_request_id uuid;
BEGIN
  IF p_provider_bill_id IS NULL OR p_amount_minor IS NULL OR p_amount_minor<=0
     OR p_bill_state NOT IN ('due','paid','deleted')
     OR p_event_signature_sha256 !~ '^[a-f0-9]{64}$' THEN
    RETURN false;
  END IF;

  SELECT id INTO v_request_id
  FROM mariz_billing.payment_requests
  WHERE provider='billplz'
    AND provider_bill_id=p_provider_bill_id
    AND amount_minor=p_amount_minor;

  IF v_request_id IS NULL THEN RETURN false; END IF;

  INSERT INTO mariz_billing.provider_events (
    payment_request_id, provider, event_signature_sha256,
    bill_state, reported_paid, amount_minor
  ) VALUES (
    v_request_id, 'billplz', p_event_signature_sha256,
    p_bill_state, p_paid, p_amount_minor
  )
  ON CONFLICT (event_signature_sha256) DO NOTHING;

  IF p_paid IS TRUE AND p_bill_state='paid' THEN
    UPDATE mariz_billing.payment_requests
       SET status='paid', paid_at=COALESCE(paid_at,now()), updated_at=now()
     WHERE id=v_request_id AND status IN ('due','paid');
  END IF;
  RETURN true;
END;
$body$;

REVOKE ALL ON ALL TABLES IN SCHEMA mariz_billing FROM PUBLIC;
REVOKE ALL ON FUNCTION mariz_billing.record_billplz_callback(text,integer,boolean,text,text) FROM PUBLIC;

-- DO NOT grant application access while mariz_v2_runtime inherits neon_superuser.
-- A separate least-privilege grant is required after runtime role remediation.

COMMIT;
