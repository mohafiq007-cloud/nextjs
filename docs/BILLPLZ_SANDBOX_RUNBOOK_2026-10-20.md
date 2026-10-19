# MARIZ HQ V2 Billplz sandbox runbook

Scope: existing PR #2, feature/billplz-sandbox-adapter, Vercel project mariz-hq-v2-preview. Existing Stripe, live MARIZ Cloudflare services, production POS and Neon main are outside this change.

## Configuration recovery

Use the existing MARIZHQ organization at https://www.billplz-sandbox.com/ . Do not create another account. Account → Settings → Keys & Integration provides the API Secret Key and X Signature Key; Collections provides the existing sandbox Collection ID. Store values directly in Vercel's server-side Secret settings, Preview target, branch feature/billplz-sandbox-adapter only:

- BILLPLZ_SECRET_KEY
- BILLPLZ_COLLECTION_ID
- BILLPLZ_X_SIGNATURE_KEY

These three names were absent at inspection. MARIZ_BILLING_DATABASE_URL already exists as a sensitive branch variable and was not decrypted. BILLPLZ_ENV=sandbox and MARIZ_BILLPLZ_ENABLED=false were verified. The configured public origin is https://mariz-hq-v2-preview-git-featur-3a4464-mohafiq007-1535s-projects.vercel.app . Its callback is /api/payments/billplz/callback. Never use live-account credentials or a bypass secret in a callback URL.

Set MARIZ_BILLPLZ_OPERATOR_IDS to the comma-separated UUIDs of approved, email-verified test operators. Empty is deny-all. The database separately checks verified/unbanned account status, owner/admin membership and sandbox_organizations approval. Approval rows default disabled and are never added automatically for customer companies.

## Implemented workflow

- Operator desk: /co/billing/sandbox . It stays disabled until readiness flags, credentials, restricted connections and operator authorization pass.
- POST /api/payments/billplz/invoices requires a verified allowlisted operator, same-origin request and application/json. Payload: organizationId, idempotencyKey (stable UUID), amountMinor (explicit one-off MYR cents), customerName, customerEmail, description. No client actor, payment destination or callback override is accepted.
- Neon reserves and claims the invoice once. Provider creation uses server-only HTTP Basic authentication against the fixed sandbox endpoint, fixed callback and invoice/company references. Delivery is explicitly false; no email/SMS or pricing schedule is introduced.
- Provider ID, expected amount, collection, organization and checkout URL commit before the URL can be returned. Network or registration uncertainty stops automatic issuance retries. Preserve the invoice UUID and recover the existing provider bill instead.
- POST /api/payments/billplz/reconcile requires the same authorization. Payload: requestId and, only for uncertain creation, an existing providerBillId. It reads the Bill from the authenticated sandbox API, verifies invoice/company references, amount and collection, recovers registration if necessary, then records a deterministic idempotent event.
- Callback validates a bounded form body, exact content type, X Signature, amount/paid amount, collection and consistent state. SQL validates the stored collection/amount again. Duplicate valid deliveries return success without a second event. Wrong-tenant operator access and cross-bill digest replay are rejected; delayed unpaid events cannot regress paid state. Payments never grant entitlements.
- Billing audit records track reservation, issuance, registration, uncertain creation, callbacks and reconciliation. Runtime has no direct table/sequence access. API errors use fixed safe codes, never provider bodies, credentials or database exception messages.

Billplz's documented callback construction sorts concatenated key/value source strings before HMAC-SHA256. This matters for paid and paid_amount; the earlier key-only sort was corrected. Provider documentation: https://support.billplz.com/api . The existing V3 Bills integration is retained.

## Migration and security

20261016_004 and 005 already existed on isolated test branch br-empty-band-aoi1kzkc, project small-cell-04853885, database marizhq_v2. New 20261020_006 was applied there transactionally with rollback-only synthetic workflow assertions. No main-branch migration is authorized by this runbook.

006 adds sandbox organization approval, durable issuance/idempotency state and audit records. Only selected SECURITY DEFINER functions with empty search_path are granted to mariz_billing_runtime_limited. Its old five-argument callback grant is revoked so collection checking cannot be bypassed through the old interface. No owner credential, role inheritance expansion or direct private-table grant is introduced.

The former owner connection cannot SET ROLE to the limited login; no grant was expanded to work around that. Function behavior tests run under the owner with synthetic fixtures rolled back; a separate actual limited-role connection verifies effective privileges and negative access. No test company, invoice, provider event or entitlement remains after the SQL fixture test. Isolated identity sequences can advance despite rollback.

## Sandbox acceptance gate

1. Configure missing sandbox secrets privately; confirm Auth/database endpoint alignment and restricted runtime readiness. Keep the flag false during configuration.
2. Use a registered test organization and verified operator through existing Neon Auth; approve that specific organization in sandbox_organizations and configure the operator UUID. Never fabricate a production identity or turn on public company registration for this purpose.
3. Verify provider callback reachability at the exact stable sandbox origin. A Vercel login redirect is not a functioning callback. A domain-only preview protection exception is suitable only after all private application routes are verified fail-closed; do not disable project-wide protection, add a paid plan or expose a project bypass secret.
4. Once security/configuration prerequisites pass, perform a controlled sandbox-only acceptance run: operator creates invoice → hosted sandbox checkout → simulated success/failure → signed HTTPS callback → Neon ledger/audit verification → reconciliation and replay/mismatch/tenant tests. Never use real bank/payment credentials or live Billplz keys.
5. Keep production billing, subscriptions, product activation and prices disabled. If the provider flow cannot be verified, leave MARIZ_BILLPLZ_ENABLED=false and report the exact blocker. A deployed preview with disabled routes is not payment acceptance.

## Recovery

Set MARIZ_BILLPLZ_ENABLED=false in the branch settings and redeploy the same preview to stop processing. Restore the prior preview alias only if necessary; do not touch the production Vercel alias or MARIZ Cloudflare domains. Keep ledger/audit rows for investigation. Do not drop schema or restore whole databases as an application rollback. The older callback expects the revoked legacy grant; retain billing disabled instead of reopening that weaker path.
