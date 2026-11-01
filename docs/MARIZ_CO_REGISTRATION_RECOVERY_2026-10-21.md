# MARIZ CO registration: 21 October 2026 handoff for Codex

Status: **AUTHENTICATED ISOLATED STAGING VERIFIED; HOSTED RELEASE VALIDATION IN PROGRESS. Historical checkpoint below is superseded by the latest checkpoint.**

## 1. Confirmed root cause

The existing CO login/registration UI and Neon database functions were created, but the runtime path still required a separate PostgreSQL password. The isolated V2 database is already provisioned with a JWT-verified Neon Data API (schema mariz_core) and RPCs with tenant-specific permissions. Public signup is intentionally fail-closed. The public MARIZ CO domain does **not** point to the available Vercel preview project.

- Repo: `mohafiq007-cloud/nextjs`.
- Source baseline: `feature/billplz-sandbox-adapter` at `4c7a1c6d8cbe4ddffa90d09bf26b6db984887176`.
- Recovery branch: `fix/mariz-co-onboarding-data-api-20261021`.
- Vercel preview project: `mariz-hq-v2-preview` / `prj_7JRTQG5n7urenajGai6HhHD1TeSx` (NOT production MARIZ CO).
- Neon project: `small-cell-04853885`; main branch `br-bold-unit-aothxcnn`; database `marizhq_v2`.
- Auth allowed origin today: `https://mariz-hq-v2-preview.vercel.app` only.
- Data API allowed CORS origin today: same preview origin only.
- Neon Auth `require_email_verification=true`, but `verify_email_on_sign_up=false`. No verified new-user OTP/browser cycle was confirmed.
- Main database at audit: 0 company profiles; 0 KYB applications; 2 Auth users.
- Read-only privilege audit: authenticated may EXECUTE `mariz_core.api_my_companies`, `api_register_company`, `api_start_kyb` but cannot directly SELECT/INSERT `company_profiles`; anonymous lacks schema and RPC access.
- Vercel runtime errors API returned HTTP 403. No live request/stack trace was obtained. Avoid asserting a particular failed customer request.
- Existing KYB admin screen uses historical Supabase and evidence upload is not production-ready.

## 2. Changes in this recovery branch

- Add a strict HTTPS+host+path-pinned Neon Data API client and allowlisted RPCs; no owner Postgres credentials sent to registration.
- Use `auth.token()` to obtain signed Neon JWT; NEVER use `getSession().data.session.token` (opaque session identifier) as Data API bearer.
- Switch company listing, company profile insertion, and KYB draft creation to JWT-scoped RPC wrappers. Database function derives identity via `auth.user_id()`; never submit client actor IDs.
- Require all 3 environment feature gates for public signup; remain OFF until acceptance.
- Keep legacy SQL-only path fail-closed for POS/billing; do not extend this scope to POS rollout.
- Add pure unit tests and an updated contract test. No Neon schema changes or customer data changes.
- Explain disabled registration clearly rather than showing a broken form.

## 3. Codex next actions (ordered)

1. Review diff against Billplz baseline. Confirm `@neondatabase/auth@0.5.0-beta` exposes server `auth.token()` as typed; if necessary adapt to this pinned version. Run `npm ci && node --test tests/*.test.mjs && npm run typecheck && npm run build` (Node 24), repair any failures.
2. Perform staging-only controlled integration on **isolated data or disposable Neon test branch**. Confirm JWT from verified user has role `authenticated`, is accepted by the Data API and maps to `auth.user_id()`. Run negative anonymous, unverified, cross-user and cross-company access tests.
3. Implement and verify the proper email sign-up OTP journey in Neon Auth. Set verify-at-sign-up only when a tested email delivery/callback can actually complete. Test wrong OTP, expired OTP, resends, duplicate email and password reset. Do not change Auth production settings blindly.
4. Resolve failed partial company registration. If Auth organization creation succeeds and the profile RPC fails, avoid orphan organizations with idempotent recovery or safe compensation. Check same SSM number with different formatting, concurrent submissions, slug uniqueness, and the DB limit of 3 profiles per user per day.
5. Review `mariz_core.api_*` SECURITY DEFINER search paths, role grants and owner privilege, JWT expiry, PII errors, traffic limiting, and audit events. Never expose reviewer/approval functions to the registration client.
6. Implement secure private document upload and reviewer workflow separately. Existing Supabase KYB administration is NOT a production-ready Neon reviewer. Do not misrepresent a KYB draft as approved.
7. Bind the correct owned domain to the **correct reviewed production project** after owner approval; add origin to Neon Auth trusted domains and Data API CORS only when routing is verified. Test login/OTP and company workflow from the actual domain, including mobile.
8. Add `NEON_DATA_API_URL` to the isolated staging environment only; recheck environment duplicates and any Vercel `readable-secret` flags. Ensure company signup never needs an elevated SQL connection. No secrets should appear in logs, GitHub, or client bundles.
9. Deploy one consolidated staging candidate and capture verified evidence (screenshots, request IDs, pass/fail of real steps) with signup and billing disabled. Require explicit launch sign-off before enabling `NEON_V2_ENABLED`, `NEON_PUBLIC_REGISTRATION_ENABLED`, `MARIZ_CO_PUBLIC_SIGNUP_ENABLED`, and `MARIZ_EMAIL_VERIFICATION_ENFORCED`.
10. Keep POS, live Billplz, KYB approvals, and unrelated MARIZ products isolated. Confirm subscriptions never activate automatically on free registration.

## 4. Acceptance matrix

- New customer can sign up with an accessible email, verify via real OTP, sign in on a real browser.
- Verified owner can create one MY company; legal name and normalized SSM stored once, no duplicates; company appears on their workspace.
- Unverified, anonymous, another company's user, and client-supplied forged IDs are denied.
- KYB draft starts once and is NOT approved without a reviewer; document upload UI cannot claim active service while disabled.
- Signup denial shows safe actionable UI; partial failures do not silently create duplicates.
- Billing/POS never activate without explicit separate consent.
- Preview credentials, database owner role, and test data never bleed into production.

**Handoff contract:** Codex owns test, hardening, reconciliation and deployment readiness. Do not merge or flip public signup until all gates pass.

## Execution checkpoint — 21 October 2026

Implemented on this existing recovery branch: actor/normalized-SSM-derived organization identity, safe retry after Auth create timeout or profile failure, concurrent-create arbitration through Auth's unique slug, and explicit six-digit Neon email verification/resend forms. Migration 007 makes identical profile replay idempotent, rejects conflicting details, serializes daily rate-limit checks and preserves verified administrator checks. Older random-slug orphan organizations still need operator reconciliation; none were deleted.

Verified: Node 24.18.0, clean locked dependency installation, 133 tests using `node --experimental-vm-modules --test tests/*.test.mjs`, typecheck and production build. Recovery migration tested inside a rollback-only subtransaction on `small-cell-04853885 / br-empty-band-aoi1kzkc / marizhq_v2`: normalized replay yields one profile/audit; conflicting replay, foreign user and unverified user denied. Readback confirms original function restored and zero synthetic users retained. This is database-layer evidence, not an authenticated HTTP/JWT or real email E2E claim.

Actual production still serves the separate Cloudflare CO holding page. Vercel alias resolves to older deployment `dpl_AFJkWc9QGAFauidEKYKeFfvQ5rPw`. Neon main readback still has verify-at-signup/signin false, require-email-verification true, shared SMTP and only the existing preview trusted origin. No settings or signup flags changed. Migration 007 is NOT applied to main or persisted on the test branch. KYB private uploads/reviewer, controlled OTP/session E2E, legacy orphan support recovery and production routing remain NO-GO gates. See the consolidated execution report for artifact hashes and current release state.

## Authorized release checkpoint — 21 October 2026, 10:25 UTC

Owner authorized full deployment and prioritized MARIZ CO registration. The exposed preview bypass credential was revoked and replaced; no secret value belongs in this checkpoint.

Dedicated staging: `small-cell-04853885 / br-jolly-frost-aoz9yzhn / marizhq_v2`. Migrations 007, 008 and 009 persisted only here; main and legacy Supabase remain unchanged. Branch-scoped preview environment enables registration and private KYB uploads; Billplz and live terminals remain disabled. Brevo custom SMTP configured by owner, sender `MARIZ CO <noreply@marizhq.com>`; real delivery passed SPF/DKIM/DMARC.

Implementation: Neon-native private evidence storage (4 MB PDF/PNG/JPEG, signature/size/hash validation, authenticated download), submission, independent manual reviewer queue, six checks, accepted official profile prerequisite, conflict-of-interest rejection, and a fresh email OTP for each final decision. The DB requires a short-lived signed proof bound to actor/application/decision/reason and a one-use nonce. Old decision RPC and underlying privileged functions remain unavailable to anonymous/authenticated roles. No approval activates a subscription.

Password recovery uses a narrow pinned-host adapter because the installed 0.5.0-beta SDK sends resets to a nonexistent `/email-otp/passcode` endpoint (upstream neon-js issue #229). The correct `/email-otp/reset-password` route is verified with real email, old-password rejection and new-password login. Secrets and codes never belong in source or deliverables.

Actual local browser -> Auth -> signed JWT -> Data API -> database/object storage evidence: real signup/verification/sign-in, one company profile, private upload and exact-byte download, anonymous 401, tenant A/B isolation, applicant reviewer denial, old decision API 403, forged/expired proof rejection, six-check approval gate, independent reviewer download/checks/email step-up/final approval, and no active paid entitlement. Synthetic staging identities/evidence only. Host at this verification was localhost:3017; this is not yet hosted production evidence.

Schema operations must refresh Neon Data API through its management update with ALL intended settings specified (mariz_core only, anonymous role, .role claim, max 50, aggregates false). Empty updates reset unspecified settings to defaults. SQL NOTIFY alone does not refresh this managed proxy fleet. Staging settings were restored and read back; production untouched.

Remaining release gates: latest hosted candidate and actual-domain E2E, isolated clean production identity/data/storage credentials, tested restore/rollback, operational reviewer access, privacy/retention ownership, and domain routing. Do not reuse synthetic approvals as real company evidence. Other workstreams retain their prior NO-GO decisions.

