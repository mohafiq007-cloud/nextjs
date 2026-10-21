# Acceptance matrix and release gate

## Unit tests
- Theme tokens sanitized (hex, fonts, image URLs), all store layouts legible on small screens, backend design independent.
- Currency stored as integer sen; quantity and tax/discount math recomputed on server; no float drift.
- Valid state transitions only; negative quantity, malicious prices or stale item versions rejected.
- Separate order, payment, shipment state machines; unique idempotency for creating order/bill/courier booking.
- Domain normalizer, IDN/punycode handling, reserved hosts and conflicting ownership rejected.
- Customer account does not expose password/credential in localStorage; session revocation works.

## Integration & security tests (all mandatory)
1. **TENANT ISOLATION:** staff A, customer A, domain A never read/modify orders, secrets or draft/published site of tenant B using manipulated IDs, host headers, API bodies, cookies or domain paths.
2. **BILLPLZ genuine sandbox:** merchant connector verifies keys without logging them; real bill ID/URL and exact cents; X Signature calculated from official docs; correct callback changes state to PAID once. Wrong signature, wrong collection, altered amount, wrong tenant, duplicate, late redirect, failed bill, wrong currency/unsupported method are rejected or reconciled safely.
3. **DIRECT SETTLEMENT:** merchant-owned sandbox credentials create merchant bill. HQ platform billing connector cannot be used as merchant sales connector unless a separately authorized structure is approved.
4. **TERMINAL MANUAL:** a customer selecting cash/QR cannot self-confirm payment; staff permission, audit log and evidence required.
5. **LALAMOVE sandbox:** real Partner Portal sandbox credentials, verified geocoded coords, official service type, signed HMAC, quotation returned, expiresAt honored; booking does not happen on a client mock event or solely payment redirect.
6. **BOOKING RETRY:** network timeout after successful provider response; reconcile prior provider order before retry, duplicate request never creates second payable rider.
7. **WALLET & FEE:** insufficient wallet, quote mismatch, driver unavailable, cancellation/refund, subsidies and customer charged fee all recorded distinctly. Actual provider expense never overwritten by customer delivery fee.
8. **WEBHOOKS:** verify source auth/signature as available, prevent spoof/replay/reorder, idempotent processing, durable event log and dead letter/manual recovery.
9. **DOMAIN:** merchant-owned hostname TXT/DNS challenge, TLS, status, dynamic tenant routing. Domain takeover attempts denied. Unverified hostname returns safe error; rollback previous published version.
10. **CUSTOMER ACCOUNT:** verified login, profile and order ownership; another browser cannot log in merely by typing the same email; logout invalidates server session; opt-in marketing/consent policy, deletion/export.
11. **BULK ORDERS:** approved quotation/amount and schedule cannot be tampered with client-side; no partial authorization without merchant acceptance.
12. **A11Y & MOBILE:** touch size, contrast regardless of theme, semantic labels, keyboard, focus, screen reader order, responsiveness at 360px.
13. **REGRESSION:** do not break MARIZ HQ Neon auth, HQ platform Billplz subscription, Stripe regression, unrelated POS/Event/Arcade routes and deployed holding pages.

## Test cases specific to current prototype (bugs not to inherit)
- Current /demo.html, /connect.html, /domain.html are identical emergency-recovery source; production should show distinct screens by meaningful routes.
- Browser-only orders and anonymous email identity are security-demo only; do not reuse for live sales.
- Current production lacks /api/lalamove-quote and /api/providers; historical source does not establish live endpoints.
- Historically Vercel built READY yet HTML 404 due to wrong outputDirectory/protection. Automated release must assert HTTP 200 for every declared public route and validate returned HTML/title, not just deployment state.

## Evidence pack required before approval
- Staging deployment URL, commit SHA and branch
- Latest applied Neon migration ID and DB rollback strategy
- Tests with observed pass/fail and exact provider sandbox bill/order IDs with sensitive parts redacted
- Redacted signed callbacks, duplicate replay trials, cross-tenant denial, time and fee calculation, reconciliation report
- Domain verification and SSL evidence
- Load/backup/restore, monitoring alerts, operational training and incident contact
- Rollback deploy identifier and written cutover plan
- Commercial/legal review: Terms, Privacy, DPA, payment/merchant liability, PDPA and consent obligations; publishable business address

## Release decision
NO-GO until all mandatory gates pass and user separately authorizes production. Sandbox-only testing does not authorize real customer payment or courier dispatch. User may approve preview demos independently; never use approval for a demo as payment/dispatch authorization.
