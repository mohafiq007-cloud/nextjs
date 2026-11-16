# MARIZ Toolkits — Recipe Costing Engine / Homepage Roadmap
Date: 2026-11-13
Status: APPROVED PRODUCT DIRECTION; DEVELOPMENT NOT YET VERIFIED; DEPLOYMENT NO-GO
Source: Owner decisions, 13 November 2026. This document is a planning baseline, not proof of implementation.

## Locked product and UX decisions
- MARIZ Toolkits are hosted applications inside the MARIZ platform, not downloadable Excel or spreadsheet templates.
- First toolkit only: Recipe Costing Engine. Invoice Generator, Expense Tracker, Vehicle Control Centre and other toolkits remain parked.
- Subscription gives continuing access to create/edit ingredients, add recipes, calculate automatically and persist business data. Expiry must not silently delete data; entitlement and retention policy require tests and approval.
- Shared ingredient price updates recalculate current recipe costs; historical cost snapshots remain immutable. Support unit conversions, pack size, yield/servings, recipe components, wastage where explicitly modeled, selling price, cost percentage and gross margin; do not mislabel ingredient-only margin as net profit.
- MARIZ homepage stays V5.7 approved “Hello there.” artwork, monogram, red HQ seal, palette and motion. Homepage has exactly THREE navigation cards: Business Solutions, Toolkits, Custom Solutions. All product details appear after entry, not in homepage promo sections. Arcade, Library and Events remain hidden. MARIZ POS stays inside Business Solutions, Recipe Costing inside Toolkits. Do not invent pricing or claim toolkit availability.
- Preserve existing POS public-demo/production NO-GO, CI/spend blocks, auth/payment restrictions and no automatic deployments.

## Competitive and pricing research (hypotheses; verify current vendor evidence)
- Benchmark Malaysian F&B costing: Servora free tier and paid tiers; compare spreadsheets, free calculators and global costing platforms. Price hypothesis RM9–15/month is NOT approved live pricing or verified willingness to pay.
- Explicitly investigate free alternatives, user complaints, cancellations, silent non-adopters, Reddit/community forums, regional/non-English sources where actually accessible, competitor price/feature changes and Malaysian payment/PDPA rules.
- Commercial differentiation hypothesis: faster ingredient entry, transparent units, linked price propagation, accurate portion costing, historical snapshots, mobile-first UX, saved data, low-commitment pricing.
- Do not assert that global engines/platforms were searched if not actually queried; keep source/date/confidence matrix.

## Delivery sequence / acceptance gates
R0 SOURCE CUSTODY: Find canonical V5.7 homepage source and actual application repo/branch, record SHA, compare with HQ V2 preview; preserve original files, backup/diff, no live changes. BLOCKED until verified.
R1 ENGINE: Build deterministic local tests for purchase units/recipe usage, g/kg/ml/l/each, invalid input, zero division, precision/rounding, recipe yields, linked ingredient changes, cost percentage and margin. PASS only with real test evidence.
R2 DATA: Tenant-scoped ingredient, supplier optional, recipe, recipe-line, price-history, cost-snapshot, and entitlement schema. Migrations and rollback tested on synthetic data only. Verify no cross-tenant access.
R3 UX: Mobile-first ingredient > recipe > results flow; unassisted usability, empty/loading/error states, keyboard/accessibility, small-screen checks; no card-gallery clutter.
R4 SUBSCRIPTION: Reuse verified MARIZ identity/tenant/billing infrastructure; verify Billplz suitability without enabling charges. Server-side entitlement, expiration, renewal, read-only/export policy, idempotent webhook handling and payment failure behavior. Never charge real users during tests.
R5 HOMEPAGE: Isolated three-card navigation update against canonical V5.7, without standalone POS/Recipe Costing promotional sections; links lead to category detail views; preserve existing artwork, brand, animation and mobile performance. No premature sales CTA.
R6 READINESS: Local build/tests, security/access review, persistence/reload, migration/rollback, subscription lifecycle simulations, mobile UI regression, documented operating costs and pricing validation. Output deployment-readiness report with PASS/FAIL/UNKNOWN/BLOCKED, evidence, owner decisions and explicit GO/NO-GO. Production deploy requires separate owner approval.

## Nightly autonomous safe work instructions
At 22:00 Asia/Kuala_Lumpur under the existing MARIZ Dual-Gate Watch, include this roadmap as a prioritized independent ticket after P0 security/client operations. Each run should inspect actual current repo/source and latest approved owner decisions, perform one bounded authorized local/non-production implementation and tests when tools permit, record commits/diffs/results, update this roadmap/ledger on an isolated branch only when safe, and conduct the post-session result scan. If blocked, record exact missing prerequisite and continue another independent safe step. Do not claim continuous background work between runs, deployment, completed tests or access not actually achieved. Do not alter Gate A's 09:00 triage scope.

## Return handoff / definition of ready
Provide: source SHA/branch, tested costing engine, schema and migration proof, tenant/entitlement security tests, homepage V5.7 comparison, mobile screenshots/test results, competitor/pricing evidence, deployment cost estimate, open risks, explicit deployment readiness status. A runnable local/staging artifact is desirable, but no live deployment or billing without separate approval.

## Progress log
2026-11-13: Owner approved Recipe Costing as first toolkit, subscription + persistence model, minimal three-card homepage, details behind navigation. Blueprint created. No code/build/security/payment/deployment proof yet. Next: verify canonical V5.7 source and implement isolated deterministic costing engine tests.
