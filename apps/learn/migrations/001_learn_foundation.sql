-- MARIZ Learn V0.1. Create-only, isolated from MARIZ HQ/POS.
-- Apply on a TEST branch first. No direct table access to HTTP roles.
CREATE SCHEMA IF NOT EXISTS mariz_learn;

CREATE TABLE IF NOT EXISTS mariz_learn.lessons (
  id text PRIMARY KEY,
  title text NOT NULL,
  faculty text NOT NULL,
  is_preview boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS mariz_learn.scenarios (
  id text PRIMARY KEY,
  lesson_id text NOT NULL REFERENCES mariz_learn.lessons(id),
  prompt text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS mariz_learn.memberships (
  user_id uuid PRIMARY KEY,
  state text NOT NULL CHECK (state IN ('inactive','active','past_due','cancelled','expired')),
  valid_until timestamptz,
  provider text,
  provider_reference text UNIQUE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (state <> 'active' OR valid_until IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS mariz_learn.progress (
  user_id uuid NOT NULL,
  lesson_id text NOT NULL REFERENCES mariz_learn.lessons(id),
  attempts_count integer NOT NULL DEFAULT 0 CHECK (attempts_count >= 0),
  last_practised_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);
CREATE TABLE IF NOT EXISTS mariz_learn.attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scenario_id text NOT NULL REFERENCES mariz_learn.scenarios(id),
  response_text text NOT NULL CHECK (char_length(response_text) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mariz_learn_attempts_user_created ON mariz_learn.attempts(user_id, created_at DESC);

INSERT INTO mariz_learn.lessons(id,title,faculty,is_preview) VALUES
 ('observation-foundations','The Art of Observation','Human intelligence',true),
 ('finance-reasoning','Understanding Profit and Cash','Financial intelligence',true),
 ('design-reasoning','Reasoning About Design','Design and systems intelligence',true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO mariz_learn.scenarios(id,lesson_id,prompt) VALUES
 ('observe-cafe-01','observation-foundations','Separate what the person did from why you think it happened.'),
 ('finance-cash-01','finance-reasoning','Explain how reported profit can coexist with no cash.'),
 ('design-bridge-01','design-reasoning','Explain the assumptions that influence bridge deflection.')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE mariz_learn.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE mariz_learn.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE mariz_learn.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE mariz_learn.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE mariz_learn.attempts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION mariz_learn.api_learn_state() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE uid uuid; active_member boolean;
BEGIN
  uid := auth.user_id()::uuid;
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
  SELECT EXISTS(SELECT 1 FROM mariz_learn.memberships
    WHERE user_id=uid AND state='active' AND valid_until>now()) INTO active_member;
  RETURN jsonb_build_object(
    'membership_active',active_member,
    'progress',(SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'lesson_id',p.lesson_id,'attempts',p.attempts_count,'last_practised_at',p.last_practised_at)
       ORDER BY p.last_practised_at DESC),'[]'::jsonb)
       FROM mariz_learn.progress p WHERE p.user_id=uid)
  );
END $$;

CREATE OR REPLACE FUNCTION mariz_learn.api_record_attempt(p_scenario_id text,p_response text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE uid uuid; selected_lesson text; preview boolean;
BEGIN
  uid := auth.user_id()::uuid;
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
  IF char_length(btrim(p_response)) NOT BETWEEN 1 AND 2000 THEN
     RAISE EXCEPTION 'Response length must be 1–2000 characters' USING ERRCODE='22023';
  END IF;
  SELECT s.lesson_id,l.is_preview INTO selected_lesson,preview
    FROM mariz_learn.scenarios s JOIN mariz_learn.lessons l ON l.id=s.lesson_id
    WHERE s.id=p_scenario_id;
  IF selected_lesson IS NULL THEN RAISE EXCEPTION 'Unknown scenario' USING ERRCODE='22023'; END IF;
  IF NOT preview AND NOT EXISTS (
    SELECT 1 FROM mariz_learn.memberships m
    WHERE m.user_id=uid AND m.state='active' AND m.valid_until>now()
  ) THEN RAISE EXCEPTION 'Active membership required' USING ERRCODE='42501'; END IF;
  INSERT INTO mariz_learn.attempts(user_id,scenario_id,response_text)
    VALUES(uid,p_scenario_id,btrim(p_response));
  INSERT INTO mariz_learn.progress(user_id,lesson_id,attempts_count)
    VALUES(uid,selected_lesson,1)
  ON CONFLICT(user_id,lesson_id) DO UPDATE
    SET attempts_count=mariz_learn.progress.attempts_count+1,last_practised_at=now();
  RETURN jsonb_build_object('saved',true,'lesson_id',selected_lesson);
END $$;

REVOKE ALL ON SCHEMA mariz_learn FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA mariz_learn FROM PUBLIC;
REVOKE ALL ON FUNCTION mariz_learn.api_learn_state() FROM PUBLIC;
REVOKE ALL ON FUNCTION mariz_learn.api_record_attempt(text,text) FROM PUBLIC;
-- Authenticated Data API callers only see narrowly scoped RPCs, NOT raw tables.
GRANT USAGE ON SCHEMA mariz_learn TO authenticated;
GRANT EXECUTE ON FUNCTION mariz_learn.api_learn_state() TO authenticated;
GRANT EXECUTE ON FUNCTION mariz_learn.api_record_attempt(text,text) TO authenticated;
