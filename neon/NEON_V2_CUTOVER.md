# MARIZ HQ V2 Neon-to-Next.js execution checkpoint

## Implemented on the isolated V2 branch
- Official `@neondatabase/auth` Next.js server adapter and `@neondatabase/serverless` PostgreSQL client, pinned in package-lock.
- Managed Neon Auth proxy at `/api/auth/[...path]`; MARIZ CO sign-up, sign-in, sign-out action and forms with 12-character minimum passwords.
- Neon-managed Auth organization creation and separately verified legal company profile registration (MYR 0; no paid product activation).
- Company workspace reads from the `mariz_core.my_company_profiles` security-definer function, scoped to the authenticated, email-verified account.
- KYB draft creation through the Neon database, without accepting unverified documents.
- Prepared MARIZ POS demo route requires verified company membership when the Neon backend is enabled.
- Neon Auth base URL and independently generated signing-cookie secret are set in the **isolated MARIZ HQ V2 Vercel project** only, as encrypted server environment variables.
- `NEON_V2_ENABLED=false` and `NEON_PUBLIC_REGISTRATION_ENABLED=false` deliberately remain in Vercel. **No live registrations or payments are enabled.**

## Tests and actual infrastructure
- GitHub CI passed: npm ci, all automated tests, TypeScript typecheck and Next.js production build.
- Isolated Neon database and 17 MARIZ tables exist; initial eight authorization functions plus the member-scoped view function are deployed. No customer records have been inserted.
- Negative authorization tests rejected nonexistent/unverified users.
- Vercel deployment remains BLOCKED by the platform's 100-per-24-hours Free limit. Do not claim the latest commit is live.

## Security blockers BEFORE turning on V2
1. In Neon Console, enable **Sign-up with Email** and **Verify at Sign-up**; confirmation currently defaults OFF at the provider layer. Use email verification codes on shared SMTP, or add custom SMTP for verification links.
2. Create **least-privileged database runtime credentials** without membership in `neon_superuser`. Neon API-created roles `mariz_v2_runtime` and `mariz_app_v2` were observed inheriting `neon_superuser`; we DID NOT connect their passwords or Neon database-owner credentials to Vercel. Permission revocation via the existing management connection was denied. These roles are NOT valid web application runtime roles.
3. Add the limited `NEON_DATABASE_URL` to V2 Vercel only after its effective SQL privileges are verified: direct SELECT/INSERT/DELETE on KYB tables must be denied, with only explicit EXECUTE on `mariz_core.my_company_profiles`, `register_company_profile`, and `start_kyb`. A secured Neon Data API/RLS-based integration is also viable but requires equivalent JWT/tenant testing.
4. Configure email delivery, bot protection, company uniqueness/claims, storage-scoped evidence uploads, reviewer permissions, KYB approval checks and anti-malware handling.
5. After the deployment quota resets, deploy **one consolidated release** and complete actual sign-up/email-verify/company/KYB authorization and cross-tenant browser tests BEFORE opening registration.
6. The old Supabase POS Back Office, historical auth paths, Stripe activation, real terminal login, financial transactions and printing remain disabled; port or remove the legacy adapter before real POS rollout.

## Business rules remain locked
MARIZ HQ public offerings: MARIZ POS and Custom Web Software. MARIZ CO is free company registration and organization gateway. No MARIZ Events marketing. Prepared POS demo: free, preconfigured, no expiring trial. Product activation: paid separately, explicit consent. Original PNG and brown MARIZ branding retained. Shahira production POS unchanged.

## Staging outcome
The source integration has passed code/build tests, but **it is not a working live customer sign-up yet**. Do not enable `NEON_V2_ENABLED` or `NEON_PUBLIC_REGISTRATION_ENABLED` without all guards.
