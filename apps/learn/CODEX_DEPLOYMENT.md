# Codex deployment handoff — MARIZ Learn V0.1

Repo: mohafiq007-cloud/nextjs
Branch: mariz-learn-foundation
App directory: apps/learn
Target: separate Cloudflare Worker at learn.marizhq.com (DO NOT overwrite MARIZ HQ, MARIZ POS, or Arcade).

## Action sequence
1. Review repository changes, validate dependencies, run tests and Wrangler dry-run.
2. Verify / improve Worker asset routing, mobile UI and deploy preview Worker to staging; provide live preview URL and evidence.
3. Verify Neon HQ Auth settings and assess real token format, JWT expiry, email verification and origin security. Do NOT manufacture an insecure login.
4. Apply reviewed mariz_learn migration to a Neon preview branch; test authenticated Data API RPCs and row isolation for 2 real test identities. Expose mariz_learn only with tightly scoped RPC grants. Do not enable database changes on production until verified.
5. Integrate MARIZ HQ sign-in / profile / progress using server-verifiable identities. Keep fallback fail-closed.
6. Stage and test learn.marizhq.com DNS/route using Cloudflare, preserving all existing zone records and active deployments.
7. Billplz held: user is configuring Billplz separately. Prepare provider-neutral membership entitlement interface, but DO NOT activate charging or paid access until sandbox evidence and user authorization.
8. Publish QA report with deployment IDs, branch SHA, tests and outstanding blockers. Do not claim production success on a staging-only build.

## Product rules
One subscription = entire standard library. No individual course sales. Single user login and private saved progress. No report-card scores, low-score dashboards, comparisons, shame loops, or mandatory streaks. Observation lesson uses hypotheses vs observed facts and follow-up evidence; finance and design teach WHY, not rote facts.

## Release state
SAFE PREVIEW ONLY; production learner auth/payments NO-GO until verified. This handoff is not a claim of Codex execution or Cloudflare deployment.
