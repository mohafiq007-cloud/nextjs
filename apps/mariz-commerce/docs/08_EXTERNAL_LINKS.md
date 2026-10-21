# Link inventory and external dependencies

## Current public demo routes, independently reachable 21 Oct 2026
- Root setup terminal: https://mariz-commerce.vercel.app/
- Demo alias: https://mariz-commerce.vercel.app/demo.html (currently same file as root)
- Onboarding alias: https://mariz-commerce.vercel.app/connect.html (currently same file as root)
- Domain alias: https://mariz-commerce.vercel.app/domain.html (currently same file as root)
- Merchant website designer: https://mariz-commerce.vercel.app/preview.html
- Customer-facing shop/account: https://mariz-commerce.vercel.app/store.html
- Customer portal alias: https://mariz-commerce.vercel.app/customer.html (currently same file as /store.html)

## Vercel
- Project name: mariz-commerce
- Project ID: prj_I5sgGu0PodspAqCVxatEd0qqJjAA
- Source-audited deploy: dpl_Dm7CuFpVHPQd2TH9aYrrEMKzsa44
- Host domain alias: mariz-commerce.vercel.app
- Build: null framework, outputDirectory=public; production SSO protection disabled; previews protected.
- Previous richer deploy: dpl_tCSgzMWWCrrThf8XRm5gzg1zj4jM; original files in reference/original.
- Old standalone API deploy: dpl_2HaspoYXywYHnyATa252h1GgBxm1; API files in reference/legacy-api. Not in current release.

## Repo and database
- GitHub source handover: mohafiq007-cloud/nextjs branch handover/mariz-commerce-20261021, path apps/mariz-commerce
- HQ foundation baseline: mariz-hq-v2-foundation. Repo branch was created separately, no merge, no automatic release.
- Neon: MARIZ HQ V2 Isolated; marizhq_v2, existing schema must be inspected before migrations. No new Supabase tenancy or auth.

## Official providers
- Billplz: https://support.billplz.com/api ; https://www.billplz-sandbox.com/
- Lalamove: https://developers.lalamove.com/ ; https://partnerportal.lalamove.com/
- EasyParcel: https://developers.easyparcel.com/?c=Malaysia ; https://api.easyparcel.com/
- GrabExpress partner onboarding: https://help.grab.com/merchant/en-sg/4404599730841
- Vercel domain verification: https://vercel.com/docs/domains/set-up-custom-domain

No merchant accounts, live Billplz or Lalamove keys, registered merchant domain, or verified production provider accounts were available to this handover; never claim otherwise.
