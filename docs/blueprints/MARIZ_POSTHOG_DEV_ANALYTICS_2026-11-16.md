# MARIZ PostHog Development Analytics — isolated ticket PH-DEV-001
Date: 2026-11-16
Status: CONFIGURED / INTEGRATION NOT TESTED
Priority: P1 after POS independent public-demo readiness blockers
Source: PostHog EU Cloud project 353687 ("MARIZ Development"); this ticket is an integration plan, not proof of SDK installation.

## Verified PostHog project settings
- Reporting timezone: Asia/Kuala_Lumpur
- IP anonymization: enabled
- Autocapture: disabled
- Session recording: disabled
- Console log capture: disabled
- Performance/network capture: disabled
- Surveys, heatmaps, web-app injection: disabled
- No first ingested event verified; SDK integration and dashboard validation NOT TESTED.

## Goal and scope
Measure synthetic MARIZ POS demo QA flow without collecting personal/customer/payment data, introducing spend, changing production, or claiming a public-demo PASS.
One development-only instrumentation ticket; do not install on production URLs or real-customer sessions.

## Proposed event contract (manual explicit events only)
- pos_demo_session_started {environment:"isolated", test_run_id, viewport_class}
- pos_demo_menu_loaded {environment:"isolated", test_run_id, item_count}
- pos_demo_cart_updated {environment:"isolated", test_run_id, item_count}
- pos_demo_checkout_completed {environment:"isolated", test_run_id, result:"success"|"failure"}
- pos_demo_receipt_verified {environment:"isolated", test_run_id, persisted:boolean}
- pos_demo_error {environment:"isolated", test_run_id, error_code}
No customer identifiers, names, emails, phone numbers, receipts, raw payloads, card/bank/payment references, precise locations, URLs with query strings, or ingredient/tenant secrets. Do not track real transactions.

## Acceptance and stop gates
1. Authenticate exact POS demo source and branch; inspect existing analytics and consent/privacy patterns before code changes.
2. Implement isolated development-only SDK bootstrap using a public project token through secure environment configuration (never commit credentials).
3. Ensure no tracking unless explicit development flag enabled; ensure production default off.
4. Synthetic tests: one session -> menu -> cart -> checkout -> receipt persistence; test failed checkout; verify event names/properties, counts, duplicate suppression and privacy exclusions in PostHog.
5. Capture evidence: commit, local test logs, dashboard/insight references, zero-PII review.
6. If source or browser runtime is unavailable, mark BLOCKED and rotate to another independently executable ticket.
No deployment, public demo exposure, paid features, real customer traffic, or release-gate change without owner approval.

## Progress ledger
- PostHog project privacy-first configuration: PASS (settings API response, 2026-11-16).
- Isolated SDK instrumentation: NOT TESTED.
- Synthetic event ingestion: NOT TESTED.
- Dashboard and event quality: NOT TESTED.
- Production/public demo: NO-GO, unchanged.
