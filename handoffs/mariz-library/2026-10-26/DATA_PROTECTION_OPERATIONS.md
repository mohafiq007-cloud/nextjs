# MARIZ Library — Data Protection Operating Standard (implementation candidate)
Date: 26 October 2026. Status: **OWNER PROCESS CONFIRMATION REQUIRED**. This is an executable checklist, not evidence that controls already operate.

## Authority and actual services
- Data controller: MHQ ENTERPRISE trading as MARIZ, SSM 202303202566 (PG0545645-U), evidenced in earlier MARIZ owner handover.
- Public reader privacy channel: mariz.headquarters@gmail.com **as currently displayed in the deployed draft**. Its mailbox ownership, monitoring, deliverability and privacy-request response workflow must be confirmed, not assumed.
- App infrastructure evidenced: Vercel (web), Neon PostgreSQL and Managed Better Auth, transactional email relay (production Neon Auth config shows Brevo as SMTP relay). Verify subprocessors and region arrangements in provider dashboards before final approval.
- Current catalogue is public; account registration is disabled in Vercel production. No protected manuscripts or eligible editions exist in Neon production at the time of the audit.
- Do NOT name a DPO or publish an address without validated operational facts. Assess DPO and data controller registration duties across MHQ/MARIZ as appropriate under JPDP requirements.

## Data inventory and provisional retention rubric
**The operator must assign concrete operational retention controls and owners before claiming they run.** Do not invent calendar durations in the public policy.
| Data category | Purpose | Owner/source | Retention trigger | Required deletion action |
| --- | --- | --- | --- | --- |
| Auth users & verified email | Identity and recovery | Neon Auth | Account active; then account closure and any legal hold | Verify identity; apply deletion/erasure process subject to legal exceptions; preserve audit record without excess data |
| Session tokens, OTP and reset state | Account security | Neon Auth | Provider expiry and security need | Confirm TTL and removal/expiry in Neon console |
| Reader display name, locale, beta interest | Reader preferences | mariz_library.reader_accounts | Account active; closure/legal hold | Remove associated row only after dependent records checked |
| Bookshelf entries | Saved catalogue selections | mariz_library.bookshelf | Account active | Remove on account deletion; FK configured ON DELETE CASCADE from reader_accounts |
| Beta admissions, reviews, moderation, history | Limited beta and fair reviews | mariz_library.* | Beta access, disputes, legitimate review need | Define expiry/revocation and retained-history procedure; don't automatically publish reviews |
| Application errors/security logs | Reliability and abuse response | Vercel/Neon | Minimum reasonable security investigation period | Configure retention/access/log redaction in platform accounts |
| Privacy requests and incidents | Rights responses and legal compliance | Operator-managed restricted register | Appropriate lawful record need | Minimize request evidence and protect against accidental disclosure |
| Backups/provider copies | Disaster recovery | Neon/Vercel | Provider retention cycles | Verify expiry; document residual backup lifecycle |

## Concrete owner-run operating procedure
1. Assign mailbox coverage and an accountable privacy contact. Verify outbound and inbound messages to the published address, and control access to it.
2. Log each request in a restricted register: date, request category, identity check result, relevant systems, action, close date. Never log passwords, tokens or full manuscript content.
3. Handle access/correction by verified identity, using data minimization. Do not email a reader another reader's profile or bookshelf.
4. Handle erasure by mapping records across Neon Auth, mariz_library.reader_accounts, bookshelf, beta admission and review history, then confirming permissible preservation. Existing reader_accounts FK with ON DELETE RESTRICT to Neon Auth means **delete sequence and provider procedure require testing**; do not run ad-hoc cascading deletion in production.
5. Confirm applicable security incident notification procedures and time limits from current JPDP guidelines. Practice incident triage and evidence preservation without circulating plaintext credentials.
6. If adding third-party analytics or marketing, revisit the notice and appropriate consent before enabling either. The present code must not auto-enroll readers.
7. Test monthly or at a defined review cadence and when providers/features change. Retain evidence.

## Registration release tests (all must be evidenced)
- Privacy page loads at /library/privacy and is linked from signup and footer; both languages complete, mobile-accessible and truthful.
- Public sign-up clearly differentiates mandatory account data from optional beta and promotional choices; record notice version presented (version 1.0).
- Register → email verification → sign-in → sign-out → reload session → reset password → sign-in again.
- Verified reader can see own account, save/unsave a public title, update profile; anonymous/other reader cannot access.
- Verify rate limits or abuse mitigation for registration/login/reset; failed auth does not leak existence of other accounts.
- Verify staging and production data/API/auth URLs never mix; test production only with consent and a controlled fresh account.
- Verify Neon reader functions: API authenticated role only, mariz_library private tables not readable by anonymous or authenticated directly, all security-definer functions have fixed empty search_path.
- Test data rights request by emailing and receiving an actual reply before broad launch.
- Document rollback: disable production registration flag first, then redeploy prior known-good Vercel production deployment. Preserve catalogue and private beta restrictions.

## Legal verification
Official JPDP: https://www.pdp.gov.my/ppdpv1/en/akta/personal-data-protection-general-practice/
Section 7 notice/choice: types/purposes/sources, rights/contact, recipient classes, choices, mandatory/voluntary, consequences, notice in BM and EN before collection.
2024 amendment, 2025 DPO/breach/transfer guidelines, 2026 controller-registration circular must be checked against the real operator's scale and activities. A bilingual policy is not itself proof of legal compliance.
