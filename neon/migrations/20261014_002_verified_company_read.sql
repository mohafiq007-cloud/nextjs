-- MARIZ HQ V2 Neon-native verified company membership read adapter.
-- Apply to the new isolated Neon V2 project after migration 001.
-- The database already has this function; this is its reproducible source.
CREATE OR REPLACE FUNCTION mariz_core.my_company_profiles(p_actor uuid)
RETURNS TABLE (
 organization_id uuid,legal_name text,registration_no text,entity_type text,
 verification_status text,kyb_status text,pos_status text,member_role text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM neon_auth."user" u
   WHERE u.id=p_actor AND u."emailVerified"=true AND coalesce(u.banned,false)=false
 ) THEN RAISE EXCEPTION 'Verified Neon account required'; END IF;
 RETURN QUERY
 SELECT c.organization_id,c.legal_name,c.registration_no,c.entity_type,c.verification_status,
   (SELECT k.status FROM mariz_core.kyb_applications k
      WHERE k.organization_id=c.organization_id ORDER BY k.created_at DESC LIMIT 1),
   (SELECT e.status FROM mariz_core.product_entitlements e
      WHERE e.organization_id=c.organization_id AND e.product_code='pos' LIMIT 1),
   m.role::text
 FROM mariz_core.company_profiles c
 JOIN neon_auth.member m ON m."organizationId"=c.organization_id
 WHERE m."userId"=p_actor ORDER BY c.created_at DESC LIMIT 50;
END $$;
REVOKE ALL ON FUNCTION mariz_core.my_company_profiles(uuid) FROM PUBLIC;
-- Runtime role GRANTs must be explicitly provisioned and tested by Neon ops.
-- Do not use the default Neon API-created role: it inherits neon_superuser.
