# MARIZ POS V2: Back Office → terminal (14 October 2026)

## Current delivery
- Canonical protected-preview route: `/co/pos/preview` (linked from MARIZ public POS demo).
- Company-first design: MARIZ CO registration and verification remains the only company onboarding gateway.
- Back Office sample workflow: dashboard, outlet setup, staff records, menu setup, sample device pairing, demo sales ledger.
- Terminal workflow: require sample pairing, simulated staff PIN (seeded 1234/2468), sample shift, simulate orders/payment and show sales in Back Office.
- All state is local to the browser; refreshing clears the sample session. No real login, payments, printing, device credentials or data writing.
- Mobile layout and MARIZ original brown/gold branding remain applicable.
- Existing Shahira POS remains intact in `mohafiq007-cloud/restaurant-pos-system` and must not be changed until controlled acceptance/cutover.
- Canonical POS V2 schema is staged at `supabase/migrations/202610140005_mariz_pos_v2_schema.sql`. It is NOT applied to any existing database.

## Production readiness blockers
1. Fresh isolated Supabase project: active project count has reached the free-tier limit. DO NOT re-use Shahira or MARIZ HQ V1 credentials.
2. MARIZ CO identity and KYB migrations are unexecuted (001-004) and need RLS/audit testing.
3. Product subscription entitlement verification and explicit paid activation are not built.
4. Backend POS device provisioning, expiring pairing challenges, revocable device credentials, rate-limited PIN sessions and employee roles are not implemented.
5. Atomic sale/payment posting, receipt printing through Android bridge, docket/kitchen printing, shift close reconciliation, offline-sync safety, and production back-office reporting are not implemented.
6. Legacy component reuse must be tested before hardware is moved; V1 printer pairing should remain uninterrupted.

## End-to-end acceptance target
Verified company in MARIZ CO → explicitly activates MARIZ POS paid plan → Back Office creates outlet → manager enrolls staff and printer → manager provisions compatible device → staff verifies PIN on bound device → opens shift → creates order → collects payment → prints receipt/docket → closes shift → Back Office reconciles exact sale and tender. Repeat with network interruptions, revoked devices, invalid PIN, duplicate checkouts and restore/rollback.

## User-approved boundaries
- Only MARIZ POS and custom web software are public offerings.
- MARIZ CO is free company and organization gateway, NOT separately marketed as a product.
- MARIZ Events does not appear in public marketing.
- Prepared demo products are accessible without free trial expiry or customer-side demo setup. Demos are isolated and simulated.
- Shahira's existing terminals and data are untouched until V2 passes live-readiness checks.
