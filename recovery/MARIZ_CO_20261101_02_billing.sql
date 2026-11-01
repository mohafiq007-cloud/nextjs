-- MARIZ_CO_20261101_02. Billing source: br-summer-morning-aofdcsp3.
-- New NOLOGIN role initially; enable only when its generated credential is secured.
CREATE ROLE mariz_co_billing_reader NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 4;
CREATE FUNCTION mariz_billing_live.client_workspace_production(p_company uuid,p_branch text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $body$
DECLARE invoices jsonb; more boolean;
BEGIN
 IF p_company IS NULL OR p_branch IS DISTINCT FROM 'br-bold-unit-aothxcnn' THEN RAISE EXCEPTION 'Invalid company context'; END IF;
 -- Exact authoritative organization identity only. Never infer a link from email/name.
 IF NOT EXISTS(SELECT 1 FROM mariz_billing_live.billing_organizations WHERE organization_id=p_company AND enabled) THEN
 RETURN jsonb_build_object('state','not_connected','invoices','[]'::jsonb,'subscriptions','[]'::jsonb,'hasOlderInvoices',false); END IF;
 SELECT jsonb_agg(jsonb_build_object('id',x.id,'amountMinor',x.amount_minor,'currency',x.currency,'description',x.description,'status',x.status,'issuanceState',x.issuance_state,'paymentUrl',CASE WHEN x.status IN('due','paid') AND x.payment_url ~ '^https://www[.]billplz[.]com/bills/[A-Za-z0-9_-]+$' THEN x.payment_url ELSE NULL END,'createdAt',x.created_at,'paidAt',x.paid_at) ORDER BY x.created_at DESC,x.id DESC) INTO invoices
 FROM (SELECT id,amount_minor,currency,description,status,issuance_state,payment_url,created_at,paid_at FROM mariz_billing_live.payment_requests WHERE organization_id=p_company ORDER BY created_at DESC,id DESC LIMIT 100) x;
 SELECT count(*)>100 INTO more FROM mariz_billing_live.payment_requests WHERE organization_id=p_company;
 -- No durable subscription-term table exists in this production schema.
 -- A paid invoice is never represented as a subscription or POS entitlement.
 RETURN jsonb_build_object('state','connected','invoices',coalesce(invoices,'[]'::jsonb),'subscriptions','[]'::jsonb,'hasOlderInvoices',more);
END $body$;
REVOKE ALL ON FUNCTION mariz_billing_live.client_workspace_production(uuid,text) FROM PUBLIC;
GRANT USAGE ON SCHEMA mariz_billing_live TO mariz_co_billing_reader;
GRANT EXECUTE ON FUNCTION mariz_billing_live.client_workspace_production(uuid,text) TO mariz_co_billing_reader;
-- No table grants, operator grants, payment writes or callbacks are changed.
