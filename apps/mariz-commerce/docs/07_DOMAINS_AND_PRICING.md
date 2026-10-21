# Merchant website domain, publishing and SaaS fees

## UX
A merchant can choose a MARIZ-managed store subdomain (e.g. mycafe.shops.marizhq.com; **not yet provisioned**) or connect a domain they own (e.g. orders.mycafe.my). The merchant remains the registrant; do not force transfer of domain ownership. Domain onboarding must never ask for registrar password or raw DNS control credentials.

## Domain handshake
1. Merchant enters hostname. Normalize IDN/punycode, lowercase and enforce uniqueness, no reserved internal hosts. Check ownership / tenant membership.
2. Register domain with current hosting provider under authorized project/tenant mapping; retrieve REAL provider domain verification challenge and required DNS record.
3. Show registrar-neutral copy/paste record; automatic DNS through supported registrar APIs only with consent + least privilege.
4. Poll verify asynchronously with backoff, show pending/verified/error, retrieve certificate provisioning status and force HTTPS before routing traffic.
5. Bind hostname only to verified tenant id and published storefront version, never resolve tenant by untrusted localStorage or arbitrary request property.
6. Preview draft at protected preview URL, including authenticated preview token; published customers see versioned immutable content only.
7. A merchant may disconnect, transfer or leave; handle DNS stale state, prevent tenant takeover, preserve data export and published rollback.

## Branding
Merchant customer site controls palette, logos, fonts, corner radius, section ordering, hero, photos, menu and copy. Management console remains fixed MARIZ gold/brown. Tenant theme tokens are sanitized and stored separate from MARIZ admin tokens. Security-critical payment fields and consent flows retain accessible contrast and focus states regardless of merchant colours.

## Price options shown in prototype (NOT approved)
- RM39 / month Starter: sample storefront, pickup, merchant subdomain and basic order management.
- RM79 / month Commerce: sample custom domain, merchant-owned Billplz, Lalamove connector and order management.
These are **illustrative**, not active bills, sales terms or approved financial model. Validate support, domain SSL/tenant wildcard limits, payment callbacks, hosted image/storage, per-request fees, retries, SMS/email OTP, backup/export and platform margin. Merchants pay provider fees, courier costs and registered domain fees directly unless an explicitly approved contract says otherwise.

## Provider
Official Vercel domain setup: https://vercel.com/docs/domains/set-up-custom-domain
Use provider domain inspect results for exact DNS values; never hardcode or promise that one fixed CNAME will work for all customers.
