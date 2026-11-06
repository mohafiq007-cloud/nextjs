# Protected Billplz sandbox callback — exact access checkpoint

7 November 2026, Malaysia time. Implementation is tested but not enabled.

Vercel Authentication remains enabled on `mariz-hq-v2-preview` and its protected staging domain. Billplz cannot complete that interactive login to POST a payment notification.

The prepared change uses Vercel's documented webhook method: a dedicated automation bypass credential is appended server-side only to the sandbox pilot callback URL sent to Billplz Sandbox. Existing Billplz X-signature, amount, collection, company/reference and provider-GET reconciliation checks remain mandatory. The credential is never added to the customer payment URL, CO return URL, HTML, stored payment request or error message.

Security tradeoff: Vercel automation bypass credentials are project-scoped, not path-scoped. Anyone holding this credential can bypass Vercel's outer protection on deployments in this project until it is revoked; application authentication still applies. This is why creating and transmitting it to Billplz Sandbox needs an explicit, informed approval. No production provider key is involved and no protection setting is disabled.

If approved, create a separate temporary token with a sandbox-callback note, do not rotate existing automation tokens or change their default selection, store it only as sensitive `MARIZ_POS_PILOT_CALLBACK_BYPASS` on the `integration/pos-commercial-release` Vercel Preview branch, and revoke it when sandbox acceptance ends. Only the branch-specific provider callback construction reads it. A missing token prevents hosted pilot bill creation before any provider call.

Rollback: keep commercial checkout disabled, revoke this new token only, clear its branch-specific variable, and return the new staging alias to disabled deployment `dpl_FQPVz76LbKypToVs2H8dMhp3Fapn` (source `1658ff98b47f38b8640f8c336774b464cb8c8205`). No financial records are removed.

Tests: 22 sandbox-adapter/signature checks pass, including missing-token refusal before network issuance, provider-only token placement, unchanged legacy callback, and a token-free customer redirect. A real Billplz callback remains untested until the owner supplies sandbox credentials and completes sandbox checkout.

Official reference: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
