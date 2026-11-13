# MARIZ HQ V2 — Wave 2 implementation (14 October 2026)

This branch is separate from Shahira and all legacy MARIZ production databases. The V2 preview deployment is not a production-onboarding service.

Implemented:
- Email registration/sign-in and confirmation route, activated only with a dedicated V2 Supabase project.
- Company creation, duplicate legal-identity constraint and owner membership.
- KYB application, private evidence upload, and server-side submission.
- Restricted reviewer console, six mandatory checks, decision records and conflict-of-interest protection.
- Audited access to evidence files with 45-second links.
- Free registration with no checkout; prepared interactive demos with no trial timer.
- Verified-company demo access gate when live backend configuration is supplied.

Database migrations must run in order: 202610140001, 002, 003, 004.

Commissioning gates: new V2 Supabase project; isolated V2-only environment configuration; email confirmation and callback configuration; human reviewer grant; malware scanning; privacy/document retention review; end-to-end authorization and restore tests. No actual customer registration should be enabled before these are complete.

Environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_MARIZ_APP_URL, and SUPABASE_SERVICE_ROLE_KEY (server-only, for authorized evidence-view route). Never expose the service-role key in any NEXT_PUBLIC variable.

The current product demos have simulated client-side data. No real transactions, real payments, or real business documents should be put in the V2 preview.
