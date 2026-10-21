# Current state and source inventory — audited 21 October 2026

## Infrastructure
- Vercel project: mariz-commerce (ID prj_I5sgGu0PodspAqCVxatEd0qqJjAA)
- Public domain: https://mariz-commerce.vercel.app/
- Output directory: public (framework null).
- Public production, Vercel SSO on preview deployments only.
- Deployed snapshot: dpl_Dm7CuFpVHPQd2TH9aYrrEMKzsa44 (READY). Public URLs were independently fetched and confirmed reachable, but the complex UI flows were **not** automatically end-to-end tested; TinyFish interactive wallet was insufficient.
- Vercel has been deployed via direct file uploads. There is no confirmed GitHub -> Vercel automatic build pipeline.

## Accurate features (prototype only)
- Merchant terminal root: menu, cart, test checkout, simulated Billplz, simulated Lalamove, simplified payment and delivery connector toggles, domain + proposed pricing screen, sample order queue.
- Website designer /preview.html: merchant branding, six colour tokens, presets, headline, font, layout, logo/photo upload (browser-local), product editing/order and live embedded storefront preview.
- Customer storefront /store.html and /customer.html: follows merchant draft in the same browser; shopping, favorites, demo "login" by arbitrary email, customer profile, saved address, simulated delivery quote, mock Billplz payment, local order history/reorder/status.
- Initial richer /reference/original/full-order-demo.html: multi-step product/address/date/time/quote/payment/merchant handling flows. Prior /reference/original/onboarding-wizard.html: explicit guided Billplz and Lalamove walkthrough. These are not what current /demo.html and /connect.html serve.
- Original Lalamove quote server code exists only in reference/legacy-api; CURRENT deployment has no server API files.
- Current demo sharing uses localStorage, specifically a merchant board key and a customer identity key. This is unsafe for production and does not sync devices.
- Customer same-email demo "login" is trivially impersonable. No real OAuth, OTP, password, email verification or server sessions.
- Payment values (FPX and callbacks), courier prices, tracking and courier account linking are simulations.
- Domain "reservation" is a label; no domain ownership verification, DNS, TLS, tenant routing, or deployment is activated.
- "Copy preview link" can use browser draft, not a shared published hosted tenant storefront.
- Visual design for merchant dashboard remains MARIZ golden brown; customer storefront style editable independently.
- Existing prices RM39 / RM79 monthly are illustrative and unapproved.

## Verified gaps / defects
P0: No actual multi-tenant auth or persistent order database. No protected merchant staff/cashier roles. No tenant-scoped source of truth.
P0: No real merchant Billplz API checkout or signed webhook processing in this Commerce project. No real customer payments.
P0: No real courier quote / booking / status webhook currently deployed. No actual merchant Lalamove account verification.
P0: Public customer demo references browser localStorage for its merchant order board; only same-origin/same-browser data moves.
P0: No functioning domain provisioning or publish/rollback.
P1: Old /demo.html, /connect.html, /domain.html are byte-identical to /index.html after 404 recovery. Restore distinct routes in the production architecture using reference source.
P1: Prototype static routes served after correcting Vercel outputDirectory. Preserve this as deployment test.
P1: No CI, browser flow E2E, provider sandbox, load test, production monitoring, incident procedure or official acceptance.
P2: Integrations with GrabExpress and EasyParcel not implemented.

## Relationship to MARIZ HQ V2
HQ V2 repo: mohafiq007-cloud/nextjs; Neon project MARIZ HQ V2 Isolated / database marizhq_v2; baseline branch mariz-hq-v2-foundation. Commerce handover branch is isolated. Reuse HQ identity/tenant/authorization/audit/secrets/API policies. Billplz HQ sandbox configuration is for MARIZ platform billing and MUST NOT be assumed to be a merchant's sales account. Do not merge or deploy existing HQ work without a separately authorized release.

## No-go statement
Prototype can be shown to internal reviewers using only fictional input; real customers, real customer data, actual Billplz charges and provider dispatches remain strictly NO-GO.
