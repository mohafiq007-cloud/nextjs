-- Commerce merchant order staging slice. No customer checkout or settlement.
CREATE SCHEMA IF NOT EXISTS mariz_commerce;
REVOKE ALL ON SCHEMA mariz_commerce FROM PUBLIC,anonymous,authenticated;
CREATE TABLE mariz_commerce.catalog_items(
 organization_id uuid NOT NULL REFERENCES neon_auth.organization(id),
 id uuid NOT NULL DEFAULT gen_random_uuid(), name text NOT NULL,
 price_sen bigint NOT NULL CHECK(price_sen BETWEEN 0 AND 99999999),
 enabled boolean NOT NULL DEFAULT true, PRIMARY KEY(organization_id,id));
CREATE TABLE mariz_commerce.orders(
 organization_id uuid NOT NULL REFERENCES neon_auth.organization(id),
 id uuid NOT NULL DEFAULT gen_random_uuid(), actor_id uuid NOT NULL REFERENCES neon_auth."user"(id),
 request_key uuid NOT NULL, request_items jsonb NOT NULL,
 total_sen bigint NOT NULL CHECK(total_sen BETWEEN 0 AND 99999999),
 order_state text NOT NULL DEFAULT 'awaiting_payment' CHECK(order_state IN ('awaiting_payment','cancelled')),
 payment_state text NOT NULL DEFAULT 'pending' CHECK(payment_state='pending'),
 fulfillment_state text NOT NULL DEFAULT 'unfulfilled' CHECK(fulfillment_state='unfulfilled'),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(organization_id,id), UNIQUE(organization_id,request_key));
CREATE TABLE mariz_commerce.order_lines(
 organization_id uuid NOT NULL, order_id uuid NOT NULL, product_id uuid NOT NULL,
 name_snapshot text NOT NULL, unit_price_sen bigint NOT NULL,
 quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 99),
 line_total_sen bigint NOT NULL CHECK(line_total_sen=unit_price_sen*quantity),
 PRIMARY KEY(organization_id,order_id,product_id),
 FOREIGN KEY(organization_id,order_id) REFERENCES mariz_commerce.orders(organization_id,id));
ALTER TABLE mariz_commerce.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mariz_commerce.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE mariz_commerce.order_lines ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA mariz_commerce FROM PUBLIC,anonymous,authenticated;

CREATE FUNCTION mariz_core.api_commerce_create_order(p_organization uuid,p_request_key uuid,p_items jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE actor uuid:=auth.user_id()::uuid; previous mariz_commerce.orders%ROWTYPE;
 item jsonb; product mariz_commerce.catalog_items%ROWTYPE; qty integer;
 total bigint:=0; order_id uuid:=gen_random_uuid(); lines jsonb:='[]'::jsonb;
BEGIN
 PERFORM mariz_core.require_company_admin(actor,p_organization);
 IF p_request_key IS NULL OR p_items IS NULL OR jsonb_typeof(p_items)<>'array' THEN RAISE EXCEPTION 'Invalid order'; END IF;
 IF jsonb_array_length(p_items) NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid order'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_organization::text||p_request_key::text,81));
 SELECT * INTO previous FROM mariz_commerce.orders WHERE organization_id=p_organization AND request_key=p_request_key;
 IF FOUND THEN
  IF previous.actor_id<>actor OR previous.request_items<>p_items THEN RAISE EXCEPTION 'Idempotency conflict'; END IF;
  RETURN jsonb_build_object('id',previous.id,'total_sen',previous.total_sen,'payment_state',previous.payment_state,'replayed',true);
 END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
  IF jsonb_typeof(item)<>'object' OR (SELECT count(*) FROM jsonb_object_keys(item))<>2 OR NOT(item ? 'product_id' AND item ? 'quantity')
    OR jsonb_typeof(item->'quantity')<>'number' OR (item->>'quantity') !~ '^[1-9][0-9]?$'
  THEN RAISE EXCEPTION 'Invalid line'; END IF;
  qty:=(item->>'quantity')::integer;
  SELECT * INTO product FROM mariz_commerce.catalog_items
   WHERE organization_id=p_organization AND id=(item->>'product_id')::uuid AND enabled FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product unavailable'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(lines) l WHERE l->>'product_id'=product.id::text) THEN RAISE EXCEPTION 'Duplicate product'; END IF;
  total:=total+product.price_sen*qty;
  IF total>99999999 THEN RAISE EXCEPTION 'Order limit'; END IF;
  lines:=lines||jsonb_build_array(jsonb_build_object('product_id',product.id,'name',product.name,'price',product.price_sen,'qty',qty));
 END LOOP;
 INSERT INTO mariz_commerce.orders(organization_id,id,actor_id,request_key,request_items,total_sen)
 VALUES(p_organization,order_id,actor,p_request_key,p_items,total);
 INSERT INTO mariz_commerce.order_lines(organization_id,order_id,product_id,name_snapshot,unit_price_sen,quantity,line_total_sen)
 SELECT p_organization,order_id,(l->>'product_id')::uuid,l->>'name',(l->>'price')::bigint,(l->>'qty')::integer,
 (l->>'price')::bigint*(l->>'qty')::integer FROM jsonb_array_elements(lines) l;
 INSERT INTO mariz_core.audit_events(actor_id,organization_id,event_type,subject_id) VALUES(actor,p_organization,'commerce.order_created',order_id);
 RETURN jsonb_build_object('id',order_id,'total_sen',total,'payment_state','pending','replayed',false);
END $fn$;
REVOKE ALL ON FUNCTION mariz_core.api_commerce_create_order(uuid,uuid,jsonb) FROM PUBLIC,anonymous;
GRANT EXECUTE ON FUNCTION mariz_core.api_commerce_create_order(uuid,uuid,jsonb) TO authenticated;

