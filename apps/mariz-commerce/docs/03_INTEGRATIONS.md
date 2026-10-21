# Provider connector design and payment ownership

## Universal adapter interface
Define GatewayConnector (capabilities, validateCredentials, createCheckout, verifyWebhook, getPayment, refund if available) and DeliveryConnector (capabilities, validateCredentials, quote, getQuote, book, getOrder, cancel, verifyWebhook, reconcile). Each adapter is registry-managed via HQ policies. Connector config: tenant_id, provider, environment, credential_ref, status, last_verified_at, webhook state, capabilities, consented scopes. Credentials never leave server vault or appear in logs.

## Merchant sales: Billplz
- Merchant links THEIR Billplz sandbox first; their API secret, Collection ID and X Signature key are scoped per merchant and environment. Sandbox endpoint and production endpoint are distinct accounts.
- Use authenticated server-side Billplz bill creation, amount in **sen** (integer); collect customer payer details only as necessary. Persist bill ID, collection ID, amount, currency, tenant, order and secure checkout URL.
- Redirect to provider's REAL hosted Billplz URL in integration tests. The browser redirect is not payment proof. Verify signed server callback (X Signature) in constant time with raw expected fields; verify collection, bill, amount, currency, tenant/order, paid flags and event replay. Query Billplz status for disagreement.
- Mark payment PAID exactly once, only after verified event, and reconcile refunds/partial refunds before any dispatch where merchant policy requires.
- Existing MARIZ HQ V2 Billplz sandbox credentials are for MARIZ subscription/platform billing; do NOT reuse them to receive customer purchases unless a separately approved authorized acquiring/split structure is implemented.
- Existing counter terminal, DuitNow QR and cash remain manual reconciliation flows with staff permissions, evidence fields and an UNVERIFIED status; never auto-label them paid.
- No MARIZ collection/pooling/payout-of-client-funds by default. Legal/payment licensing advice required before that alternative.

## Lalamove (first delivery connector)
- Merchant owns delivery Partner Portal account and pays provider wallet/credit. Do not silently charge a MARIZ master wallet.
- Retrieve separate Sandbox vs Production API KEY/SECRET on merchant's Partner Portal; production API credentials require funded Production wallet according to Lalamove docs.
- For each real quotation use provider-specified HMAC-SHA256 signature with timestamp, method, path and exact body; headers Authorization, Market MY and unique Request-ID.
- Geocode and validate pickup + dropoff coordinates. Never derive quote from a manually chosen "near/mid/far" sample rate in production.
- Store quote ID, createdAt, expiresAt, currency, total, cost breakdown, vehicle, pickup/dropoff snapshot, service availability and merchant customer-charge policy separately.
- Quote expires; refresh before actual book, confirm unchanged customer charge or obtain consent for price change. Booking requires accepted order/payment readiness and explicit merchant policy, and a durable idempotency key. After provider booking, persist reference and poll/recover on ambiguous timeouts before any retry.
- Validate webhook authenticity and tenant-to-provider mapping, deduplicate events, reconcile cancellations, provider wallet charges and partial failures.
- Legacy reference API is NOT deployed and has no tenant auth/rate limit; do not expose directly. Compare it with current official provider schema before reuse.
- Real courier booking may be immediately after payment or on merchant READY stage depending on SLA/scheduling; implement merchant policy, not hardcoded magic steps.

## More delivery channels (phased)
- Manual rider: explicit staff assignment + agreed amount, pickup proof, no fabricated tracking or price.
- EasyParcel: product-market / parcel use cases; validate current individual vs marketplace API and newer Developer Hub auth before final adapter implementation. API supports parcel rates, bookings, tracking and webhooks subject to account terms.
- GrabExpress: official API/partnership onboarding and commercial approval; do not build UI pretending customer Grab login provides partner API. No verified merchant credentials yet.

## Example application API contracts (proposed, NOT deployed)
- POST /api/commerce/stores/:storeId/checkout-quote — request product/variant quantities, fulfilment and address; return server-priced quote, expiresAt and provider terms.
- POST /api/commerce/orders — server idempotent create order draft with items snapshot and ownership.
- POST /api/commerce/orders/:id/payments/billplz — authenticated create merchant bill; return safe redirect URL and pending status.
- POST /api/webhooks/billplz/:connectorId — signed Billplz callback; durable event + payment update; not protected by browser session but signature + replay checks mandatory.
- POST /api/commerce/orders/:id/delivery-quote — merchant/customer access as appropriate, real provider quote with expiry.
- POST /api/commerce/orders/:id/dispatch — merchant-authorized and idempotent dispatch with current quote.
- POST /api/webhooks/lalamove/:connectorId — verify provider event and apply state transition.
- GET /api/commerce/customers/me/orders — only authenticated customer in verified tenant, never cross-merchant.
- POST /api/commerce/domains/verify — domain control and DNS/host checks; no implicit activation.

## Required fault and audit handling
Network timeout after provider booking, callback before redirect, duplicate callback, wrong collection, partial amount, stale quote, insufficient courier wallet, order cancelled after courier accepted, failed signed webhook, tenant A signed request referencing tenant B, spoofed DNS/Host, unauthorized staff and retry storms. Preserve provider request IDs and redacted trace IDs.

## Official docs
- https://support.billplz.com/api
- https://support.billplz.com/guide/api-quick-start
- https://developers.lalamove.com/
- https://developers.easyparcel.com/?c=Malaysia
- https://api.easyparcel.com/
- https://help.grab.com/merchant/en-sg/4404599730841
