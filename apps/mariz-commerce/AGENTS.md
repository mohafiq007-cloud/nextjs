# Instructions for Codex working in apps/mariz-commerce

This is a **source-verified handover**, not authorization to deploy a production commerce platform.

## First action
Read README.md, docs/01_CURRENT_STATE.md, docs/02_ARCHITECTURE.md, docs/03_INTEGRATIONS.md, docs/05_IMPLEMENTATION_BACKLOG.md and docs/06_ACCEPTANCE_AND_RELEASE.md. Inspect the repository's existing MARIZ HQ V2 tenancy/Neon Auth/Billplz code before choosing a new framework or database schema. Do not duplicate HQ identity, billing, secrets or connector registry.

## Work rules
- Work in this isolated branch or a child feature branch. No automatic merge into main, no production deployments or customer charges without explicit approval.
- Keep the user-facing MARIZ Commerce independent of the POS presentation: shared APIs only, BYOD / hardware agnostic.
- Backend UX follows MARIZ golden brown; storefront uses each merchant's saved design tokens and product assets.
- Neon PostgreSQL for production persistence; use HQ organization/tenant identity and permission checks. Do not create Supabase dependencies.
- Customer browsing may be anonymous, but meaningful account / orders must be backed by secure server-side login, not localStorage identity. Scope customers/orders strictly to a merchant.
- Separate HQ platform billing from merchant Billplz checkout and settlement. Use the merchant's own Billplz collection, secret and X Signature credentials in encrypted server-only storage. Never pool merchant sales in MARIZ.
- The merchant pays courier with their own Lalamove wallet/account where supported. No booking without verified readiness, valid quote, explicit authorization and idempotency.
- Treat GrabExpress as approval-dependent, EasyParcel as provider-interface research; do not claim automatic access.
- Never put real credentials, bank information, customer personal data or auth tokens in commits, logs or browser localStorage.
- Provider callbacks are not trusted until their signatures, tenant, order id, amount, currency and replay/idempotency checks pass.
- Treat Vercel production project as independent of GitHub until the link is explicitly verified and approved.
- Do not silently consolidate or discard historical prototype pages. Document what is used.
- Do not introduce new product fees until unit economics are verified and user approves.
- Follow planning -> production -> review -> release: small vertical slices with measured acceptance tests, no endless redesign.

## Priority path
(1) Formalize types/contracts and database tenancy. (2) Server-auth merchant and customer, persist products + orders. (3) Draft/publish storefront + domain verification and rollback. (4) Billplz sandbox connector + callback and reconciliation. (5) Lalamove sandbox quote/book/tracking, explicit merchant wallet. (6) End-to-end tests, audit, go/no-go. Additional couriers and optional POS adapter later.

## Definition of completion
Provide actual branch/PR, commit SHA, exact domains/routes, changed files, tests and real sandbox receipts, regression status, migrations (if approved), rollback target and unresolved blockers. Do not call local demo success a payment or courier integration.
