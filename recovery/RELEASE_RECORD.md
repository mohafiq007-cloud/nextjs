# MARIZ CO production recovery

Owner authorization: production recovery handover plus exact billing credential and existing Workers-script access approvals, 1 November 2026.

Accepted Preview source: dpl_HfqRzivGjTTYic6rkmho5yjXc78M. Restored live baseline: dpl_GtKenF5LSXbjHUKPn7nAi6cLeKsn. Production-environment staged build: dpl_7AvPEXjh69EjK9DJ3XnfHHgLoq4m. All 169 uploaded source files match local source. Only Company/Billing/Feedback server adapters and their targeted test differ from accepted Preview. Upload metadata predates the final source commit; source hashes establish correspondence.

Applied migrations:
- MARIZ_CO_20261101_01 on CO br-bold-unit-aothxcnn: api_client_context() and api_client_workspace(); verified JWT, exactly one company, owner/admin profile projection, empty search_path, no PUBLIC grants.
- MARIZ_CO_20261101_02 on billing br-summer-morning-aofdcsp3: client_workspace_production(uuid,text) plus function-only mariz_co_billing_reader. Own-role verification returns actual not_connected state for IQF; no direct table read or payment write. The owner-approved newly initialized credential is stored as a Vercel Production sensitive variable. Its temporary local copy was removed. No Preview credential or operator credential was reused.
- MARIZ_CO_20261101_03 on existing mariz-hq-feedback D1 2fa6ea56-d536-4a0a-b265-63102a796b4a: additive feedback_company_tickets and feedback_company_messages. Original ticket count 1 and complete original-record SHA256 unchanged. No original table rebuild/copy/rename or data rewrite.

Shared Feedback uses existing mariz-co-gateway at https://marizhq.com/co/api/co-feedback and existing mariz-admin-co-review at /console/api/co-feedback and /console/co-feedback. The existing Admin Inbox /api/feedback includes company cases. All 1+6 deployed original gateway modules were preserved byte-for-byte; only new entry wrappers and required D1/identity configuration were added. Existing Arcade and Pages deployments were not changed. This is not another Feedback service or database.

Targeted verification: 10 production adapter tests, 12 shared Feedback persistence/isolation/reply tests, 5 gateway preservation/auth rejection tests passed. Build, TypeScript and focused lint passed. Existing 48-test milestone suite was not rerun. Anonymous company API responds 401; anonymous staff requests remain under Cloudflare Access; existing company access pages respond 200. Billing reader role has no superuser/create-role/create-db/bypass-RLS privileges, no table SELECT and no payment UPDATE grant.

Remaining release gate: authenticated staged IQF journey, Feedback persistence/history, mobile navigation and final live smoke. Do not release until this gate passes.

Rollback: Vercel restore dpl_GtKenF5LSXbjHUKPn7nAi6cLeKsn. Existing gateway version baselines are 836523df-1208-427b-a831-d8f718e66313 (CO) and b5b0eb71-cd1d-4e8b-b89a-e47fd3ca3df9 (Admin); exact original modules/settings are privately retained. work/rollback-recovery-gateways.cjs restores original modules/bindings and retains all Feedback records. Disable new routes before any schema recovery. Company functions may be removed only after checking later dependents. Billing recovery can disable the new reader login and revoke its function grant; leave billing data untouched. Never delete client cases or roll back the shared database wholesale.

Billplz issuance, callback/signature/reconciliation source and credentials are unchanged. Authentication design and production login settings are unchanged. POS backend and ILMU remain untouched; ILMU FROZEN / QUEUED.
