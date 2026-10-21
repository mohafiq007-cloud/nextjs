-- 007: review candidate. Run on disposable staging only; not applied to main.
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

