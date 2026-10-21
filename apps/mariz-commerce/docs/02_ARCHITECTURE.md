# Architecture and journeys

## Product boundaries
MARIZ HQ is the identity, tenancy, permission, audit, tenant integration credential registry, shared billing and API policy gateway. MARIZ Business contains Commerce; MARIZ Restaurant/Café System (underlying POS engine) is an optional adapter, not a required UI. Commerce includes merchant console, merchant website designer and customer website + customer accounts. Delivery adapters include Lalamove first, manual rider fallback, then EasyParcel, GrabExpress only after partnership approval.

## Logical components
1. HQ tenancy / IAM: staff memberships/roles, tenant policies, audit, billing, connector registry, encrypted secrets and feature flags.
2. Commerce merchant admin: onboarding, business details, products, categories, pricing, variants, opening hours, order queue, fulfilment, refund authority, draft/publish website, custom domain.
3. Customer website runtime: hostname -> VERIFIED tenant mapping; published theme + catalog only; responsive browse, account, cart, checkout, order history, reorders. Guest browsing is fine; customer profiles/orders require verified session or a strictly limited guest-order token.
4. Customer auth: merchant-scoped customers, verified email/OTP or passkey, consent/privacy preferences, revocation/sessions and access protections.
5. Order service: server-priced item snapshots, tax policy, real fulfilment slots, order state machine, idempotency tokens, inventory reservation if integrated.
6. Payments: provider-agnostic contract; first Billplz per-merchant sandbox. Merchant receives gross sales directly. Reconcile customer payments and refunds using signed server callbacks.
7. Delivery service: quote/service availability, expiry, customer fee policy, merchant wallet/provider cost, booking exactly once on authorized transition, lifecycle webhooks and retries.
8. Domain + publishing: preview data isolated from published version, domain verification records from host provider, HTTPS and domain/tenant mapping and rollback.
9. Observability: event/outbox/audit metrics, callback DLQ, trace IDs and redacted logs.

## Merchant workflow
Create tenant/store -> configure catalog -> connect merchant-owned payment sandbox -> connect merchant-owned courier sandbox -> customize website -> save draft -> preview on phone/desktop -> request domain ownership -> verify DNS & HTTPS -> test one full sandbox order -> approve publish -> monitor orders and reconcile fees.

## Customer workflow
Open merchant domain -> browse published catalog -> sign in or browse anonymously -> cart -> choose fulfilment + time and validated location -> server creates order draft with product-price snapshot -> verified delivery quote if needed -> merchant-authorized payment bill redirect -> signed callback confirms correct bill/tenant/amount -> order enters paid/confirmed queue -> merchant prepares -> book courier once with fresh quote and authorized payment -> track via provider event -> complete -> refund/cancel handling -> customer receipt and history. Never book delivery merely because browser redirects back.

## State machines (illustrative)
- Order: DRAFT -> AWAITING_PAYMENT -> PAID -> ACCEPTED -> PREPARING -> READY -> DISPATCH_REQUESTED -> OUT_FOR_DELIVERY -> COMPLETED. Cancellation/refund states must be explicit and validated. Pickup branches READY -> COLLECTED -> COMPLETED.
- Payment: CREATED -> PENDING -> PAID or FAILED/EXPIRED; PAID -> REFUND_PENDING -> REFUNDED/PARTIAL_REFUND. Persist raw provider event hash and processedAt, never downgrade a confirmed payment based solely on late messages.
- Delivery: NOT_REQUIRED or NOT_QUOTED -> QUOTED -> BOOKING_REQUESTED -> BOOKED -> DRIVER_ASSIGNED -> PICKED_UP -> DELIVERED, with UNAVAILABLE / CANCELLED / FAILED branches and fallback.
- Publication: DRAFT -> REVIEWED -> PUBLISHED; stored immutable published_version and rollback pointer. Published storefront reads only published snapshot, never unapproved draft.

## Security
All API requests derive tenant scope from authenticated session + verified hostname mapping; never trust client-supplied tenant IDs. Use object-level authorization for all admin/customer/order routes. Quote, payment, booking and domain mutations are POST behind role checks + CSRF defenses. No merchant secrets in browser. Support abuse/rate controls and WAF. Do not let one merchant domain host another merchant's orders or auth tokens.

## Cost model
Keep one Neon PostgreSQL with tenant isolation and minimal Vercel resources; no own cloud until break-even. Offload heavy images to managed object storage after cost review. Measure per-store order volume, API calls, provider fees, auth sends, bandwidth, transaction fees, support and net ARPU before prices are approved.
