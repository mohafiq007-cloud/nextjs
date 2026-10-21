# MARIZ Commerce — Codex Handover (2026-10-21)

**Status: source inventory and implementation plan, NOT a production release.** This folder is an isolated, source-preserving handover in the existing MARIZ HQ V2 GitHub repository. The existing live Vercel project is still deployed directly from uploaded files and is NOT connected to this branch.

## Read first
1. [AGENTS.md](AGENTS.md) — Codex constraints and exact first execution sequence
2. [docs/01_CURRENT_STATE.md](docs/01_CURRENT_STATE.md) — verified URLs, deployment provenance, route duplications, known defects
3. [docs/02_ARCHITECTURE.md](docs/02_ARCHITECTURE.md) — single source of truth and system boundaries
4. [docs/03_INTEGRATIONS.md](docs/03_INTEGRATIONS.md) — Billplz, Lalamove, later EasyParcel/GrabExpress, webhooks and payment ownership
5. [docs/04_SCHEMA_PROPOSAL.sql](docs/04_SCHEMA_PROPOSAL.sql) — **review-only** Neon data model; not an applied migration
6. [docs/05_IMPLEMENTATION_BACKLOG.md](docs/05_IMPLEMENTATION_BACKLOG.md) — P0-to-P3 execution priorities
7. [docs/06_ACCEPTANCE_AND_RELEASE.md](docs/06_ACCEPTANCE_AND_RELEASE.md) — go/no-go acceptance, security, regression and rollback
8. [docs/07_DOMAINS_AND_PRICING.md](docs/07_DOMAINS_AND_PRICING.md) — storefront domains and unapproved sample SaaS pricing
9. [docs/08_EXTERNAL_LINKS.md](docs/08_EXTERNAL_LINKS.md) — actual public links, provider references and integration readiness
10. [docs/09_WHATSAPP_BUSINESS_CONNECTOR.md](docs/09_WHATSAPP_BUSINESS_CONNECTOR.md) — merchant-owned WhatsApp Business self-service onboarding, chat-link fallback and Meta approval gates
11. [prototype/README.md](prototype/README.md) — file provenance and how to inspect
12. [.env.example](.env.example) — names only, no real secrets

## Live project
- Vercel project: mariz-commerce / prj_I5sgGu0PodspAqCVxatEd0qqJjAA
- Production domain: https://mariz-commerce.vercel.app/
- Last source-audited production deployment: dpl_Dm7CuFpVHPQd2TH9aYrrEMKzsa44
- Project outputDirectory: public; framework: null; production public, previews protected
- Static source is in prototype/public (exact copies of deployed source).
- Vercel source uploads are canonical for the currently published prototype; GitHub is a new **handover snapshot** only.
- **Do not connect this branch to Vercel or replace production automatically.**

## Quick local inspection
From this directory, serve prototype/public using a simple static server (for example Python's http.server) and inspect index.html, preview.html, store.html, customer.html. These are HTML/JS browser prototypes, not a Next.js production application. The richer, earlier builds are saved in reference/original and must not be substituted silently into production.

## Product positioning
MARIZ Commerce is the online ordering and delivery layer under MARIZ Business. It is a merchant-first storefront, not a GrabFood marketplace and not merely a POS. POS integration is optional and hardware-agnostic. Merchants can use their own website/domain, brand colours/fonts/layout, product catalogue and payment/delivery accounts.

## Nonnegotiable business ownership
- Customer pays merchant directly through the merchant's payment provider, never pooled in MARIZ by default.
- Merchant's own Lalamove account/wallet pays courier. Record customer delivery charge and actual provider cost separately.
- MARIZ platform subscription is a separate HQ Billplz/billing relationship from merchant sales.
- Merchant's customer website is fully brandable. MARIZ management/backend stays in MARIZ gold and brown.
- Neon PostgreSQL / HQ identity, tenancy, policy, audit, connector registry; no new Supabase dependency.
- Billplz SANDBOX first and no unapproved live charging; GrabExpress approval is separate.
- All prototype order/payment/credential data are mock/local-only. Do not claim live functionality.

**Acceptance bar:** end-to-end sandbox merchant A order + signed Billplz callback + verified order + Lalamove quote/book/track + reconciled separate ledgers, tenant B isolation, domain verified, rollback demonstrated, all without real customer funds.
