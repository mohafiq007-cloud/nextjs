-- 008: Neon-native, JWT-scoped KYB workflow. Apply to staging first.
CREATE OR REPLACE FUNCTION mariz_private.require_kyb_reviewer(p_actor uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM neon_auth."user" u JOIN mariz_private.kyb_reviewer_grants g ON g.user_id=u.id
 WHERE u.id=p_actor AND u."emailVerified" AND NOT coalesce(u.banned,false)) THEN RAISE EXCEPTION 'Reviewer access required'; END IF;
 RETURN true;
END $f$;
REVOKE ALL ON FUNCTION mariz_private.require_kyb_reviewer(uuid) FROM PUBLIC,anonymous,authenticated;

CREATE OR REPLACE FUNCTION mariz_core.api_kyb_state(p_organization uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE actor uuid:=auth.user_id()::uuid; app mariz_core.kyb_applications%ROWTYPE;
BEGIN
 PERFORM mariz_core.require_company_admin(actor,p_organization);
 SELECT * INTO app FROM mariz_core.kyb_applications WHERE organization_id=p_organization ORDER BY created_at DESC LIMIT 1;
 IF NOT FOUND THEN RETURN jsonb_build_object('application',null,'documents','[]'::jsonb); END IF;
 RETURN jsonb_build_object('application',jsonb_build_object('id',app.id,'status',app.status),
 'documents',coalesce((SELECT jsonb_agg(jsonb_build_object('id',d.id,'kind',d.kind,'status',d.status,'mime_type',d.mime_type,'size_bytes',d.size_bytes)) FROM mariz_core.kyb_documents d WHERE d.application_id=app.id),'[]'::jsonb));
END $f$;

CREATE OR REPLACE FUNCTION mariz_core.api_add_kyb_document(p_application uuid,p_document uuid,p_kind text,p_storage_key text,p_mime text,p_size text,p_sha text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE actor uuid:=auth.user_id()::uuid; org uuid; size integer;
BEGIN
 SELECT organization_id INTO org FROM mariz_core.kyb_applications WHERE id=p_application AND status IN ('draft','needs_information') FOR UPDATE;
 IF org IS NULL THEN RAISE EXCEPTION 'Editable application required'; END IF;
 PERFORM mariz_core.require_company_admin(actor,org);
 IF p_size !~ '^[0-9]{1,8}$' THEN RAISE EXCEPTION 'Invalid size'; END IF; size:=p_size::integer;
 IF size NOT BETWEEN 16 AND 4194304 OR p_mime NOT IN ('application/pdf','image/png','image/jpeg') OR p_sha !~ '^[a-f0-9]{64}$'
 OR p_kind NOT IN ('registration_profile','registration_certificate','authority_letter','other')
 OR p_storage_key<>org::text||'/'||p_application::text||'/'||p_document::text
 THEN RAISE EXCEPTION 'Invalid evidence'; END IF;
 IF (SELECT count(*) FROM mariz_core.kyb_documents WHERE application_id=p_application)>=20 THEN RAISE EXCEPTION 'Evidence limit reached'; END IF;
 INSERT INTO mariz_core.kyb_documents(id,application_id,uploaded_by,kind,storage_key,mime_type,size_bytes,sha256_hex)
 VALUES(p_document,p_application,actor,p_kind,p_storage_key,p_mime,size,p_sha);
 INSERT INTO mariz_core.audit_events(actor_id,organization_id,event_type,subject_id) VALUES(actor,org,'kyb.document_uploaded',p_document);
 RETURN p_document;
END $f$;

CREATE OR REPLACE FUNCTION mariz_core.api_submit_kyb(p_application uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path='' AS $f$
 SELECT mariz_core.submit_kyb(auth.user_id()::uuid,p_application)
$f$;

CREATE OR REPLACE FUNCTION mariz_core.api_kyb_reviewer_status()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $f$
 SELECT EXISTS(SELECT 1 FROM mariz_private.kyb_reviewer_grants g JOIN neon_auth."user" u ON u.id=g.user_id WHERE u.id=auth.user_id()::uuid AND u."emailVerified" AND NOT coalesce(u.banned,false))
$f$;

CREATE OR REPLACE FUNCTION mariz_core.api_kyb_review_queue()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 PERFORM mariz_private.require_kyb_reviewer(auth.user_id()::uuid);
 RETURN coalesce((SELECT jsonb_agg(row_to_json(q)) FROM (
 SELECT a.id,a.organization_id,a.status,a.submitted_at,c.legal_name,c.registration_no,
 coalesce((SELECT jsonb_agg(jsonb_build_object('id',d.id,'kind',d.kind,'status',d.status)) FROM mariz_core.kyb_documents d WHERE d.application_id=a.id),'[]'::jsonb) AS documents,
 coalesce((SELECT jsonb_agg(jsonb_build_object('code',k.check_code,'result',k.result,'at',k.checked_at)) FROM mariz_core.kyb_checks k WHERE k.application_id=a.id),'[]'::jsonb) AS checks
 FROM mariz_core.kyb_applications a JOIN mariz_core.company_profiles c ON c.organization_id=a.organization_id
 WHERE a.status IN ('submitted','under_review') AND NOT EXISTS(SELECT 1 FROM neon_auth.member m WHERE m."organizationId"=a.organization_id AND m."userId"=auth.user_id()::uuid)
 ORDER BY a.submitted_at LIMIT 30) q),'[]'::jsonb);
END $f$;

CREATE OR REPLACE FUNCTION mariz_core.api_kyb_document_access(p_document uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE actor uuid:=auth.user_id()::uuid; org uuid; d mariz_core.kyb_documents%ROWTYPE;
BEGIN
 SELECT * INTO d FROM mariz_core.kyb_documents WHERE id=p_document;
 IF NOT FOUND THEN RAISE EXCEPTION 'Evidence unavailable'; END IF;
 SELECT organization_id INTO org FROM mariz_core.kyb_applications WHERE id=d.application_id;
 IF EXISTS(SELECT 1 FROM neon_auth.member m WHERE m."organizationId"=org AND m."userId"=actor AND m.role IN ('owner','admin'))
 THEN PERFORM mariz_core.require_company_admin(actor,org);
 ELSE PERFORM mariz_private.require_kyb_reviewer(actor); END IF;
 INSERT INTO mariz_core.audit_events(actor_id,organization_id,event_type,subject_id) VALUES(actor,org,'kyb.document_access_requested',d.id);
 RETURN jsonb_build_object('id',d.id,'storage_key',d.storage_key,'mime_type',d.mime_type,'size_bytes',d.size_bytes,'sha256_hex',d.sha256_hex);
END $f$;

CREATE OR REPLACE FUNCTION mariz_core.api_accept_kyb_document(p_document uuid,p_status text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE actor uuid:=auth.user_id()::uuid; org uuid;
BEGIN
 PERFORM mariz_private.require_kyb_reviewer(actor);
 SELECT a.organization_id INTO org FROM mariz_core.kyb_documents d JOIN mariz_core.kyb_applications a ON a.id=d.application_id
 WHERE d.id=p_document AND a.status IN ('submitted','under_review') FOR UPDATE OF a,d;
 IF org IS NULL OR EXISTS(SELECT 1 FROM neon_auth.member WHERE "organizationId"=org AND "userId"=actor)
 OR p_status NOT IN ('accepted','rejected') THEN RAISE EXCEPTION 'Evidence review denied'; END IF;
 UPDATE mariz_core.kyb_documents SET status=p_status WHERE id=p_document;
 INSERT INTO mariz_core.audit_events(actor_id,organization_id,event_type,subject_id,detail) VALUES(actor,org,'kyb.document_reviewed',p_document,jsonb_build_object('status',p_status));
 RETURN true;
END $f$;

CREATE OR REPLACE FUNCTION mariz_core.api_record_kyb_check(p_application uuid,p_code text,p_result text,p_note text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 PERFORM mariz_private.require_kyb_reviewer(auth.user_id()::uuid);
 RETURN mariz_core.record_kyb_check(auth.user_id()::uuid,p_application,p_code,p_result,p_note);
END $f$;
CREATE OR REPLACE FUNCTION mariz_core.api_decide_kyb(p_application uuid,p_decision text,p_reason text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 PERFORM mariz_private.require_kyb_reviewer(auth.user_id()::uuid);
 RETURN mariz_core.decide_kyb(auth.user_id()::uuid,p_application,p_decision,p_reason);
END $f$;

REVOKE ALL ON FUNCTION mariz_core.api_kyb_state(uuid),mariz_core.api_add_kyb_document(uuid,uuid,text,text,text,text,text),
 mariz_core.api_submit_kyb(uuid),mariz_core.api_kyb_reviewer_status(),mariz_core.api_kyb_review_queue(),
 mariz_core.api_kyb_document_access(uuid),mariz_core.api_accept_kyb_document(uuid,text),
 mariz_core.api_record_kyb_check(uuid,text,text,text),mariz_core.api_decide_kyb(uuid,text,text) FROM PUBLIC,anonymous;
GRANT EXECUTE ON FUNCTION mariz_core.api_kyb_state(uuid),mariz_core.api_add_kyb_document(uuid,uuid,text,text,text,text,text),
 mariz_core.api_submit_kyb(uuid),mariz_core.api_kyb_reviewer_status(),mariz_core.api_kyb_review_queue(),
 mariz_core.api_kyb_document_access(uuid),mariz_core.api_accept_kyb_document(uuid,text),
 mariz_core.api_record_kyb_check(uuid,text,text,text),mariz_core.api_decide_kyb(uuid,text,text) TO authenticated;

