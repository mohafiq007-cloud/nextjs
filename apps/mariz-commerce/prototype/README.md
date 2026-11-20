# Deployed prototype snapshot

The files in public/ are exact copies of the **latest** Vercel production deployment dpl_Dm7CuFpVHPQd2TH9aYrrEMKzsa44, retrieved via the Vercel deployment file API on 21 October 2026. They are preserved without modifying HTML source. Do not add secrets to this folder.

Production URLs (publicly reachable when audited):
- / -> index.html: emergency recovery merchant demo (browser-only)
- /demo.html -> same source bytes as index.html (not the richer earlier order demo)
- /connect.html -> same source bytes as index.html (not the richer earlier connection wizard)
- /domain.html -> same source bytes as index.html (domain UI section inside index, not a distinct route)
- /preview.html -> merchant website designer with independent editable theme
- /store.html -> customer storefront + sample login/account/orders; identical source to customer.html
- /customer.html -> same bytes as store.html

The API endpoints /api/providers and /api/lalamove-quote were included in **older** deployments but are NOT present in the latest deployed file tree. For archaeological reference only, see reference/legacy-api. Do not expose them as live without server auth, tenant authorization, rate controls and tests.

Original richer prototypes from deployment dpl_tCSgzMWWCrrThf8XRm5gzg1zj4jM:
- reference/original/full-order-demo.html
- reference/original/onboarding-wizard.html
- reference/original/landing.html
- reference/original/README.md

Why this matters: the previous 404 recovery overwrote formerly distinct routes with one simplified HTML. Codex must choose and rebuild the best UX pieces deliberately, with new app architecture, rather than assuming every named URL already has a separate feature.

No production business data is embedded. Current demos use only fictional/synthetic examples. Browser localStorage is not a database.
