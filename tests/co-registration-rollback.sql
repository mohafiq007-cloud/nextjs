DO $test$
DECLARE a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); o uuid:=gen_random_uuid(); other uuid:=gen_random_uuid(); result uuid;
BEGIN
 BEGIN
 EXECUTE $migration$-- 007: review candidate. Run on disposable staging only; not applied to main.
-- Existing grants/ownership remain unchanged by CREATE OR REPLACE.
CREATE OR REPLACE FUNCTION mariz_core.register_company_profile(
 p_actor uuid,p_organization uuid,p_legal_name text,p_entity_type text,
 p_registration_no text,p_registered_address text,p_business_email text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
DECLARE existing mariz_core.company_profiles%ROWTYPE;
BEGIN
 PERFORM mariz_core.require_company_admin(p_actor,p_organization);
 IF p_legal_name IS NULL OR p_registration_no IS NULL OR p_registered_address IS NULL OR p_business_email IS NULL OR
    p_entity_type IS NULL OR p_entity_type NOT IN ('company','sole_proprietor','partnership','llp','society','other') OR
    length(trim(p_legal_name)) NOT BETWEEN 3 AND 200 OR length(trim(p_registration_no)) NOT BETWEEN 4 AND 80 OR
    length(regexp_replace(upper(p_registration_no),'[^A-Z0-9]','','g'))<4 OR
    length(trim(p_registered_address)) NOT BETWEEN 8 AND 700 OR
    p_business_email !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
 THEN RAISE EXCEPTION 'Incomplete company registration'; END IF;
 -- Serialize actor registrations to enforce daily limit, then organization retries.
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_actor::text,71));
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_organization::text,72));
 SELECT * INTO existing FROM mariz_core.company_profiles WHERE organization_id=p_organization;
 IF FOUND THEN
   IF existing.registration_normalized=regexp_replace(upper(p_registration_no),'[^A-Z0-9]','','g')
      AND existing.legal_name=trim(p_legal_name) AND existing.entity_type=p_entity_type
      AND existing.registered_address=trim(p_registered_address)
      AND existing.business_email=lower(trim(p_business_email))
   THEN RETURN p_organization; END IF;
   RAISE EXCEPTION 'Registration conflicts with existing profile; support review required';
 END IF;
 IF (SELECT count(*) FROM mariz_core.company_profiles WHERE created_by=p_actor AND created_at>now()-interval '24 hours')>=3
 THEN RAISE EXCEPTION 'Company registration rate limit'; END IF;
 INSERT INTO mariz_core.company_profiles(organization_id,legal_name,entity_type,registration_no,registered_address,business_email,created_by)
 VALUES(p_organization,trim(p_legal_name),p_entity_type,trim(p_registration_no),trim(p_registered_address),lower(trim(p_business_email)),p_actor);
 INSERT INTO mariz_core.audit_events(actor_id,organization_id,event_type,subject_id)
 VALUES(p_actor,p_organization,'company.profile_created',p_organization);
 RETURN p_organization;
END $function$;
$migration$;
 INSERT INTO neon_auth."user"(id,name,email,"emailVerified") VALUES(a,'Synthetic recovery A',a::text||'@example.invalid',true),(b,'Synthetic recovery B',b::text||'@example.invalid',true);
 INSERT INTO neon_auth.organization(id,name,slug,"createdAt") VALUES(o,'Synthetic A','test-'||o,now()),(other,'Synthetic B','test-'||other,now());
 INSERT INTO neon_auth.member("organizationId","userId",role,"createdAt") VALUES(o,a,'owner',now()),(other,b,'owner',now());
 result:=mariz_core.register_company_profile(a,o,'Synthetic A','company','TEST-'||o,'Synthetic test address','test@example.invalid');
 IF result<>o THEN RAISE EXCEPTION 'unexpected organization'; END IF;
 result:=mariz_core.register_company_profile(a,o,'Synthetic A','company','TEST'||replace(o::text,'-',''),'Synthetic test address','TEST@example.invalid');
 IF (SELECT count(*) FROM mariz_core.company_profiles WHERE organization_id=o)<>1 THEN RAISE EXCEPTION 'duplicate profile'; END IF;
 IF (SELECT count(*) FROM mariz_core.audit_events WHERE organization_id=o AND event_type='company.profile_created')<>1 THEN RAISE EXCEPTION 'duplicate audit'; END IF;
 BEGIN
 PERFORM mariz_core.register_company_profile(a,o,'Altered name','company','TEST-'||o,'Synthetic test address','test@example.invalid');
 RAISE EXCEPTION 'changed replay accepted' USING ERRCODE='ZX002';
 EXCEPTION WHEN OTHERS THEN IF SQLSTATE='ZX002' THEN RAISE; END IF; END;
 BEGIN
 PERFORM mariz_core.register_company_profile(b,o,'Synthetic A','company','TEST-'||o,'Synthetic test address','test@example.invalid');
 RAISE EXCEPTION 'foreign actor accepted' USING ERRCODE='ZX002';
 EXCEPTION WHEN OTHERS THEN IF SQLSTATE='ZX002' THEN RAISE; END IF; END;
 UPDATE neon_auth."user" SET "emailVerified"=false WHERE id=a;
 BEGIN
 PERFORM mariz_core.register_company_profile(a,o,'Synthetic A','company','TEST-'||o,'Synthetic test address','test@example.invalid');
 RAISE EXCEPTION 'unverified retry accepted' USING ERRCODE='ZX002';
 EXCEPTION WHEN OTHERS THEN IF SQLSTATE='ZX002' THEN RAISE; END IF; END;
 RAISE EXCEPTION 'all recovery assertions passed; rollback' USING ERRCODE='ZX001';
 EXCEPTION WHEN SQLSTATE 'ZX001' THEN RAISE NOTICE 'PASS: same-profile replay, normalized SSM, one audit, conflict denial, tenant denial, unverified denial; all writes rolled back'; END;
END $test$;
