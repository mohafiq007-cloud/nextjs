# Codex execution backlog, ordered for release value

## P0 — Stop before real users (must complete before public merchant onboarding)
**0. Baseline & source validation.** Identify real HQ V2 Neon auth/tenant/secret APIs and present branch/test state. Confirm current Vercel project source/deploy method. Create route/source inventory, no automatic migration or deployment. Record official links and actual provider contracts.
**1. App foundation & tenant boundary.** Convert standalone HTML into a maintainable Commerce application under existing HQ stack; implement server API, tenant identity, role checks, customer auth realm, stored sessions, environment segregation and DB migration review. One tenant cannot access another's catalog drafts, orders, credentials or invoices.
**2. Products/order persistence.** Server-side catalog, variants/options, price snapshots, order amount calculation in sen, opening hours/schedule, delivery and pickup, order transitions, idempotency. No localStorage as payment/order truth. Optional POS inventory adapter behind a capability flag, no requirement to buy MARIZ POS.
**3. Merchant designer and versioned publish.** Six+ independent customer theme tokens, logo/hero/product photos, font/layout/section controls, mobile/desktop, editable catalog, draft review, immutable published snapshot and rollback. Backend design remains MARIZ golden brown. Restore distinct routes overwritten by 404 recovery. Add access control to preview.
**4. Customer portal.** Verified email OTP, magic link or passkey per approved auth design, rate limits and session revocation; guest browsing; customers can see only their merchant's orders, addresses/favourites/history/reorder. Audit customer deletion and retention flow.
**5. Merchant-owned Billplz SANDBOX.** Secure per-tenant connection wizard, vault refs, test bill, real provider hosted checkout URL, X Signature callback, amount/collection/tenant validation, idempotent order credit, refunds/cancel reconciliation and manual terminal verification. MARIZ HQ platform subscription billing separate.
**6. Merchant-owned Lalamove SANDBOX.** Secure connector wizard, real signed quotation for validated coordinates, expiry, actual cost vs customer charge, authorized booking, ambiguity-safe idempotency, tracking, webhooks, error/cancel, wallet checks, provider consent. Confirm partner documentation and exact MY service types.
**7. Security, observability and legal.** Tenant/domain spoofing tests, signatures, CSRF, secrets rotation/redaction, abuse/RBAC; logging/tracing/alerting, consent, Privacy/Terms/DPA and DP-law review before real PII. Backups and deletion/export.
**8. End-to-end release certification.** Known-genuine sandbox payment callbacks and one complete sandbox quote->booking->webhook->reconciliation; full rollback and deployment smoke. Merchant A/B isolation. Sign-off document and explicit production go/no-go.

## P1 — Makes the product commercially usable
**9. Merchant domain setup.** HQ subdomain tenant routing, real domain verification/ACME TLS, DNS guided setup, stale-domain takeover defenses and failure recovery.
**10. Operations.** Business hours, time slots and cutoffs, stock availability, bulk/catering/custom quotation and deposit flow, fulfillment roles, refund/cancel and customer notifications.
**11. Billing economics.** Measure Vercel/Neon/storage, provider charges, image media, authentication sends and support minutes; approve final commercial pricing before changing HQ billing. RM39/RM79 only sample.
**12. UX and accessibility.** Native phone workflow, long menus, low-contrast merchant themes, keyboard, Bahasa Melayu as needed, actual merchant usability tests.
**13. Continuous deployment.** GitHub->staging CI/test, verified Vercel project linkage and explicit prod release/rollback. Do NOT overwrite the known live prototype before approval.

## P2 — Add adapters and cross-product value
**14. EasyParcel.** Determine account auth type (Individual/Marketplace vs newer OAuth Developer Hub), supported MY couriers, real sandbox quotes/labels, consent and fees.
**15. GrabExpress.** Apply for Delivery API partner approval, complete commercial/staging onboarding; keep UI unavailable until approved.
**16. MARIZ Restaurant System/POS adapter.** Optional shared catalog/inventory/order sync, terminal PIN roles, BYOD without coupling all stores to restaurant requirements.
**17. Analytics/CRM.** Merchant cohort analytics and consent-based customer reordering/loyalty, without inappropriate data pooling.

## P3 — Only after evidence of demand
Multi-stop fulfillment optimization, multi-merchant marketplace/discovery, enterprise workflows. No proprietary infrastructure replacement until break-even.

## Vertical slice acceptance for Codex first PR
- Merchant staff log in to HQ-backed tenant; create products and publish version 1 on a verified test hostname.
- Customer of tenant A signs in with a genuine verified test session, buys sample item through Billplz sandbox, signed webhook credits EXACT correct order once.
- Merchant prepares, receives real Lalamove SANDBOX quote for verified coordinates, submits exactly one permitted sandbox booking and sees status.
- All amounts reconcile and domain tenant B/customer B cannot access or alter tenant A data; no production keys used.
- If any gate fails, report NO-GO; don't pretend demo success proves integration.
