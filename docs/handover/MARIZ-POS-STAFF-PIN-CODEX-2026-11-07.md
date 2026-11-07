# MARIZ POS — Codex Implementation Handover (2026-11-07)

STATUS: ARCHITECTURE READY; CODE IMPLEMENTATION, INTEGRATION TESTS AND DEPLOYMENT NOT COMPLETE. PRODUCTION HOLD.

## Scope and source of truth
Repository: mohafiq007-cloud/nextjs
Starting branch: integration/pos-commercial-release
Work branch: codex/pos-staff-pin-handover-20261107
Vercel staging project: mariz-pos-operational-preview
Configured custom domain: pos.marizhq.com (DNS and functional routing not verified).
Preserve approved MARIZ HQ V5.7 design and branding; HQ = platform/product catalogue, CO = company/outlet/staff administration, POS = registered cashier terminal. Business Solutions = ready-made products; Custom Solutions separate. Do not change Arcade/Library/Events visibility, marketing site, or Billplz flows as a side effect.

## Architecture and boundaries
1. Company administrator authenticates through existing CO auth; server verifies company membership and admin permission.
2. Admin selects company/outlet, chooses existing staff identity or creates an invitation, supplies verified email, assigns role/permissions and outlet.
3. Staff identity is global to the company; outlet membership is separate. A person at two outlets gets separate PIN credentials.
4. Server allocates a cryptographically random 0000–9999 PIN within the chosen outlet. Reserve uniqueness across ACTIVE and PENDING outlet credentials atomically in the database. Do not rely on check-then-insert in application code alone.
5. Never store plaintext PINs in database, logs, analytics, or administrator UI. A keyed deterministic fingerprint scoped to outlet may be used as a UNIQUE reservation index; separately store a slow salted PIN verifier. Keep fingerprint secret server-side and support key rotation.
6. Send a short-lived single-use activation link to the employee's verified email, not a permanent PIN in plaintext email. After link verification, reveal system-generated PIN once via authenticated HTTPS session; require acknowledgement. On email failure, retain pending invitation and allow controlled resend without generating conflicting reservations.
7. POS device must be registered and authenticated to an outlet before a four-digit PIN can unlock an assigned staff session. Verify outlet, active membership, PIN, role, device and rate limits on server; never use PIN alone for remote account login.
8. Lock out/rate-limit repeated guesses per device, outlet and staff; audit successful/failed logins, creation, activation, reset, revocation and outlet reassignment without sensitive values.
9. Reset revokes previous credential and activation token, reserves a fresh unique PIN, and triggers new secure activation. Deactivation releases access immediately. Retain audit history.
10. Enforce tenancy and permissions with server-side checks and database constraints; no client-trusted company_id/outlet_id.

## Suggested relational model (adapt to actual schema after inspection)
staff_identity(id, company_id, email_normalized, name, status)
outlet_staff(id, company_id, outlet_id, staff_id, role_id, status, created_at)
outlet_pin_credentials(id, outlet_staff_id, outlet_id, pin_fingerprint, pin_verifier, state, activated_at, revoked_at)
staff_activation_tokens(id, credential_id, token_hash, expires_at, used_at)
registered_pos_devices(id, company_id, outlet_id, device_public_id, status)
staff_security_events(id, company_id, outlet_id, staff_id, event_type, occurred_at, metadata_redacted)
Constraint: UNIQUE(outlet_id,pin_fingerprint) for credentials with state IN ('PENDING','ACTIVE'); implement as partial unique index or separate reservation table. UNIQUE(outlet_id,staff_id) for current membership as appropriate. Use transactional allocation and retry on unique violations. Reserve 0000–9999 only where supported by UX. At capacity return controlled error; never loop forever.

## API contract (adapt existing routes; do not create parallel auth)
POST /api/co/outlets/:outletId/staff — assign or invite, idempotency key
POST /api/co/outlets/:outletId/staff/:staffId/activation-resend
POST /api/co/outlets/:outletId/staff/:staffId/pin-reset
PATCH /api/co/outlets/:outletId/staff/:staffId — role/status
POST /api/pos/staff/activate — one-time token exchange
POST /api/pos/staff/unlock — registered device, outlet, staff and PIN
POST /api/pos/staff/lock — terminate staff session
All endpoints enforce CSRF/session requirements, role authorization, request validation, rate limits and safe error responses.

## Mandatory staging tests / acceptance
T01 admin adds staff to outlet: pending reservation, email queued.
T02 200 staff in same outlet: no duplicate active/pending PIN.
T03 100 concurrent allocations: database uniqueness holds under contention; retry bounded.
T04 same employee in two outlets: two separate credentials; outlet isolation.
T05 staff cannot log in at wrong outlet or unregistered device.
T06 activation link expires, single use, wrong email/account rejected.
T07 email provider failure: no ghost active account; resend safe.
T08 invalid PIN throttling and lockout; no user enumeration.
T09 reset invalidates old PIN immediately and creates unique new pending PIN.
T10 revoked/disabled staff immediately denied.
T11 tenant/company cross-access forbidden.
T12 duplicate API submissions idempotent.
T13 DB migrations reversible with backup and dry run; no deletion of live staff.
T14 build, typecheck, lint and existing POS/CO/payment regression suite pass.
T15 browser E2E on Vercel staging with test email and registered test device.
T16 verify marizhq.com and pos.marizhq.com DNS/proxy/routing before domain reassignment.

## Deployment gates
G0: identify current CO/POS schema, auth, email provider, env variables and production/staging separation.
G1: implement in feature branch; tests and migrations in PR; review security and tenant boundaries.
G2: deploy preview only; seed synthetic accounts; run T01–T16 and collect evidence.
G3: approve production release only after rollback plan, backup, domain routing confirmation and customer journey proof. No automatic DNS changes or domain reassignment.
G4: Codex handover must include commit SHA, PR URL, migration IDs, CI output, staging URL, test evidence, failures, rollback commands and owner.

## Current evidence and blockers
Vercel mariz-pos-operational-preview latest deployment reported READY, target null, live false; configured pos.marizhq.com. HQ preview READY. marizhq.com nameservers are Cloudflare, but Vercel domain ownership query returned 403 and DNS configuration flagged possible misconfiguration. No Cloudflare connector access verified. Earlier local 200-employee simulation was not a live integration test. No verified PIN implementation or live employee E2E tests. DO NOT claim deployed or complete.
