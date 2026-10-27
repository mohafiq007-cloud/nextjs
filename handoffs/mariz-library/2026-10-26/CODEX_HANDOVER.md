# CODEX HANDOVER — MARIZ LIBRARY PRIVACY / READER RELEASE
Date: 27 October 2026
Status: **implementation handover prepared, NOT launched**

## Current verified facts
- Public site: https://library.marizhq.com/ . Vercel team `team_OWYRItdiQZGNLoNx8rB4I72V`, project `prj_7JRTQG5n7urenajGai6HhHD1TeSx` (historic project name `mariz-hq-v2-preview`). Last verified live deployment `dpl_YtJDjssFcn8Vm2YP3ez7jFZYsATj`; preserve it as rollback baseline. Confirm alias again before touching production.
- Deployed project is a **direct Vercel source upload**, not a checkout of GitHub `main`. Production source includes `src/app/library/privacy/page.tsx`, `src/app/library/reader/`, `src/lib/mariz/library-*`, `src/public/catalogue.html`; Vercel project root setting used in deploy requests is `src`. Do not deploy repo main as the Library by accident.
- Neon project `small-cell-04853885`, database `marizhq_v2`, production branch `br-bold-unit-aothxcnn`; staging `br-jolly-frost-aoz9yzhn`. Six Library tables and eight related functions were migrated to main and verified. Production had zero Library reader profiles and zero beta editions immediately after migration. Never copy staging reader accounts, Commerce, or WhatsApp structures by a full branch promotion.
- Reader staging signup, verification, password reset reported successful by owner. Production deployment is still catalogue-only, registration disabled. Production Library-specific variables `MARIZ_LIBRARY_READER_ENABLED`, `MARIZ_LIBRARY_READER_SIGNUP_ENABLED`, `MARIZ_LIBRARY_ACCOUNT_ENABLED` present and set false. Production `NEON_AUTH_BASE_URL` and `MARIZ_EMAIL_VERIFICATION_ENFORCED=true` were added on 27 October; verify their values/targets **without printing secrets**. `NEON_AUTH_COOKIE_SECRET` was not confirmed present on production and must be created securely in Vercel, never committed or pasted into chat.
- Neon production authentication trusted origin includes `https://library.marizhq.com`. Data API variable exists on production. Validate production data API branch identity in private secure inspection.
- Existing privacy page source is marked review draft with retention/address/incident contact pending, so not approved for signup.
- There are **zero beta editions** and no secure manuscript-serving UI. Do not promise public beta books are readable.
- In this isolated branch, `handoffs/mariz-library/2026-10-26/privacy-page.tsx` is the replacement bilingual policy candidate; `DATA_PROTECTION_OPERATIONS.md` provides operating procedures and release checklist. These are **not yet integrated into the direct Vercel source**. Evaluate legal content, correct any unsupported claims, then integrate in `src/app/library/privacy/page.tsx`.

## Execution sequence — do not return to endless planning
1. Reconstruct a dedicated Library working tree FROM THE VERIFIED DEPLOYED VERCEL SOURCE FILES, including the catalogue and exact Next.js dependencies. Avoid an accidental replacement by unrelated repo `main`. Compare deployed source hashes and record source provenance.
2. Integrate the bilingual notice, with final factual operator review of correspondence route, service vendors, cookie/session categories, cross-border safeguards, real retention/deletion handling and JPDP rights. Use actual provider policies and existing MHQ facts. Validate Bahasa Melayu and English content. **No invented DPO, address, or retention interval.**
3. Implement privacy-request workflow for access, correction, deletion and withdrawal, plus restricted audit register, SLA tracking and backup deletion caveats. Ensure any third-party marketing and beta interest are independently optional; signup may require an affirmative acknowledgment of notice presentation rather than an invented blanket consent.
4. Configure production `NEON_AUTH_COOKIE_SECRET` as a securely generated value >=32 characters; verify `NEON_AUTH_BASE_URL`, `NEON_DATA_API_URL` and verified-email requirement. Keep all public reader flags OFF until acceptance. Never print credential values or copy staging cookie secret.
5. Build and deploy preview from actual Library source, test policy page and controlled auth paths, negative access tests, and data-isolation checks. Confirm email verification, sign-in, password reset, sign-out, account page, bookshelf and settings, and abuse protections.
6. Promote a **production-built** release only after reviewed privacy notice, data-handling process and runtime tests pass. Flip registration flags in a rollback-ready manner. Verify with a controlled new production account; verify site, aliases, CSP, catalogue and incident contact. Noindex/indexing remains a separate decision.
7. Private beta books are **a separate later gate**: verify owner approval, rights, edition hash, private assets, no IQF-unapproved inclusion, authenticated signed reading endpoint with revocation, progress, review moderation, 10-reader cap, no raw public files, and 11th-reader denial. Zero editions today; DO NOT auto-enable private manuscripts.
8. Write release evidence: deployed commit/artifact ID, deployment URL, flags, schema checks, browser screenshots (redacted), tests, privacy version effective date, rollback, and unresolved issues. Do not falsely mark live without evidence.

## Blockers requiring user-only input
- Confirm who monitors `mariz.headquarters@gmail.com` and handles privacy requests; confirm a usable non-residential business correspondence arrangement. Do not substitute any home address.
- Operator must approve an **actual enforceable** data retention/deletion process and vendor-transfer facts, and complete any necessary lawyer/JPDP review.
- Private beta: owner must identify and approve specific edition/manuscript and content rights. No source edition approved yet.
- Production Vercel secrets must be generated/configured securely; do not seek secrets through chat.

## Deployment guardrails
- User prefers Cloudflare/Wrangler rather than GitHub as deploy transport, but CURRENT MARIZ Library backend is an existing Vercel site. Avoid replatforming DNS or changing `marizhq.com` apex. GitHub branch here is a handover artifact, not proof of deployment.
- Preserve current catalogue: seven titles, walnut/cream/gold identity; do not open non-Library MARIZ HQ, payments or POS modules.
- Stop on any failure that risks user data. Always state precisely what is live vs staged.

## Direct links
- Public: https://library.marizhq.com/
- Current reader preview: https://mariz-hq-v2-preview-19cbi2hrg-mohafiq007-1535s-projects.vercel.app/library/reader
- Privacy component candidate: `handoffs/mariz-library/2026-10-26/privacy-page.tsx`
- Operations checklist: `handoffs/mariz-library/2026-10-26/DATA_PROTECTION_OPERATIONS.md`
