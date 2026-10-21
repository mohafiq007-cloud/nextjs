-- MARIZ HQ V2 only. Apply/test on br-empty-band-aoi1kzkc first, never main implicitly.
-- No provider calls, pricing, subscriptions or entitlement grants occur here.
BEGIN;
DO $$BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='mariz_billing_runtime_limited' AND NOT rolsuper AND NOT rolcreaterole AND NOT rolcreatedb)
 OR pg_has_role('mariz_billing_runtime_limited','neon_superuser','member') THEN RAISE EXCEPTION 'Restricted billing runtime required'; END IF;
END$$;
CREATE TABLE IF NOT EXISTS mariz_billing.sandbox_organizations(
 organization_id uuid PRIMARY KEY REFERENCES mariz_core.company_profiles(organization_id),
 enabled boolean NOT NULL DEFAULT false,
 approved_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE mariz_billing.payment_requests ADD COLUMN IF NOT EXISTS idempotency_key uuid;
ALTER TABLE mariz_billing.payment_requests ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES neon_auth."user"(id);
ALTER TABLE mariz_billing.payment_requests ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE mariz_billing.payment_requests ADD COLUMN IF NOT EXISTS issuance_state text NOT NULL DEFAULT 'reserved' CHECK(issuance_state IN('reserved','creating','registered','uncertain'));
CREATE UNIQUE INDEX IF NOT EXISTS billplz_invoice_idempotency ON mariz_billing.payment_requests(organization_id,idempotency_key);
ALTER TABLE mariz_billing.provider_events ADD COLUMN IF NOT EXISTS collection_id text;
ALTER TABLE mariz_billing.provider_events ADD COLUMN IF NOT EXISTS event_source text NOT NULL DEFAULT 'callback' CHECK(event_source IN('callback','reconciliation'));
CREATE TABLE IF NOT EXISTS mariz_billing.audit_events(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 request_id uuid NOT NULL REFERENCES mariz_billing.payment_requests(id),
 organization_id uuid NOT NULL REFERENCES mariz_core.company_profiles(organization_id),
 actor_id uuid REFERENCES neon_auth."user"(id),
 event_type text NOT NULL,
 detail jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION mariz_billing._assert_sandbox_operator(p_actor uuid,p_org uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF p_actor IS NULL OR p_org IS NULL OR NOT EXISTS(
  SELECT 1 FROM neon_auth."user" u JOIN neon_auth.member m ON m."userId"=u.id
  JOIN mariz_billing.sandbox_organizations s ON s.organization_id=m."organizationId"
  WHERE u.id=p_actor AND u."emailVerified"=true AND NOT coalesce(u.banned,false)
  AND m."organizationId"=p_org AND m.role IN('owner','admin') AND s.enabled
 ) THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Sandbox organization operator required'; END IF;
END$$;

CREATE OR REPLACE FUNCTION mariz_billing.billplz_invoice(p_actor uuid,p_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r mariz_billing.payment_requests;
BEGIN
 SELECT * INTO r FROM mariz_billing.payment_requests WHERE id=p_id;
 PERFORM mariz_billing._assert_sandbox_operator(p_actor,r.organization_id);
 RETURN jsonb_build_object('id',r.id,'organization_id',r.organization_id,'amount_minor',r.amount_minor,'collection_id',r.collection_id,'provider_bill_id',r.provider_bill_id,'payment_url',r.payment_url,'status',r.status,'issuance_state',r.issuance_state);
END$$;

CREATE OR REPLACE FUNCTION mariz_billing.reserve_billplz_invoice(p_actor uuid,p_org uuid,p_key uuid,p_collection text,p_amount integer,p_name text,p_email text,p_description text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r mariz_billing.payment_requests;
BEGIN
 PERFORM mariz_billing._assert_sandbox_operator(p_actor,p_org);
 IF p_key IS NULL OR p_amount IS NULL OR p_amount<100 OR p_collection IS NULL OR p_collection!~'^[a-zA-Z0-9_-]{1,64}$'
 OR p_name IS NULL OR length(trim(p_name)) NOT BETWEEN 2 AND 255
 OR p_email IS NULL OR length(p_email)>254 OR p_email!~'^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
 OR p_description IS NULL OR length(trim(p_description)) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'Invalid sandbox invoice'; END IF;
 INSERT INTO mariz_billing.payment_requests(organization_id,idempotency_key,created_by,collection_id,amount_minor,customer_name,customer_email,description)
 VALUES(p_org,p_key,p_actor,p_collection,p_amount,trim(p_name),trim(p_email),trim(p_description))
 ON CONFLICT(organization_id,idempotency_key) DO NOTHING;
 SELECT * INTO r FROM mariz_billing.payment_requests WHERE organization_id=p_org AND idempotency_key=p_key FOR UPDATE;
 IF r.created_by IS DISTINCT FROM p_actor OR r.collection_id IS DISTINCT FROM p_collection OR r.amount_minor IS DISTINCT FROM p_amount
 OR r.customer_name IS DISTINCT FROM trim(p_name) OR r.customer_email IS DISTINCT FROM trim(p_email) OR r.description IS DISTINCT FROM trim(p_description)
 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Idempotency payload conflict'; END IF;
 IF NOT EXISTS(SELECT 1 FROM mariz_billing.audit_events WHERE request_id=r.id AND event_type='invoice.reserved') THEN
  INSERT INTO mariz_billing.audit_events(request_id,organization_id,actor_id,event_type) VALUES(r.id,p_org,p_actor,'invoice.reserved');
 END IF;
 RETURN mariz_billing.billplz_invoice(p_actor,r.id);
END$$;

CREATE OR REPLACE FUNCTION mariz_billing.claim_billplz_invoice(p_actor uuid,p_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r mariz_billing.payment_requests;
BEGIN
 SELECT * INTO r FROM mariz_billing.payment_requests WHERE id=p_id FOR UPDATE;
 PERFORM mariz_billing._assert_sandbox_operator(p_actor,r.organization_id);
 IF r.issuance_state<>'reserved' THEN RETURN false; END IF;
 UPDATE mariz_billing.payment_requests SET issuance_state='creating',updated_at=now() WHERE id=p_id;
 INSERT INTO mariz_billing.audit_events(request_id,organization_id,actor_id,event_type) VALUES(p_id,r.organization_id,p_actor,'invoice.issuance_started');
 RETURN true;
END$$;

CREATE OR REPLACE FUNCTION mariz_billing.mark_billplz_uncertain(p_actor uuid,p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r mariz_billing.payment_requests;
BEGIN
 SELECT * INTO r FROM mariz_billing.payment_requests WHERE id=p_id FOR UPDATE;
 PERFORM mariz_billing._assert_sandbox_operator(p_actor,r.organization_id);
 IF r.issuance_state='creating' THEN
  UPDATE mariz_billing.payment_requests SET issuance_state='uncertain',updated_at=now() WHERE id=p_id;
  INSERT INTO mariz_billing.audit_events(request_id,organization_id,actor_id,event_type) VALUES(p_id,r.organization_id,p_actor,'invoice.issuance_uncertain');
 END IF;
END$$;

CREATE OR REPLACE FUNCTION mariz_billing.register_billplz_invoice(p_actor uuid,p_id uuid,p_bill text,p_collection text,p_amount integer,p_url text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r mariz_billing.payment_requests;
BEGIN
 SELECT * INTO r FROM mariz_billing.payment_requests WHERE id=p_id FOR UPDATE;
 PERFORM mariz_billing._assert_sandbox_operator(p_actor,r.organization_id);
 IF p_bill IS NULL OR p_bill!~'^[a-zA-Z0-9_-]{1,64}$' OR p_collection IS DISTINCT FROM r.collection_id OR p_amount IS DISTINCT FROM r.amount_minor
 OR p_url IS DISTINCT FROM ('https://www.billplz-sandbox.com/bills/'||p_bill)
 OR r.issuance_state NOT IN('creating','uncertain','registered') THEN RAISE EXCEPTION 'Invalid bill registration'; END IF;
 IF r.issuance_state='registered' THEN
  IF r.provider_bill_id IS DISTINCT FROM p_bill THEN RAISE EXCEPTION 'Bill already registered'; END IF;
  RETURN mariz_billing.billplz_invoice(p_actor,p_id);
 END IF;
 UPDATE mariz_billing.payment_requests SET provider_bill_id=p_bill,payment_url=p_url,status='due',issuance_state='registered',updated_at=now() WHERE id=p_id;
 INSERT INTO mariz_billing.audit_events(request_id,organization_id,actor_id,event_type) VALUES(p_id,r.organization_id,p_actor,'invoice.registered');
 RETURN mariz_billing.billplz_invoice(p_actor,p_id);
END$$;

CREATE OR REPLACE FUNCTION mariz_billing._apply_billplz_event(p_bill text,p_amount integer,p_paid boolean,p_state text,p_digest text,p_collection text,p_source text,p_actor uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r mariz_billing.payment_requests; ev bigint;
BEGIN
 IF p_bill IS NULL OR p_bill!~'^[a-zA-Z0-9_-]{1,64}$' OR p_amount IS NULL OR p_amount<=0 OR p_paid IS NULL
 OR p_state IS NULL OR p_state NOT IN('due','paid','deleted') OR p_paid IS DISTINCT FROM(p_state='paid')
 OR p_digest IS NULL OR p_digest!~'^[a-f0-9]{64}$' OR p_source IS NULL OR p_source NOT IN('callback','reconciliation') THEN RETURN false; END IF;
 SELECT * INTO r FROM mariz_billing.payment_requests WHERE provider_bill_id=p_bill AND provider='billplz' FOR UPDATE;
 IF r.id IS NULL OR r.amount_minor IS DISTINCT FROM p_amount OR r.collection_id IS DISTINCT FROM p_collection OR r.issuance_state<>'registered'
 OR NOT EXISTS(SELECT 1 FROM mariz_billing.sandbox_organizations WHERE organization_id=r.organization_id AND enabled) THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM mariz_billing.provider_events WHERE event_signature_sha256=p_digest) THEN
  RETURN EXISTS(SELECT 1 FROM mariz_billing.provider_events WHERE event_signature_sha256=p_digest AND payment_request_id=r.id AND amount_minor=p_amount AND reported_paid=p_paid AND bill_state=p_state AND collection_id=p_collection AND event_source=p_source);
 END IF;
 IF r.status='void' THEN RETURN false; END IF;
 INSERT INTO mariz_billing.provider_events(payment_request_id,provider,event_signature_sha256,bill_state,reported_paid,amount_minor,collection_id,event_source)
 VALUES(r.id,'billplz',p_digest,p_state,p_paid,p_amount,p_collection,p_source)
 ON CONFLICT(event_signature_sha256) DO NOTHING RETURNING id INTO ev;
 IF ev IS NULL THEN RETURN false; END IF;
 IF p_paid THEN UPDATE mariz_billing.payment_requests SET status='paid',paid_at=coalesce(paid_at,now()),updated_at=now() WHERE id=r.id AND status='due';
 ELSIF p_state='deleted' THEN UPDATE mariz_billing.payment_requests SET status='void',updated_at=now() WHERE id=r.id AND status='due'; END IF;
 INSERT INTO mariz_billing.audit_events(request_id,organization_id,actor_id,event_type,detail)
 VALUES(r.id,r.organization_id,p_actor,'payment.'||p_source,jsonb_build_object('state',p_state,'paid',p_paid));
 RETURN true;
END$$;

CREATE OR REPLACE FUNCTION mariz_billing.record_billplz_callback_v2(p_bill text,p_amount integer,p_paid boolean,p_state text,p_digest text,p_collection text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT mariz_billing._apply_billplz_event(p_bill,p_amount,p_paid,p_state,p_digest,p_collection,'callback',NULL);
$$;
CREATE OR REPLACE FUNCTION mariz_billing.record_billplz_reconciliation(p_actor uuid,p_id uuid,p_bill text,p_amount integer,p_paid boolean,p_state text,p_digest text,p_collection text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r mariz_billing.payment_requests;
BEGIN
 SELECT * INTO r FROM mariz_billing.payment_requests WHERE id=p_id FOR UPDATE;
 PERFORM mariz_billing._assert_sandbox_operator(p_actor,r.organization_id);
 IF r.provider_bill_id IS DISTINCT FROM p_bill THEN RETURN false; END IF;
 RETURN mariz_billing._apply_billplz_event(p_bill,p_amount,p_paid,p_state,p_digest,p_collection,'reconciliation',p_actor);
END$$;

REVOKE ALL ON ALL TABLES IN SCHEMA mariz_billing FROM PUBLIC,mariz_billing_runtime_limited;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA mariz_billing FROM PUBLIC,mariz_billing_runtime_limited;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA mariz_billing FROM PUBLIC,mariz_billing_runtime_limited;
GRANT USAGE ON SCHEMA mariz_billing TO mariz_billing_runtime_limited;
GRANT EXECUTE ON FUNCTION mariz_billing.billplz_invoice(uuid,uuid),
 mariz_billing.reserve_billplz_invoice(uuid,uuid,uuid,text,integer,text,text,text),
 mariz_billing.claim_billplz_invoice(uuid,uuid),mariz_billing.mark_billplz_uncertain(uuid,uuid),
 mariz_billing.register_billplz_invoice(uuid,uuid,text,text,integer,text),
 mariz_billing.record_billplz_callback_v2(text,integer,boolean,text,text,text),
 mariz_billing.record_billplz_reconciliation(uuid,uuid,text,integer,boolean,text,text,text)
TO mariz_billing_runtime_limited;
COMMIT;
