-- Decision authorization is enforced in the database, including direct Data API calls.
-- Provision an environment-specific signing key separately; never commit its value.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE TABLE IF NOT EXISTS mariz_private.kyb_step_up_keys (
 id boolean PRIMARY KEY DEFAULT true CHECK(id), secret text NOT NULL CHECK(length(secret)>=43)
);
CREATE TABLE IF NOT EXISTS mariz_private.kyb_step_up_uses (
 nonce uuid PRIMARY KEY, actor uuid NOT NULL, application uuid NOT NULL, used_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON mariz_private.kyb_step_up_keys,mariz_private.kyb_step_up_uses FROM PUBLIC,anonymous,authenticated;
REVOKE ALL ON FUNCTION mariz_core.api_decide_kyb(uuid,text,text) FROM PUBLIC,anonymous,authenticated;
CREATE OR REPLACE FUNCTION mariz_core.api_decide_kyb_step_up(
 p_application uuid,p_decision text,p_reason text,p_expiry text,p_nonce uuid,p_mac text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE actor uuid:=auth.user_id()::uuid; key text; payload text; expected text; expiry bigint;
BEGIN
 PERFORM mariz_private.require_kyb_reviewer(actor);
 IF p_expiry IS NULL OR p_expiry !~ '^[0-9]{10}$' OR p_mac IS NULL OR p_mac !~ '^[a-f0-9]{64}$' OR p_nonce IS NULL
 OR p_application IS NULL OR p_decision IS NULL OR p_reason IS NULL THEN RAISE EXCEPTION 'Fresh reviewer verification required'; END IF;
 expiry:=p_expiry::bigint;
 IF expiry<extract(epoch FROM now()) OR expiry>extract(epoch FROM now())+90 THEN RAISE EXCEPTION 'Reviewer verification expired'; END IF;
 SELECT secret INTO key FROM mariz_private.kyb_step_up_keys WHERE id;
 IF key IS NULL THEN RAISE EXCEPTION 'Reviewer verification not configured'; END IF;
 payload:=actor::text||E'\n'||p_application::text||E'\n'||p_decision||E'\n'||encode(public.digest(convert_to(p_reason,'UTF8'),'sha256'),'hex')||E'\n'||p_expiry||E'\n'||p_nonce::text;
 expected:=encode(public.hmac(convert_to(payload,'UTF8'),convert_to(key,'UTF8'),'sha256'),'hex');
 IF p_mac<>expected THEN RAISE EXCEPTION 'Reviewer verification invalid'; END IF;
 INSERT INTO mariz_private.kyb_step_up_uses(nonce,actor,application) VALUES(p_nonce,actor,p_application);
 RETURN mariz_core.decide_kyb(actor,p_application,p_decision,p_reason);
END $f$;
REVOKE ALL ON FUNCTION mariz_core.api_decide_kyb_step_up(uuid,text,text,text,uuid,text) FROM PUBLIC,anonymous;
GRANT EXECUTE ON FUNCTION mariz_core.api_decide_kyb_step_up(uuid,text,text,text,uuid,text) TO authenticated;
