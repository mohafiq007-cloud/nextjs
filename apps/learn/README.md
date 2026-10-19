# MARIZ Learn V0.2 — isolated Cloudflare-native foundation

**Goal:** learn.marizhq.com — Learn · Play · Work ecosystem, Learn vertical.

## Current deliverable
- Standalone Cloudflare Worker + static mobile-first learning preview (does not affect HQ/POS/Arcade).
- Nine public, curated Observation, Finance and Design reasoning scenarios with non-graded reflection.
- Fail-closed learner API scaffold; NO false sign-in, no public payments, no mocked persistent user account.
- Two review-first database migrations in marizhq_v2 / separate mariz_learn schema, audited entitlement boundary.
- All course library access must be covered by one membership; proposed RM10/month. No one-time purchases.

## Why membership is not live
HQ Neon Auth exists but public verified signup and the deployed app integration remain disabled/unverified. Billplz is a separate project and no webhook is trusted yet. Do not open learner signups, persist learner answers, expose paid lessons, or accept money until the acceptance gates below are complete.

## Development
From apps/learn run npm install, then npm run check, then npm run dev.
Cloudflare deployment: wrangler deploy from apps/learn, after review. Link custom domain learn.marizhq.com only after staging tests and access controls. Never reuse/overwrite HQ Pages project configuration.

## Production secrets and switches
- LEARN_API_ENABLED=false by default. Enable only after authenticated Neon Data API migrations, login verification and cross-user tests.
- NEON_DATA_API_URL: https URL for Neon JWT-verified PostgREST endpoint; Worker secret/config, not a browser value.
- No database owner passwords in the Worker; use verified JWT forwarding only.
- Data API must expose mariz_learn after permission audit, not broadly grant tables.
- BILLPLZ webhook secrets to be integrated later in a separate secure server route. NEVER set member=true from client input or success redirect.
- All real progress writes must use auth.user_id() from verified JWT context in SQL, not an ID supplied by frontend.
- Do not cache private /api responses; member activity is private and no public rankings.

## Release acceptance
1. Valid, email-verified MARIZ HQ session shared with Learn under correct verified origin. Logout and session expiry work. No cross-domain credential leakage.
2. A learner sees only their own progress; negative tests for users A and B, unsigned, expired and unverified sessions.
3. Paid entitlement is checked server-side and RPC-enforced; free preview remains open. No untrusted Billplz callback activation.
4. Billplz sandbox verification, duplicate-safe order/webhook handling, renewals, expired membership, refunds and cancellation tested.
5. Mobile browser tests, accessibility, CSP, rate limit abuse protection, audit logging, data retention and deletion tested.
6. Cloudflare worker deployed to staging; verified custom domain, HTTPS and smoke tests. No production claim before tests.

## Principles
Do not grade learners, publish report cards, punish slow progress, impose streaks or compare users. Feedback must point out inaccurate reasoning without judging the person. Curriculum authors control source explanations; optional AI only provides controlled coaching against those explanations.
