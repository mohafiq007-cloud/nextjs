# MARIZ Commerce â€” canonical website

A merchant-first MARIZ Business ordering site with interactive demo storefront, cart, checkout, bulk enquiries, merchant queue and delivery connection centre.

## Deployment
Single Vercel project: mariz-commerce. This website is intentionally an interactive pilot, not production ecommerce. Orders/leads are demo-only and stored in browser localStorage (not a merchant database). No payments, real orders, courier booking or tracking is active. Do not enter real customer information.

## Delivery integrations
- Lalamove v3 API: /api/lalamove-quote prepares server-side authenticated MY quotations, but access is deliberately DISABLED by default. Environment keys LALAMOVE_API_KEY and LALAMOVE_API_SECRET; LALAMOVE_ENV=sandbox or production; MARIZ_ENABLE_LALAMOVE_QUOTES=true only after actual merchant authentication, rate limiting and pickup address verification.
- EasyParcel: integration capability recognized; EASYPARCEL_API_KEY presence check only. Quotation and booking not implemented.
- GrabExpress: requires API partner onboarding/commercial approval; not implemented.
- Manual dispatch: represented as a merchant-confirmed delivery fallback, not a booked rider.

## Production gates
Implement merchant authentication/tenant isolation, persistent order database, proper address geocoding with consent, payments and refund flows (Billplz sandbox first), quote expiry refresh, separate customer charge/provider cost, protected dispatch idempotency, we¶»§q«^