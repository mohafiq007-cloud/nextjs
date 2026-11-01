-- Recovery only; not an automatic cleanup script. Preserve all records.
-- First restore Vercel dpl_GtKenF5LSXbjHUKPn7nAi6cLeKsn and previous Feedback service.
-- Then, only if no later release depends on these new functions:
BEGIN;
DROP FUNCTION mariz_core.api_client_workspace();
DROP FUNCTION mariz_core.api_client_context();
COMMIT;
-- Feedback records must always be retained; disable new routes rather than delete messages.
