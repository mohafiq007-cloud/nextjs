# Current test scope

This handover contains exact deployed HTML snapshots and documentation. It **does not claim automated E2E coverage**. The project has no validated backend yet. Before production, Codex must install CI, unit, integration, browser and sandbox tests per docs/06_ACCEPTANCE_AND_RELEASE.md.

For a manual static inspection, serve prototype/public over localhost and verify routes, mobile resize, product editing, demo checkout and order-history behavior using only fictional data. Expected result for real payment and courier booking is **disabled/no actual provider call**.

Next test harness: Playwright mobile and desktop smoke; API tests against sandbox with controlled secret store; DB tenancy, callback replay and actual provider trace assertions. Do not use real merchant keys in tests committed to this public repository.
