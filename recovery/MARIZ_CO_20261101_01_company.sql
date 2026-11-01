-- MARIZ_CO_20261101_01: additive company read interfaces.
-- Target verified from live NEON_DATA_API_URL and Neon endpoint metadata:
-- small-cell-04853885 / br-bold-unit-aothxcnn / marizhq_v2.
-- Apply only after recording function absence. Never changes membership/data.
CREATE FUNCTION mariz_core.api_client_context() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $body$
DECLARE actor uuid=auth.user_id()::uuid; company record; total integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM neon_auth."user" u WHERE u.id=actor AND u."emailVerified"=true AND coalesce(u.banned,false)=false) THEN RAISE EXCEPTION 'Verified account required'; END IF;
 SELECT count(*) INTO total FROM mariz_core.api_my_companies();
 IF total<>1 THEN RAISE EXCEPTION 'One registered company required'; END IF;
 SELECT * INTO STRICT company FROM mariz_core.api_my_companies();
 RETURN jsonb_build_object('actor_id',actor,'company_id',company.organization_id,'role',company.member_role,'approved',company.verification_status='verified');
END $body$;
REVOKE ALL ON FUNCTION mariz_core.api_client_context() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mariz_core.api_client_context() TO authenticated;
CREATE FUNCTION mariz_core.api_client_workspace() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $body$
DECLARE context jsonb; company uuid; contact jsonb; members jsonb; more boolean;
BEGIN
 context=mariz_core.api_client_context();
 IF context->>'role' NOT IN ('owner','admin') THEN RAISE EXCEPTION 'Company administrator access required'; END IF;
 company=(context->>'company_id')::uuid;
 SELECT jsonb_build_object('registeredAddress',registered_address,'businessEmail',business_email,'country',country_code) INTO contact FROM mariz_core.company_profiles WHERE organization_id=company;
 IF contact IS NULL THEN RAISE EXCEPTION 'Company record unavailable'; END IF;
 SELECT jsonb_agg(jsonb_build_object('name',x.name,'role',x.role) ORDER BY x.created_at,x.id) INTO members
 FROM (SELECT u.name,m.role::text AS role,m."createdAt" AS created_at,m.id FROM neon_auth.member m JOIN neon_auth."user" u ON u.id=m."userId" WHERE m."organizationId"=company ORDER BY m."createdAt",m.id LIMIT 100) x;
 SELECT count(*)>100 INTO more FROM neon_auth.member WHERE "organizationId"=company;
 RETURN jsonb_build_object('companyId',company,'contact',contact,'members',coalesce(members,'[]'::jsonb),'hasMoreMembers',more);
END $body$;
REVOKE ALL ON FUNCTION mariz_core.api_client_workspace() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mariz_core.api_client_workspace() TO authenticated;
