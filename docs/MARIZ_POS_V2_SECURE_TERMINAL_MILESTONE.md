# MARIZ POS V2 — Secure Terminal Milestone (14 October 2026)

## Current status
Code committed to the isolated V2 branch. NOT enabled, database-migrated, browser-tested, or deployed on the MARIZ HQ V2 alias. Vercel has been rejecting the latest V2 builds due to its build/deployment rate limit.

NEVER apply V2 migrations to Shahira, MARIZ HQ V1/Production, Simply Sandwiches, or unrelated projects. A fresh isolated V2 Supabase project is required; the Supabase organization currently has no available free slot.

## Delivered
- Migration 008: five-minute one-time pairing codes with five attempts; 30-day revocable random device tokens; bcrypt hashes of server-HMAC-peppered 6–8-digit staff PINs; five failed PIN attempts cause a 15-minute lockout; 12-hour operator sessions.
- Migration 009: company-admin terminal revocation and staff suspension invalidating all linked sessions. Revocation works even after workspace service status changes.
- Server helpers: cryptographically random 256-bit secrets; SHA-256 bearer token fingerprints; server-only PIN pepper; HttpOnly Secure SameSite cookies; same-origin enforcement and small JSON-body limits.
- API endpoints: pair, session, login, logout, with a default-off live terminal switch.
- Operational route /pos/terminal: login and pairing UI; explicitly NO checkout, sale posting, printing, or public company signup.
- Real company Back Office: restricted administrator actions for issuing pairing code, enrolling/rotating PINs, suspending staff and revoking terminals.
- CI source checks: security contract test plus the existing POS financial policy tests, with workflow set to run all test files.

## Free demonstration remains separate
The /co/pos/preview demo is preconfigured, no time limit, no demo setup, no payment. All its PINs, sales and credits are entirely simulated.
The company Back Office and operational device terminal are distinct: they require approved MARIZ CO organization, explicit POS entitlement, device binding and staff sign-in.

## Mandatory release gates
1. Create a new dedicated V2 Supabase project with cost/plan approval (do NOT bypass the quota with a legacy project).
2. Run migrations 001-009 in strict order on an isolated disposable test project, confirming pgcrypto functions exist in the extensions schema.
3. Configure Supabase Auth, private KYB evidence storage, reviewer approvals, and all tenancy isolation grants and policies.
4. Configure server-only SUPABASE_SERVICE_ROLE_KEY and a fresh random 32+ character MARIZ_POS_PIN_PEPPER; keep MARIZ_POS_LIVE_TERMINALS_ENABLED=false.
5. Add upstream IP/client request throttling to PIN login and pairing routes. Database five-attempt limits alone are insufficient.
6. Test wrong/expired/reused codes, concurrent claims, stolen/expired tokens, 5x PIN lockout, PIN rotation, staff suspension, terminal revocation, cross-tenant authorization and suspended entitlements.
7. Verify all schema/RPC migrations, recovery/backups, CI tests and Android browser printing integration. Get an explicit approval to enable the live terminal flag.
8. Only then implement/enable atomic payments, receipts, shifts, offline sync, credit ledger integration and live outlet cutover.

## Known limitations
- Actual DB migrations have NOT run, the API functions have NOT been runtime-tested, and the code has NOT passed live end-to-end authentication testing.
- Static source-contract checks are not full compile or security acceptance tests.
- No IP-level throttling is implemented yet; it is mandatory before production use.
- No customer-origin PIN setup or browser PIN handling outside secure server actions; demo 4-digit PINs are never production credentials.
- Stripe billing/entitlements, protected device sessions and credit logic require separate release acceptance.
- Shahira's existing POS is unchanged.
