# MARIZ HQ V2 — Billplz Sandbox Adapter (16 October 2026)

## Decision / scope

- **Billing prices remain UNSET.** Do not create default subscription prices.
- **Billplz is an optional gateway**; preserve Stripe. Never switch or migrate an active customer automatically.
- **MARIZ CO company registration stays free.** This change neither creates paid onboarding nor product entitlements.
- This code is a **non-production scaffold** on a separate feature branch. It is not deployed and the SQL has not been applied.
- This first connector supports **Billplz Bills** (one-time/manual recurring invoice payments), not automatic monthly card charging.
- MARIZ HQ remains the authority for organizations and entitlements. Billplz provides payment collection. The database stores financial event state but payment confirmation does not itself activate software.

## What's prepared

1. Server-only Billplz sandbox create-Bill helper, validates MYR minor units and returns sandbox checkout URL.
2. Disabled-by-default callback route at `POST /api/payments/billplz/callback`.
3. HMAC-SHA256 X Signature verification, including constant-time comparison, duplicate-field rejection, amount and collection validation.
4. Proposed tenant-linked `mariz_billing.payment_requests` and idempotent `mariz_billing.provider_events` tables with callback transaction function.
5. Signature unit tests and an environment-variable example.

No publicly callable endpoint creates invoices or payment links. No customer can be charged through this branch.

## Blocking prerequisites

- **Neon role security must be fixed.** `mariz_v2_runtime` and `mariz_app_v2` currently inherit `neon_superuser`; do not use these as web runtime credentials.
- Complete the V2 isolated runtime role, grants and authorization tests. The migration intentionally provides no runtime function GRANT.
- Create a **separate Billplz sandbox account**, collection, API secret and X Signature key; place secrets only in the isolated MARIZ HQ V2 server environment (never git, logs, or NEXT_PUBLIC variables).
- Use a stable HTTPS V2 preview hostname for `BILLPLZ_PUBLIC_BASE_URL`. Configure V2 deployment and verify callback reachability.
- Create authenticated, authorized operator-only issuance and recording flow. That flow must register a bill id + expected amount + organization before giving its URL to anyone; handle retries/partial failure robustly.
- Apply and test `neon/migrations/20261016_004_billplz_sandbox_prep.sql` on an isolated Neon test branch first, and only later on the V2 database with approval and backups.
- Test valid/invalid/replayed callbacks, wrong collection and amount, tenant isolation, missed callback reconciliation, no entitlement activation, and failed payments.
- Production gateway enablement requires a separate approval and release.

## Environment variables

```env
MARIZ_BILLPLZ_ENABLED=false
BILLPLZ_ENV=sandbox
BILLPLZ_SECRET_KEY=
BILLPLZ_COLLECTION_ID=
BILLPLZ_X_SIGNATURE_KEY=
BILLPLZ_PUBLIC_BASE_URL=
```

The feature must remain disabled until every prerequisite is met. This implementation explicitly rejects production-mode Billplz requests. Billing API payloads and X Signature key must never appear in public client bundles.

## Architecture

```
MARIZ HQ / MARIZ CO (organizations and entitlements)
       |
       v
MARIZ Billing (future operator-authorized invoice issuance)
       |
       +-- Stripe adapter (untouched)
       +-- Billplz sandbox adapter (prepared, OFF)
               |
               +-- Create a Bill (server-to-server only)
               +-- Customer pays via Billplz hosted payment URL
               +-- Signed callback -> validate -> record payment event
                                             |
                                             +-- NO automatic entitlement changes
```

Provider API docs: https://support.billplz.com/api
Sandbox guide: https://support.billplz.com/guide/sandbox-testing
Callback guide: https://support.billplz.com/guide/webhooks-and-callbacks

## Acceptance criteria for first sandbox demo (NOT YET PASSED)

- An authorized MARIZ operator can select a registered test company, create an agreed **one-off test amount** without creating a global product price, and issue a bill.
- Bill is stored with immutable company and expected amount before checkout URL is exposed.
- Sandbox payment generates a valid signed callback, exactly-once recorded as paid.
- Forged, mismatched, duplicated or unknown callbacks cannot mark another bill paid.
- MARIZ entitlement does not change automatically.
- Existing Stripe integration and current deployments remain unchanged.
