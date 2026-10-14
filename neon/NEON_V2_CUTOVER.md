# MARIZ HQ V2 — Neon backend cutover checkpoint (14 October 2026)

## Current isolated project
- Neon Free organization: Moh (org-icy-rice-19258699).
- Project: **MARIZ HQ V2 Isolated** (small-cell-04853885).
- Singapore region: aws-ap-southeast-1.
- PostgreSQL: 17, DB: marizhq_v2, default branch: br-bold-unit-aothxcnn.
- Neon Auth: managed Better Auth provisioned, synced database schema neon_auth.
- Private Neon object-storage bucket: mariz-kyb-private (access_level=private).
- No legacy Shahira/MHQ/Kiefa database was modified or connected.

## Successfully applied
- Two private MARIZ schemas: mariz_core and mariz_private.
- 17 application tables: company_profiles, KYB applications/evidence/checks/decisions, reviewer grants, append-only audit events, products, entitlements, POS workspaces/outlets/staff/devices, and private credential/pairing/session records.
- 8 database functions including required verified user & owner/admin membership, company registration, KYB submission/reviewer six-check approval, and gated POS outlet creation.
- Neon Auth organization/member/user tables are canonical identity/membership; MARIZ CO company_profiles supplies the legal company/KYB business record.
- Catalog: MARIZ POS (available, prepared demo), Custom Web Software (bespoke quotation), **no MARIZ CO product**, **no Events marketing**.
- All company registration fees are zero. Real POS entitlements require separate explicit billing activation.
- Unknown/unverified identity attempts to create company profile or POS outlet were rejected. No customer companies exist yet.
- Native schema archived in neon/migrations/20261014_001_mariz_hq_v2_neon_native.sql (requires managed Neon Auth provisioned before applying to a clean DB).
- Schema and database functions restricted from PUBLIC by REVOKE. Production application roles, SQL RLS policies and end-to-end auth must undergo security review before registrations are enabled.

## CRITICAL: Neon Auth default settings
The provider was provisioned with email/password registration allowed and email verification NOT REQUIRED by default (require_email_verification=false, verify_email_on_sign_up=false). The connected Neon settings tool currently does not expose these configuration fields for modification. **Do not open MARIZ public registration until Neon Console has email verification enabled and verified.** Database registration already checks neon_auth.user.emailVerified=true, but this does not replace provider-level verification policy.

## Official Next.js integration — pending
Use Neon's official, pinned server/client SDK, not a homemade auth proxy:
- @neondatabase/auth/next/server with createNeonAuth() and auth.handler() on /api/auth/[...all], signed session cookies from NEON_AUTH_COOKIE_SECRET.
- @neondatabase/auth/next for client sign-up/in and session.
- Use a server-side PostgreSQL driver (@neondatabase/serverless) or a narrowly scoped/locked Data API after database roles and RLS are reviewed. Never expose DB owner credentials.
- Get user id from validated Neon Auth session ONLY; never trust form-supplied user id. Call DB authorization functions with that verified user id and organization id; always parameterize queries.
- Company registration first creates a Neon Auth organization, then a MARIZ company_profiles record and KYB draft. Onboarding must not initiate Stripe, paid subscription, product activation, or live terminal creation.
- Only after KYB is approved may the company enter the unlimited-duration prepared MARIZ POS demo. Product activation remains explicitly paid, separate and optional.
- KYB uploads: private object storage; server-scoped presigned URLs and evidence checks; validate file signatures, size, MIME, malware scan, timestamps, SHA-256 digest, access logs and retention before public release.
- Neon Auth's trusted_origins currently empty. Add the approved MARIZ V2 domain with the connected Neon trusted-domain action when public registration and domain choice are ready.
- Set runtime values in the V2 preview project only: NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET (32+ random chars), DATABASE_URL (secret), optional NEON_V2_ENABLED=false until validation. NEVER use NEXT_PUBLIC_ for secrets or copy values from other products.

## Deploy / release checkpoints
1. Replace existing Supabase V2 adapters/actions/routes with Neon-native implementation; older supabase/migrations/ remain historical and MUST NOT run against the new Neon DB.
2. Run npm dependency lockfile update and GitHub CI/TypeScript/build checks on the isolated branch; do not merge to main.
3. Configure provider email verification and allowed origins.
4. Build/end-to-end test registration, duplicate company handling, KYB documents, reviewer conflicts and six checks, staff terminals, user sessions, account lockouts, tenant isolation, audit and data backup.
5. Keep real Stripe checkout, financial transactions, real receipt printing and Shahira migration disabled until their separate acceptance tests.
6. Repoint Vercel V2 environment and deploy only when CI is green, correct MARIZ brown/original PNG branding passes phone review, and Vercel quota permits a consolidated release.

**Status:** Neon database, Auth, private storage and schema are provisioned; Next.js Neon adapter, production RLS and onboarding screens are NOT YET CONNECTED. Do not imply the system is ready to accept company KYB records or process sales.
