# MARIZ HQ V2 — Neon Auth / Data API boundary

Email verification: Neon Auth require_email_verification=true was confirmed from the connected configuration on 14 October 2026. Verify at signup also requires an end-to-end OTP test before allowing public onboarding. The separate verify_email_on_sign_up field was still false.

Project: small-cell-04853885, branch br-bold-unit-aothxcnn, database marizhq_v2, region Singapore.
Neon Data API was provisioned with managed Neon Auth token verification, no default table grants, mariz_core exposed, CORS restricted to the MARIZ V2 preview domain, 50-row limit and aggregates disabled.

Authenticated and anonymous role direct access to mariz_core.company_profiles was checked and denied. The JWT-scoped API wrappers api_my_companies(), api_register_company(...) and api_start_kyb(uuid) were applied to Neon and saved as migration 003. They derive identity from auth.user_id() (a validated Neon JWT claim). Authenticated callers have EXECUTE on these three RPCs but no direct SELECT/INSERT on company tables and no KYB approval. Anonymous callers cannot execute these RPCs.

NEVER connect database-owner credentials to Vercel. Neon API-created roles inherited neon_superuser and are not acceptable web app credentials. A SQL-created role mariz_runtime_restricted has no privileged membership but Neon cannot issue its password through the role reset API. Prefer Neon authenticated Data API rather than bypassing credential restrictions.

Application follow-up: replace the password-requiring Neon serverless driver calls with a JWT-authenticated Neon Data API client. The existing Next.js code has NOT yet been rewired to these JWT-scoped RPC endpoints. Until verified, both NEON_V2_ENABLED and NEON_PUBLIC_REGISTRATION_ENABLED stay false on the V2 Vercel project. Require signed user session, registered org ownership, cross-tenant tests, rate limiting, OTP verification, secure KYB document upload and test-run database isolation.

No live company onboarding, POS payments or store terminal operation. Shahira production POS remains unchanged. The latest Vercel deployment was blocked by free daily quota.
