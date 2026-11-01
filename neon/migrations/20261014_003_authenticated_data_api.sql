-- MARIZ HQ V2 JWT-scoped Neon Data API; use only on the isolated V2 database.
-- Prerequisite: provision Neon Auth and Data API with add_default_grants=false.
-- These functions were applied to the isolated V2 database and privilege checked.
CREATE OR REPLACE FUNCTION mariz_core.api_my_companies()
RETURNS TABLE(organization_id uuid,legal_name text,registration_no text,entity_type text,verification_status text,kyb_status text,pos_status text,member_role text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT * FROM mariz_core.my_company_profiles(auth.user_id()::uuid) $$;
CREATE OR REPLACE FUNCTION mariz_core.api_register_company(
p_organization uuid,p_legal_name text,p_entity_type text,p_registration_no text,p_registered_address text,p_business_email text)
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path=''
AS $$ SELECT mariz_core.register_company_profile(auth.user_id()::uuid,p_organization,p_legal_name,p_entity_type,p_registration_no,p_registered_address,p_business_email) $$;
CREATE OR REPLACE FUNCTION mariz_core.api_start_kyb(p_organization uuid)
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path=''
AS $$ SELECT mariz_core.start_kyb(auth.user_id()::uuid,p_organization) $$;
REVOKE ALL ON FUNCTION mariz_core.api_my_companies() FROM PUBLIC;
REVOKE ALL ON FUNCTION mariz_core.api_register_company(uuid,text,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION mariz_core.api_start_kyb(uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA mariz_core TO authenticated;
GRANT EXECUTE ON FUNCTION mariz_core.api_my_companies() TO authenticated;
GRANT EXECUTE ON FUNCTION mariz_core.api_register_company(uuid,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION mariz_core.api_start_kyb(uuid) TO authenticated;
-- Never grant direct table access or approval to authenticated / anonymous.
