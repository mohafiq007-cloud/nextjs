-- Applied only to test/billplz-runtime-security-20261016.
-- Review and authorize each other branch before application.
BEGIN;
CREATE OR REPLACE FUNCTION mariz_billing.record_billplz_callback(p_provider_bill_id text,p_amount_minor integer,p_paid boolean,p_bill_state text,p_event_signature_sha256 text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE v_request_id uuid; v_event_id bigint;
BEGIN
IF p_provider_bill_id IS NULL OR p_provider_bill_id !~ '^[a-zA-Z0-9_-]{1,64}$'
 OR p_amount_minor IS NULL OR p_amount_minor<=0 OR p_paid IS NULL
 OR p_bill_state IS NULL OR p_bill_state NOT IN ('due','paid','deleted')
 OR p_paid IS DISTINCT FROM (p_bill_state='paid')
 OR p_event_signature_sha256 IS NULL OR p_event_signature_sha256 !~ '^[a-f0-9]{64}$' THEN RETURN false; END IF;
SELECT id INTO v_request_id FROM mariz_billing.payment_requests
 WHERE provider='billplz' AND provider_bill_id=p_provider_bill_id AND amount_minor=p_amount_minor AND status IN ('due','paid') FOR UPDATE;
IF v_request_id IS NULL THEN RETURN false; END IF;
INSERT INTO mariz_billing.provider_events(payment_request_id,provider,event_signature_sha256,bill_state,reported_paid,amount_minor)
VALUES(v_request_id,'billplz',p_event_signature_sha256,p_bill_state,p_paid,p_amount_minor)
ON CONFLICT(event_signature_sha256) DO NOTHING RETURNING id INTO v_event_id;
IF v_event_id IS NULL THEN
RETURN EXISTS(SELECT 1 FROM mariz_billing.provider_events WHERE event_signature_sha256=p_event_signature_sha256 AND payment_request_id=v_request_id AND bill_state=p_bill_state AND reported_paid=p_paid AND amount_minor=p_amount_minor);
END IF;
IF p_paid AND p_bill_state='paid' THEN
UPDATE mariz_billing.payment_requests SET status='paid',paid_at=COALESCE(paid_at,now()),updated_at=now() WHERE id=v_request_id AND status='due';
END IF;
RETURN true;
END $fn$;
REVOKE EXECUTE ON FUNCTION mariz_core.my_company_profiles(uuid) FROM mariz_billing_runtime_limited;
REVOKE USAGE ON SCHEMA mariz_core FROM mariz_billing_runtime_limited;
COMMIT;
