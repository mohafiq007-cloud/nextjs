# MARIZ POS V2 — consolidated no-quota build (2026-10-14)

Commercial boundaries remain fixed: MARIZ CO is free organization onboarding and KYB; MARIZ POS is an available product; custom web software is quotation-led. No Events marketing. Prepared demo POS is immediate, preconfigured, resettable and unlimited-duration, with no subscription or demo setup.

## Files
- Original MARIZ Point of Sale Logo.png preserved in Library; the repository includes a 120x120 optimized real PNG of the complete artwork, with no visual crop, for the responsive header and POS sandbox.
- POS sample terminal is prepaired by default; adding another terminal is optional. Sample order totals are computed in integer cents.
- "lib/mariz/pos-policy.mjs" encapsulates server-integration-grade domain logic; "tests/pos-policy.test.mjs" covers money, access, pairing expiry, header and simulated sales.
- "supabase/migrations/202610140006_mariz_pos_v2_admin_setup.sql" is a staged authenticated, audited administrative setup API for V2; it will not run against existing environments.

## Security gates
The schema and RPCs are NOT deployed. Actual checkout, device tokens and staff PIN login are NOT operational. The existing free Supabase project limit prevents creation of a dedicated V2 project without billing approval or a free slot. Do not repoint V2 to Shahira or MARIZ HQ V1. Admin RPCs require verified KYB, active POS workspace and an authorized company owner/admin, with no browser write grants on operational tables.

## Pending
- Fresh isolated Supabase database and migrations 001–006, rollback and RLS tests
- Stripe product-level subscription activation, entitlements, grant audit, grace periods
- Secure short-lived terminal challenge, device-bound credentials, credential rotation/revocation
- Staff PIN hashing and retry lockouts, shift sessions, device/offline recovery
- Atomic integer-cent sales, payments, refunds, credit ledger and precise receipt printer bridge
- Preprod QA on compatible Android tablet/phone, rollbacks, customer migration plan
- Independent pixel review on 360px/390px phones before frontend approval
