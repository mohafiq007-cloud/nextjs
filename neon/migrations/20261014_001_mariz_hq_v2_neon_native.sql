-- MARIZ HQ V2 Neon-native database snapshot, generated from verified isolated Neon schema on 2026-10-14.
-- Prerequisite: provision managed Neon Auth (better_auth), so neon_auth.user/organization/member exist.
-- Create on a FRESH dedicated Neon project ONLY; NEVER run on Shahira, MHQ or Kiefa databases.
-- Tables and access functions reflect the actual MARIZ HQ V2 isolated database.
CREATE SCHEMA IF NOT EXISTS mariz_core;
CREATE SCHEMA IF NOT EXISTS mariz_private;

CREATE TABLE IF NOT EXISTS "mariz_core"."audit_events" (
  "id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "actor_id" uuid,
  "organization_id" uuid,
  "event_type" text NOT NULL,
  "subject_id" uuid,
  "detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "mariz_core"."company_profiles" (
  "organization_id" uuid NOT NULL,
  "country_code" text DEFAULT 'MY'::text NOT NULL,
  "registrar" text DEFAULT 'SSM'::text NOT NULL,
  "entity_type" text NOT NULL,
  "legal_name" text NOT NULL,
  "registration_no" text NOT NULL,
  "registration_normalized" text GENERATED ALWAYS AS (regexp_replace(upper(registration_no), '[^A-Z0-9]'::text, ''::text, 'g'::text)) STORED,
  "registered_address" text NOT NULL,
  "business_email" text NOT NULL,
  "created_by" uuid NOT NULL,
  "verification_status" text DEFAULT 'draft'::text NOT NULL,
  "verified_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "mariz_core"."kyb_applications" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "submitted_by" uuid,
  "policy_version" text DEFAULT 'MY-2026-10-v1'::text NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "submitted_at" timestamp with time zone,
  "decided_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "mariz_core"."kyb_checks" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL,
  "check_code" text NOT NULL,
  "result" text NOT NULL,
  "reviewer_id" uuid NOT NULL,
  "note" text,
  "checked_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "mariz_core"."kyb_decisions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL,
  "reviewer_id" uuid NOT NULL,
  "decision" text NOT NULL,
  "reason" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "mariz_core"."kyb_documents" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL,
  "uploaded_by" uuid NOT NULL,
  "kind" text NOT NULL,
  "storage_bucket" text DEFAULT 'mariz-kyb-private'::text NOT NULL,
  "storage_key" text NOT NULL,
  "mime_type" text NOT NULL,
  "size_bytes" integer NOT NULL,
  "sha256_hex" text NOT NULL,
  "status" text DEFAULT 'uploaded'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "mariz_core"."pos_devices" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "outlet_id" uuid NOT NULL,
  "device_name" text NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "paired_at" timestamp with time zone,
  "revoked_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "mariz_core"."pos_outlets" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "outlet_name" text NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "mariz_core"."pos_staff" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "staff_name" text NOT NULL,
  "role" text NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "linked_user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "mariz_core"."pos_workspaces" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL
);

CREATE TABLE IF NOT EXISTS "mariz_core"."product_entitlements" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "product_code" text NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "plan_ref" text,
  "subscription_provider" text,
  "provider_subscription_ref" text,
  "accepted_terms_version" text,
  "activated_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "mariz_core"."products" (
  "product_code" text NOT NULL,
  "product_name" text NOT NULL,
  "description" text NOT NULL,
  "available_for_sale" boolean DEFAULT false NOT NULL,
  "demo_available" boolean DEFAULT false NOT NULL,
  "registration_fee_minor" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "mariz_private"."kyb_reviewer_grants" (
  "user_id" uuid NOT NULL,
  "granted_at" timestamp with time zone DEFAULT now() NOT NULL,
  "granted_by" uuid
);

CREATE TABLE IF NOT EXISTS "mariz_private"."pos_device_credentials" (
  "device_id" uuid NOT NULL,
  "token_sha256" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "mariz_private"."pos_operator_sessions" (
  "token_sha256" text NOT NULL,
  "device_id" uuid NOT NULL,
  "staff_id" uuid NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "mariz_private"."pos_pairing_challenges" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "device_id" uuid NOT NULL,
  "code_hash" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "mariz_private"."pos_staff_credentials" (
  "staff_id" uuid NOT NULL,
  "pin_hash" text NOT NULL,
  "failed_attempts" integer DEFAULT 0 NOT NULL,
  "locked_until" timestamp with time zone,
  "rotated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "mariz_core"."audit_events" ADD CONSTRAINT "audit_events_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES neon_auth."user"(id);
ALTER TABLE "mariz_core"."audit_events" ADD CONSTRAINT "audit_events_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES neon_auth.organization(id);
ALTER TABLE "mariz_core"."audit_events" ADD CONSTRAINT "audit_events_pkey" PRIMARY KEY (id);
ALTER TABLE "mariz_core"."company_profiles" ADD CONSTRAINT "company_profiles_business_email_check" CHECK (business_email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'::text);
ALTER TABLE "mariz_core"."company_profiles" ADD CONSTRAINT "company_profiles_country_code_check" CHECK (country_code ~ '^[A-Z]{2}$'::text);
ALTER TABLE "mariz_core"."company_profiles" ADD CONSTRAINT "company_profiles_entity_type_check" CHECK (entity_type = ANY (ARRAY['company'::text, 'sole_proprietor'::text, 'partnership'::text, 'llp'::text, 'society'::text, 'foreign'::text, 'other'::text]));
ALTER TABLE "mariz_core"."company_profiles" ADD CONSTRAINT "company_profiles_legal_name_check" CHECK (length(TRIM(BOTH FROM legal_name)) >= 3 AND length(TRIM(BOTH FROM legal_name)) <= 200);
ALTER TABLE "mariz_core"."company_profiles" ADD CONSTRAINT "company_profiles_registered_address_check" CHECK (length(TRIM(BOTH FROM registered_address)) >= 8 AND length(TRIM(BOTH FROM registered_address)) <= 700);
ALTER TABLE "mariz_core"."company_profiles" ADD CONSTRAINT "company_profiles_registrar_check" CHECK (length(TRIM(BOTH FROM registrar)) >= 2 AND length(TRIM(BOTH FROM registrar)) <= 80);
ALTER TABLE "mariz_core"."company_profiles" ADD CONSTRAINT "company_profiles_registration_no_check" CHECK (length(TRIM(BOTH FROM registration_no)) >= 4 AND length(TRIM(BOTH FROM registration_no)) <= 80);
ALTER TABLE "mariz_core"."company_profiles" ADD CONSTRAINT "company_profiles_verification_status_check" CHECK (verification_status = ANY (ARRAY['draft'::text, 'submitted'::text, 'under_review'::text, 'needs_information'::text, 'verified'::text, 'rejected'::text, 'suspended'::text, 'revoked'::text]));
ALTER TABLE "mariz_core"."company_profiles" ADD CONSTRAINT "company_profiles_created_by_fkey" FOREIGN KEY (created_by) REFERENCES neon_auth."user"(id);
ALTER TABLE "mariz_core"."company_profiles" ADD CONSTRAINT "company_profiles_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES neon_auth.organization(id);
ALTER TABLE "mariz_core"."company_profiles" ADD CONSTRAINT "company_profiles_pkey" PRIMARY KEY (organization_id);
ALTER TABLE "mariz_core"."company_profiles" ADD CONSTRAINT "company_profiles_country_code_registrar_registration_normal_key" UNIQUE (country_code, registrar, registration_normalized);
ALTER TABLE "mariz_core"."kyb_applications" ADD CONSTRAINT "kyb_applications_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'submitted'::text, 'under_review'::text, 'needs_information'::text, 'approved'::text, 'rejected'::text, 'withdrawn'::text]));
ALTER TABLE "mariz_core"."kyb_applications" ADD CONSTRAINT "kyb_applications_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES mariz_core.company_profiles(organization_id);
ALTER TABLE "mariz_core"."kyb_applications" ADD CONSTRAINT "kyb_applications_submitted_by_fkey" FOREIGN KEY (submitted_by) REFERENCES neon_auth."user"(id);
ALTER TABLE "mariz_core"."kyb_applications" ADD CONSTRAINT "kyb_applications_pkey" PRIMARY KEY (id);
ALTER TABLE "mariz_core"."kyb_checks" ADD CONSTRAINT "kyb_checks_check_code_check" CHECK (check_code = ANY (ARRAY['registry'::text, 'identity'::text, 'authority'::text, 'documents'::text, 'duplicate'::text, 'contact'::text]));
ALTER TABLE "mariz_core"."kyb_checks" ADD CONSTRAINT "kyb_checks_result_check" CHECK (result = ANY (ARRAY['pass'::text, 'fail'::text, 'needs_review'::text]));
ALTER TABLE "mariz_core"."kyb_checks" ADD CONSTRAINT "kyb_checks_application_id_fkey" FOREIGN KEY (application_id) REFERENCES mariz_core.kyb_applications(id);
ALTER TABLE "mariz_core"."kyb_checks" ADD CONSTRAINT "kyb_checks_reviewer_id_fkey" FOREIGN KEY (reviewer_id) REFERENCES neon_auth."user"(id);
ALTER TABLE "mariz_core"."kyb_checks" ADD CONSTRAINT "kyb_checks_pkey" PRIMARY KEY (id);
ALTER TABLE "mariz_core"."kyb_decisions" ADD CONSTRAINT "kyb_decisions_decision_check" CHECK (decision = ANY (ARRAY['approved'::text, 'rejected'::text, 'needs_information'::text]));
ALTER TABLE "mariz_core"."kyb_decisions" ADD CONSTRAINT "kyb_decisions_reason_check" CHECK (length(TRIM(BOTH FROM reason)) >= 4 AND length(TRIM(BOTH FROM reason)) <= 2000);
ALTER TABLE "mariz_core"."kyb_decisions" ADD CONSTRAINT "kyb_decisions_application_id_fkey" FOREIGN KEY (application_id) REFERENCES mariz_core.kyb_applications(id);
ALTER TABLE "mariz_core"."kyb_decisions" ADD CONSTRAINT "kyb_decisions_reviewer_id_fkey" FOREIGN KEY (reviewer_id) REFERENCES neon_auth."user"(id);
ALTER TABLE "mariz_core"."kyb_decisions" ADD CONSTRAINT "kyb_decisions_pkey" PRIMARY KEY (id);
ALTER TABLE "mariz_core"."kyb_documents" ADD CONSTRAINT "kyb_documents_kind_check" CHECK (kind = ANY (ARRAY['registration_profile'::text, 'registration_certificate'::text, 'authority_letter'::text, 'other'::text]));
ALTER TABLE "mariz_core"."kyb_documents" ADD CONSTRAINT "kyb_documents_mime_type_check" CHECK (mime_type = ANY (ARRAY['application/pdf'::text, 'image/png'::text, 'image/jpeg'::text]));
ALTER TABLE "mariz_core"."kyb_documents" ADD CONSTRAINT "kyb_documents_sha256_hex_check" CHECK (sha256_hex ~ '^[a-f0-9]{64}$'::text);
ALTER TABLE "mariz_core"."kyb_documents" ADD CONSTRAINT "kyb_documents_size_bytes_check" CHECK (size_bytes >= 16 AND size_bytes <= 10485760);
ALTER TABLE "mariz_core"."kyb_documents" ADD CONSTRAINT "kyb_documents_status_check" CHECK (status = ANY (ARRAY['uploaded'::text, 'accepted'::text, 'rejected'::text]));
ALTER TABLE "mariz_core"."kyb_documents" ADD CONSTRAINT "kyb_documents_storage_bucket_check" CHECK (storage_bucket = 'mariz-kyb-private'::text);
ALTER TABLE "mariz_core"."kyb_documents" ADD CONSTRAINT "kyb_documents_storage_key_check" CHECK (length(storage_key) >= 20 AND length(storage_key) <= 350);
ALTER TABLE "mariz_core"."kyb_documents" ADD CONSTRAINT "kyb_documents_application_id_fkey" FOREIGN KEY (application_id) REFERENCES mariz_core.kyb_applications(id);
ALTER TABLE "mariz_core"."kyb_documents" ADD CONSTRAINT "kyb_documents_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES neon_auth."user"(id);
ALTER TABLE "mariz_core"."kyb_documents" ADD CONSTRAINT "kyb_documents_pkey" PRIMARY KEY (id);
ALTER TABLE "mariz_core"."kyb_documents" ADD CONSTRAINT "kyb_documents_storage_key_key" UNIQUE (storage_key);
ALTER TABLE "mariz_core"."pos_devices" ADD CONSTRAINT "pos_devices_device_name_check" CHECK (length(TRIM(BOTH FROM device_name)) >= 2 AND length(TRIM(BOTH FROM device_name)) <= 80);
ALTER TABLE "mariz_core"."pos_devices" ADD CONSTRAINT "pos_devices_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'paired'::text, 'suspended'::text, 'revoked'::text]));
ALTER TABLE "mariz_core"."pos_devices" ADD CONSTRAINT "pos_devices_outlet_id_organization_id_fkey" FOREIGN KEY (outlet_id, organization_id) REFERENCES mariz_core.pos_outlets(id, organization_id);
ALTER TABLE "mariz_core"."pos_devices" ADD CONSTRAINT "pos_devices_pkey" PRIMARY KEY (id);
ALTER TABLE "mariz_core"."pos_devices" ADD CONSTRAINT "pos_devices_id_organization_id_key" UNIQUE (id, organization_id);
ALTER TABLE "mariz_core"."pos_outlets" ADD CONSTRAINT "pos_outlets_outlet_name_check" CHECK (length(TRIM(BOTH FROM outlet_name)) >= 2 AND length(TRIM(BOTH FROM outlet_name)) <= 140);
ALTER TABLE "mariz_core"."pos_outlets" ADD CONSTRAINT "pos_outlets_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text]));
ALTER TABLE "mariz_core"."pos_outlets" ADD CONSTRAINT "pos_outlets_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES mariz_core.pos_workspaces(organization_id);
ALTER TABLE "mariz_core"."pos_outlets" ADD CONSTRAINT "pos_outlets_pkey" PRIMARY KEY (id);
ALTER TABLE "mariz_core"."pos_outlets" ADD CONSTRAINT "pos_outlets_id_organization_id_key" UNIQUE (id, organization_id);
ALTER TABLE "mariz_core"."pos_staff" ADD CONSTRAINT "pos_staff_role_check" CHECK (role = ANY (ARRAY['cashier'::text, 'manager'::text, 'kitchen'::text]));
ALTER TABLE "mariz_core"."pos_staff" ADD CONSTRAINT "pos_staff_staff_name_check" CHECK (length(TRIM(BOTH FROM staff_name)) >= 2 AND length(TRIM(BOTH FROM staff_name)) <= 140);
ALTER TABLE "mariz_core"."pos_staff" ADD CONSTRAINT "pos_staff_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'suspended'::text]));
ALTER TABLE "mariz_core"."pos_staff" ADD CONSTRAINT "pos_staff_linked_user_id_fkey" FOREIGN KEY (linked_user_id) REFERENCES neon_auth."user"(id);
ALTER TABLE "mariz_core"."pos_staff" ADD CONSTRAINT "pos_staff_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES mariz_core.pos_workspaces(organization_id);
ALTER TABLE "mariz_core"."pos_staff" ADD CONSTRAINT "pos_staff_pkey" PRIMARY KEY (id);
ALTER TABLE "mariz_core"."pos_staff" ADD CONSTRAINT "pos_staff_id_organization_id_key" UNIQUE (id, organization_id);
ALTER TABLE "mariz_core"."pos_workspaces" ADD CONSTRAINT "pos_workspaces_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'suspended'::text, 'closed'::text]));
ALTER TABLE "mariz_core"."pos_workspaces" ADD CONSTRAINT "pos_workspaces_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES mariz_core.company_profiles(organization_id);
ALTER TABLE "mariz_core"."pos_workspaces" ADD CONSTRAINT "pos_workspaces_pkey" PRIMARY KEY (id);
ALTER TABLE "mariz_core"."pos_workspaces" ADD CONSTRAINT "pos_workspaces_organization_id_key" UNIQUE (organization_id);
ALTER TABLE "mariz_core"."product_entitlements" ADD CONSTRAINT "product_entitlements_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'suspended'::text, 'cancelled'::text]));
ALTER TABLE "mariz_core"."product_entitlements" ADD CONSTRAINT "product_entitlements_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES mariz_core.company_profiles(organization_id);
ALTER TABLE "mariz_core"."product_entitlements" ADD CONSTRAINT "product_entitlements_product_code_fkey" FOREIGN KEY (product_code) REFERENCES mariz_core.products(product_code);
ALTER TABLE "mariz_core"."product_entitlements" ADD CONSTRAINT "product_entitlements_pkey" PRIMARY KEY (id);
ALTER TABLE "mariz_core"."product_entitlements" ADD CONSTRAINT "product_entitlements_organization_id_product_code_key" UNIQUE (organization_id, product_code);
ALTER TABLE "mariz_core"."products" ADD CONSTRAINT "products_registration_fee_minor_check" CHECK (registration_fee_minor = 0);
ALTER TABLE "mariz_core"."products" ADD CONSTRAINT "products_pkey" PRIMARY KEY (product_code);
ALTER TABLE "mariz_private"."kyb_reviewer_grants" ADD CONSTRAINT "kyb_reviewer_grants_granted_by_fkey" FOREIGN KEY (granted_by) REFERENCES neon_auth."user"(id);
ALTER TABLE "mariz_private"."kyb_reviewer_grants" ADD CONSTRAINT "kyb_reviewer_grants_user_id_fkey" FOREIGN KEY (user_id) REFERENCES neon_auth."user"(id);
ALTER TABLE "mariz_private"."kyb_reviewer_grants" ADD CONSTRAINT "kyb_reviewer_grants_pkey" PRIMARY KEY (user_id);
ALTER TABLE "mariz_private"."pos_device_credentials" ADD CONSTRAINT "pos_device_credentials_token_sha256_check" CHECK (token_sha256 ~ '^[a-f0-9]{64}$'::text);
ALTER TABLE "mariz_private"."pos_device_credentials" ADD CONSTRAINT "pos_device_credentials_device_id_fkey" FOREIGN KEY (device_id) REFERENCES mariz_core.pos_devices(id);
ALTER TABLE "mariz_private"."pos_device_credentials" ADD CONSTRAINT "pos_device_credentials_pkey" PRIMARY KEY (device_id);
ALTER TABLE "mariz_private"."pos_device_credentials" ADD CONSTRAINT "pos_device_credentials_token_sha256_key" UNIQUE (token_sha256);
ALTER TABLE "mariz_private"."pos_operator_sessions" ADD CONSTRAINT "pos_operator_sessions_token_sha256_check" CHECK (token_sha256 ~ '^[a-f0-9]{64}$'::text);
ALTER TABLE "mariz_private"."pos_operator_sessions" ADD CONSTRAINT "pos_operator_sessions_device_id_fkey" FOREIGN KEY (device_id) REFERENCES mariz_core.pos_devices(id);
ALTER TABLE "mariz_private"."pos_operator_sessions" ADD CONSTRAINT "pos_operator_sessions_staff_id_fkey" FOREIGN KEY (staff_id) REFERENCES mariz_core.pos_staff(id);
ALTER TABLE "mariz_private"."pos_operator_sessions" ADD CONSTRAINT "pos_operator_sessions_pkey" PRIMARY KEY (token_sha256);
ALTER TABLE "mariz_private"."pos_pairing_challenges" ADD CONSTRAINT "pos_pairing_challenges_attempts_check" CHECK (attempts >= 0);
ALTER TABLE "mariz_private"."pos_pairing_challenges" ADD CONSTRAINT "pos_pairing_challenges_device_id_fkey" FOREIGN KEY (device_id) REFERENCES mariz_core.pos_devices(id);
ALTER TABLE "mariz_private"."pos_pairing_challenges" ADD CONSTRAINT "pos_pairing_challenges_pkey" PRIMARY KEY (id);
ALTER TABLE "mariz_private"."pos_staff_credentials" ADD CONSTRAINT "pos_staff_credentials_failed_attempts_check" CHECK (failed_attempts >= 0);
ALTER TABLE "mariz_private"."pos_staff_credentials" ADD CONSTRAINT "pos_staff_credentials_staff_id_fkey" FOREIGN KEY (staff_id) REFERENCES mariz_core.pos_staff(id);
ALTER TABLE "mariz_private"."pos_staff_credentials" ADD CONSTRAINT "pos_staff_credentials_pkey" PRIMARY KEY (staff_id);

CREATE INDEX mariz_audit_company_time ON mariz_core.audit_events USING btree (organization_id, created_at DESC);
CREATE UNIQUE INDEX mariz_kyb_current_per_company ON mariz_core.kyb_applications USING btree (organization_id) WHERE (status = ANY (ARRAY['draft'::text, 'submitted'::text, 'under_review'::text, 'needs_information'::text]));

INSERT INTO mariz_core.products(product_code,product_name,description,available_for_sale,demo_available,registration_fee_minor) VALUES
('pos','MARIZ POS','Store terminal and Back Office',true,true,0),
('custom_web','Custom Web Software','Bespoke hosted software, quotation required',false,false,0)
ON CONFLICT(product_code) DO NOTHING;

CREATE OR REPLACE FUNCTION mariz_core.decide_kyb(p_reviewer uuid, p_application uuid, p_decision text, p_reason text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_org uuid;v_passed integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM mariz_private.kyb_reviewer_grants WHERE user_id=p_reviewer) THEN RAISE EXCEPTION 'MARIZ reviewer grant required'; END IF;
 IF p_decision NOT IN ('approved','rejected','needs_information') OR length(trim(p_reason)) NOT BETWEEN 4 AND 2000 THEN RAISE EXCEPTION 'Invalid decision or reason';END IF;
 SELECT organization_id INTO v_org FROM mariz_core.kyb_applications WHERE id=p_application AND status IN ('submitted','under_review') FOR UPDATE;
 IF v_org IS NULL THEN RAISE EXCEPTION 'Application not reviewable'; END IF;
 IF EXISTS(SELECT 1 FROM neon_auth.member WHERE "organizationId"=v_org AND "userId"=p_reviewer) THEN RAISE EXCEPTION 'Reviewer conflict of interest'; END IF;
 IF p_decision='approved' THEN
   SELECT count(*) INTO v_passed FROM (
     SELECT DISTINCT ON(check_code) check_code,result FROM mariz_core.kyb_checks
     WHERE application_id=p_application ORDER BY check_code,checked_at DESC,id DESC
   ) last_checks WHERE result='pass';
   IF v_passed<>6 THEN RAISE EXCEPTION 'All six KYB checks must pass'; END IF;
   IF NOT EXISTS(SELECT 1 FROM mariz_core.kyb_documents WHERE application_id=p_application AND kind='registration_profile' AND status='accepted')
   THEN RAISE EXCEPTION 'Verified official registration profile required'; END IF;
 END IF;
 INSERT INTO mariz_core.kyb_decisions(application_id,reviewer_id,decision,reason)
 VALUES(p_application,p_reviewer,p_decision,trim(p_reason));
 UPDATE mariz_core.kyb_applications SET status=CASE WHEN p_decision='approved' THEN 'approved' WHEN p_decision='rejected' THEN 'rejected' ELSE 'needs_information' END,decided_at=now() WHERE id=p_application;
 UPDATE mariz_core.company_profiles SET verification_status=CASE WHEN p_decision='approved' THEN 'verified' WHEN p_decision='rejected' THEN 'rejected' ELSE 'needs_information' END,
 verified_at=CASE WHEN p_decision='approved' THEN now() ELSE null END,updated_at=now() WHERE organization_id=v_org;
 INSERT INTO mariz_core.audit_events(actor_id,organization_id,event_type,subject_id,detail)
 VALUES(p_reviewer,v_org,'kyb.'||p_decision,p_application,jsonb_build_object('reason',trim(p_reason)));
 RETURN true;
END $function$;

CREATE OR REPLACE FUNCTION mariz_core.pos_create_outlet(p_actor uuid, p_organization uuid, p_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_id uuid;
BEGIN
 PERFORM mariz_core.require_active_pos(p_actor,p_organization);
 IF length(trim(p_name)) NOT BETWEEN 2 AND 140 THEN RAISE EXCEPTION 'Invalid outlet name'; END IF;
 INSERT INTO mariz_core.pos_outlets(organization_id,outlet_name)
 VALUES(p_organization,trim(p_name)) RETURNING id INTO v_id;
 INSERT INTO mariz_core.audit_events(actor_id,organization_id,event_type,subject_id)
 VALUES(p_actor,p_organization,'pos.outlet_created',v_id);
 RETURN v_id;
END $function$;

CREATE OR REPLACE FUNCTION mariz_core.record_kyb_check(p_reviewer uuid, p_application uuid, p_check_code text, p_result text, p_note text DEFAULT ''::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_org uuid;v_id uuid;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM mariz_private.kyb_reviewer_grants WHERE user_id=p_reviewer) THEN RAISE EXCEPTION 'MARIZ reviewer grant required'; END IF;
 SELECT organization_id INTO v_org FROM mariz_core.kyb_applications WHERE id=p_application AND status IN ('submitted','under_review') FOR UPDATE;
 IF v_org IS NULL THEN RAISE EXCEPTION 'Application not reviewable'; END IF;
 IF EXISTS(SELECT 1 FROM neon_auth.member WHERE "organizationId"=v_org AND "userId"=p_reviewer) THEN RAISE EXCEPTION 'Reviewer cannot review own company'; END IF;
 IF p_check_code NOT IN ('registry','identity','authority','documents','duplicate','contact') OR p_result NOT IN ('pass','fail','needs_review')
 THEN RAISE EXCEPTION 'Invalid KYB check'; END IF;
 INSERT INTO mariz_core.kyb_checks(application_id,check_code,result,reviewer_id,note)
 VALUES(p_application,p_check_code,p_result,p_reviewer,left(trim(p_note),2000)) RETURNING id INTO v_id;
 UPDATE mariz_core.kyb_applications SET status='under_review' WHERE id=p_application;
 UPDATE mariz_core.company_profiles SET verification_status='under_review',updated_at=now() WHERE organization_id=v_org;
 INSERT INTO mariz_core.audit_events(actor_id,organization_id,event_type,subject_id,detail)
 VALUES(p_reviewer,v_org,'kyb.check',p_application,jsonb_build_object('check',p_check_code,'result',p_result));
 RETURN v_id;
END $function$;

CREATE OR REPLACE FUNCTION mariz_core.register_company_profile(p_actor uuid, p_organization uuid, p_legal_name text, p_entity_type text, p_registration_no text, p_registered_address text, p_business_email text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
 PERFORM mariz_core.require_company_admin(p_actor,p_organization);
 IF length(trim(p_legal_name)) NOT BETWEEN 3 AND 200 OR length(trim(p_registration_no)) NOT BETWEEN 4 AND 80 OR
  length(trim(p_registered_address)) NOT BETWEEN 8 AND 700 OR p_business_email !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
 THEN RAISE EXCEPTION 'Incomplete company registration'; END IF;
 IF (SELECT count(*) FROM mariz_core.company_profiles WHERE created_by=p_actor AND created_at>now()-interval '24 hours')>=3 THEN RAISE EXCEPTION 'Company registration rate limit'; END IF;
 INSERT INTO mariz_core.company_profiles(organization_id,legal_name,entity_type,registration_no,registered_address,business_email,created_by)
 VALUES(p_organization,trim(p_legal_name),p_entity_type,trim(p_registration_no),trim(p_registered_address),lower(trim(p_business_email)),p_actor);
 INSERT INTO mariz_core.audit_events(actor_id,organization_id,event_type,subject_id)
 VALUES(p_actor,p_organization,'company.profile_created',p_organization);
 RETURN p_organization;
END $function$;

CREATE OR REPLACE FUNCTION mariz_core.require_active_pos(p_actor uuid, p_organization uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_workspace uuid;
BEGIN
 PERFORM mariz_core.require_company_admin(p_actor,p_organization);
 SELECT w.id INTO v_workspace FROM mariz_core.pos_workspaces w
 JOIN mariz_core.company_profiles c ON c.organization_id=w.organization_id
 JOIN mariz_core.product_entitlements e ON e.organization_id=w.organization_id AND e.product_code='pos'
 WHERE w.organization_id=p_organization AND w.status='active'
 AND c.verification_status='verified' AND e.status='active';
 IF v_workspace IS NULL THEN RAISE EXCEPTION 'Active MARIZ POS subscription and KYB are required'; END IF;
 RETURN v_workspace;
END $function$;

CREATE OR REPLACE FUNCTION mariz_core.require_company_admin(p_actor uuid, p_organization uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
 IF p_actor IS NULL OR p_organization IS NULL THEN RAISE EXCEPTION 'Authorization required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM neon_auth."user" u WHERE u.id=p_actor AND u."emailVerified"=true AND coalesce(u.banned,false)=false) THEN RAISE EXCEPTION 'Verified account required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM neon_auth.member m WHERE m."organizationId"=p_organization AND m."userId"=p_actor AND m.role IN ('owner','admin')) THEN RAISE EXCEPTION 'Organization administrator required'; END IF;
 RETURN true;
END $function$;

CREATE OR REPLACE FUNCTION mariz_core.start_kyb(p_actor uuid, p_organization uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_id uuid;
BEGIN
 PERFORM mariz_core.require_company_admin(p_actor,p_organization);
 IF NOT EXISTS(SELECT 1 FROM mariz_core.company_profiles WHERE organization_id=p_organization AND verification_status IN ('draft','needs_information','rejected')) THEN RAISE EXCEPTION 'Company not eligible for verification'; END IF;
 SELECT id INTO v_id FROM mariz_core.kyb_applications WHERE organization_id=p_organization
 AND status IN ('draft','submitted','under_review','needs_information') LIMIT 1;
 IF v_id IS NULL THEN
  INSERT INTO mariz_core.kyb_applications(organization_id,submitted_by) VALUES(p_organization,p_actor) RETURNING id INTO v_id;
  INSERT INTO mariz_core.audit_events(actor_id,organization_id,event_type,subject_id)
  VALUES(p_actor,p_organization,'kyb.started',v_id);
 END IF;
 RETURN v_id;
END $function$;

CREATE OR REPLACE FUNCTION mariz_core.submit_kyb(p_actor uuid, p_application uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_org uuid;
BEGIN
 SELECT organization_id INTO v_org FROM mariz_core.kyb_applications WHERE id=p_application AND status IN ('draft','needs_information') FOR UPDATE;
 IF v_org IS NULL THEN RAISE EXCEPTION 'No draft application'; END IF;
 PERFORM mariz_core.require_company_admin(p_actor,v_org);
 IF NOT EXISTS(SELECT 1 FROM mariz_core.kyb_documents WHERE application_id=p_application AND kind='registration_profile' AND status IN ('uploaded','accepted'))
 THEN RAISE EXCEPTION 'Current official registration profile is required'; END IF;
 UPDATE mariz_core.kyb_applications SET status='submitted',submitted_by=p_actor,submitted_at=now() WHERE id=p_application;
 UPDATE mariz_core.company_profiles SET verification_status='submitted',updated_at=now() WHERE organization_id=v_org;
 INSERT INTO mariz_core.audit_events(actor_id,organization_id,event_type,subject_id) VALUES(p_actor,v_org,'kyb.submitted',p_application);
 RETURN true;
END $function$;

REVOKE ALL ON SCHEMA mariz_core, mariz_private FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA mariz_core, mariz_private FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA mariz_core, mariz_private FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA mariz_core, mariz_private FROM PUBLIC;
