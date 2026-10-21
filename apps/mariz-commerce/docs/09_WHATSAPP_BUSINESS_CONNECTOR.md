# MARIZ Commerce — customer-owned WhatsApp Business connection
**Status: implementation contract / review only, 21 October 2026. No Meta connection or messaging is live.**

## Product intent
A merchant connects their own WhatsApp Business identity from **MARIZ Business → Store → Integrations → WhatsApp**. Keep WhatsApp as an HQ-managed, tenant-scoped connector that other MARIZ products may reuse. MARIZ owns the software connection; the merchant keeps control of their business identity, number, consent and Meta account. Do not require them to paste access tokens, App Secrets or webhook keys.

The customer-facing message is **Connect WhatsApp Business**, not "Configure Cloud API".

## Offer two separate experiences
1. **Chat link (available without Meta API approval):** Merchant enters/validates their own international-format WhatsApp number and optional pre-filled welcome message. MARIZ generates an approved wa.me click-to-chat link for the storefront. This enables human chat in WhatsApp only; NO synchronized inbox, auto-replies, confirmed orders or delivery notifications. Explicitly label it "Chat link only".
2. **Connect account (Meta Embedded Signup):** Start the current supported Meta Embedded Signup flow (evaluate v4) inside the authenticated tenant portal; business admin signs in with Meta, chooses an account and number, grants access, verifies the number or scans the WhatsApp Business app coexistence QR when eligible, and confirms MARIZ access. MARIZ exchanges the short-lived authorization code server-side, checks business and phone assets, subscribes webhooks and sends a controlled test. No production sends until the connection is verified.

For merchants already operating in the WhatsApp Business phone app, display "Keep using the app, when eligible" and route to Meta's coexistence option. **Never guarantee coexistence**: availability and feature behavior depend on account, number, location, and current Meta rules. Explain when Meta requires an alternate onboarding or migration and obtain explicit approval before any disruption.

## Merchant-facing flow (mobile-first)
- Settings → Integrations → WhatsApp → [Connect WhatsApp Business].
- Choose: **Connect existing WhatsApp Business app**, **Connect a new/Cloud API number**, or **Only add a chat button**.
- Meta sign-in/consent takes place in Meta-owned UI, not a MARIZ password form. On completion show merchant identity and selected phone masked, Meta onboarding status and a clear way to retry.
- Confirm business-wide use and choose notifications: order received, confirmed, ready for pickup, out for delivery and delivered. All **OFF until connection and tests pass**; require an opted-in recipient and a supported messaging method/template.
- Run a genuine test message to an expressly opted-in test number; show accepted/sent/delivered status separately. Passing registration alone does NOT mean messaging is operational.
- Show connection health, last verified timestamp, messaging permissions, usage/fee link, reconnect and disconnect; prevent unapproved staff from changing these settings.

Example status: NOT_CONNECTED → META_AUTH_PENDING → PHONE_PENDING → VERIFYING → CONNECTED; exceptional: REAUTH_REQUIRED / DEGRADED / FAILED / DISCONNECTED. Expose exact actionable cause rather than a generic green tick.

## Meta technical track
- Register and configure a **MARIZ-owned Meta developer app**, Facebook Login for Business/Embedded Signup configuration, approved public domain + HTTPS and callback/webhook settings. Confirm currently available embedded-signup version/configuration and account model before coding. Meta announced v4 unified onboarding in June 2026, and account evolution from a single WABA to WAAC (phone assets) and PMA (messaging/templates/billing) — implement versioned identifiers rather than assuming one legacy ID everywhere.
- Complete required Meta App Review / Advanced Access and business eligibility, including business_management / whatsapp_business_management and relevant messaging permissions as applicable. Development/test access is not customer onboarding permission.
- Use Meta's supported browser SDK/configuration to launch signup with anti-CSRF state linked to authenticated merchant/session. Capture temporary code from Meta, not a merchant-supplied API key. Exchange **on the server only** with app credentials, store long-lived token via HQ-managed encrypted tenant credential reference, verify ownership/authorization, acquire phone/account identifiers and subscribe to webhook updates.
- Respect the current registration or coexistence path and deadlines; never silently register/migrate a merchant's existing number.
- Verify Meta webhook challenge and X-Hub-Signature-256 against raw request bytes; map incoming account/phone to exactly one authorized tenant, deduplicate event IDs, reject incorrect signatures, preserve trace IDs and do not log message contents/tokens unnecessarily.
- Send using WhatsApp Cloud API (or current approved partner route). Respect customer-service windows, template approval and messaging categories; never send unsolicited promotions. Message charging and account billing must be transparent, directly attributable to the merchant and subject to current Meta pricing.
- Rate limit onboarding and test sends; handle revoked permission, changed phone number, degraded delivery, Meta errors and disconnect by disabling outbound automation without altering existing Commerce order truth.

## HQ connector architecture
Extend the HQ Connector Registry, not a separate credentials table managed by browser pages:
- provider: meta_whatsapp; tenant_id, store_id (optional linkage), environment, integration_version, scopes, credential_ref, current_status, last_verified_at, last_error_code, operator_id, timestamps.
- Account mapping: Meta business/portfolio ID, legacy WABA ID if returned, WhatsApp account ID / messaging account ID if supported, phone number ID, masked E.164 phone, display name, coexistence mode, messaging capabilities. Model accounts separately so one tenant may have multiple numbers and phone assets may be shared where Meta permits; never use phone number alone as a tenant key.
- Consent ledger: recipient identifier, purpose, channel, opt-in provenance/time, revocation and policy version. Tenant-specific recipients and suppression apply.
- Notification rules, approved template mappings, immutable outbound attempt/event IDs, status transitions, delivery errors, unit fee currency/cost and audit record. Attach an idempotency key to order events.
- Use reliable Commerce order outbox → notification worker. **Never let a failed WhatsApp send mark an order paid, dispatched or completed**. Payments and Lalamove remain independent sources.
- HQ RBAC: only owner/admin with connector-management permission can connect, reconnect or disconnect; operations staff may view limited health/status.

## Proposed API contracts (NOT DEPLOYED)
- GET /api/commerce/integrations/whatsapp — current connector mode, masked number, status and capabilities.
- POST /api/commerce/integrations/whatsapp/signup/start — authenticated owner/admin; session/CSRF bound signup configuration and nonce; never return app secret.
- POST /api/commerce/integrations/whatsapp/signup/complete — consume short-lived Meta auth code on server; validate tenant/nonce; verify IDs and store encrypted token reference; idempotent.
- POST /api/commerce/integrations/whatsapp/test — rate-limited send to opted-in test number; returns queued/failed and provider message ID, never a false delivered status.
- POST /api/commerce/integrations/whatsapp/disconnect — revoke/disable where supported, cancel jobs, audit; make reconnection explicit.
- GET/POST /api/webhooks/meta-whatsapp — verification and authenticated signed event ingestion, server-side only.

In addition, the separate **chat-link-only** path can use merchant-owned public phone settings with no Cloud API credentials; validation must reject non-phone URLs, query injection and cross-tenant edits.

## Financial and compliance gates
- Messaging fees are separate from MARIZ subscription fees, merchant sales via Billplz and Lalamove wallet expenses. Merchant should own Meta billing where the chosen approved onboarding model supports it. If MARIZ would share a Meta credit line or be invoiced as a provider, require a separate commercial/risk decision **before activation**.
- Show billing model and current pricing link in onboarding. Do not promise "unlimited free messages"; categorization/rates and free windows can change.
- Ensure explicit recipient opt-in for business-initiated messaging, required templates/allowed service windows, privacy notices, retention, deletion, access/audit and Malaysian PDPA review. Never mine merchant conversations for cross-tenant marketing.

## Release criteria (NO-GO until passed)
1. Genuine Meta-approved app/configuration (not fake Facebook login) and permitted merchant onboarding path.
2. Merchant A signs in, connects their own Meta business/number and receives a provider-confirmed test message with webhook confirmation.
3. Merchant B cannot read/reuse tenant A's identifiers, tokens, contacts or test-send endpoint. An unauthorized staff member cannot modify the connector.
4. Webhook HMAC validation, duplicate and out-of-order delivery, expired auth code, revoked token, reauth/retry, coexistence eligibility failure and disconnect tests pass.
5. With consent and a valid template/window, one sandbox/test order emits at most one approved notification; failed sends never change payment/delivery state.
6. Separate usage/fees are visible without collecting merchant Meta charges into MARIZ unless explicitly approved.
7. Legal/Meta approval, rollback/disable switch, monitoring and opt-in test evidence recorded. Only then discuss production enablement.

## Execution gates and immediate next action
1. Implement **chat-link mode** in merchant settings (no Meta permissions; transparent limited capability).
2. Obtain MARIZ Meta app ID + Embedded Signup configuration ID, app review/Advanced Access status, webhook configuration, approved domains and approved billing model **from Meta dashboard**. Store app secret only in secure server environment/vault.
3. Implement Meta signup + backend token exchange + HQ tenancy mapping against existing Neon/HQ auth. Feature flag disabled until validated.
4. Add outbox-driven order/delivery notifications and template approval flow; staged real-user pilot then release signoff.

References: https://www.postman.com/meta/whatsapp-business-platform/documentation/du6gzjv/embedded-signup ; https://developers.meta.com/resources/videos/unified-onboarding-whatsapp/ ; https://developers.meta.com/resources/videos/whatsapp-account-model-evolution/ .
