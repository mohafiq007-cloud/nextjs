import {commercialWorkspace} from '../../../lib/mariz/pos-commercial-server.mjs';
import {subscriptionPresentation} from '../../../lib/mariz/pos-commercial-core/pilot-billing.mjs';
import {createCommercialQuote,acceptCommercialQuote,refreshCommercialPayment} from './pos-commercial-actions';
import s from './workspace-v3.module.css';
import {neonErrorCategory} from '../../../lib/mariz/neon-error-category.mjs';
export default async function PosCommercialPanel({accessOnly=false}){
 let data;try{data=await commercialWorkspace();}catch(error){
  const fixed=new Map([['Verified sign-in required','verified_session_unavailable'],['Approved company administrator required','company_administrator_unavailable'],['Checkout context unavailable','checkout_context_mismatch'],['Isolated commercial Preview is not configured','preview_configuration_unavailable'],['Restricted Preview billing connection required','preview_connection_unavailable']]);
  console.error('MARIZ_POS_CHECKOUT_READ_FAILED',fixed.get(error?.message)||neonErrorCategory(error));
  return <section className={s.panel} role="status"><h2>Latest POS subscription status unavailable</h2><p>We could not retrieve the latest payment and access records. This does not mean your payment failed. Do not pay again while its status is uncertain.</p><a href="/co/workspace?section=billing">Reload billing status</a></section>;
 }
 if(accessOnly)return <section className={s.panel}><h2>MARIZ POS · isolated test access</h2><p>RM59 per month for one outlet. Test billing only; no real customer charge.</p>{data.outlets.map(o=>{
  const q=data.quotes.find(q=>q.outlet_id===o.id&&subscriptionPresentation({term:q.term}).active);
  return <article className={s.billingItem} key={o.id}><h3>{o.name}</h3>{q?<><p>POS access is active for this test outlet.</p><p>Use your existing CO Preview account to register a device and create private staff PINs in POS.</p><a className={s.primary} href="https://mariz-pos-operational-preview-mohafiq007-1535s-projects.vercel.app/">Open isolated POS setup →</a></>:<><p>No active POS period is confirmed for this outlet.</p><a className={s.secondary} href="/co/workspace?section=billing">Review RM59 test quotation →</a></>}</article>;
 })}<p><a href="/co/workspace?section=billing">Payment and subscription details →</a></p><p>Cash-core only. Card, QR and bank processing are unavailable in POS. This is not a public customer demonstration or live subscription offer.</p></section>;
 return <section className={s.panel}><h2>MARIZ POS · RM59 / month · one outlet</h2>
  <p><strong>Isolated sandbox only. No real customer charge.</strong></p><p>Browser cash-core service. Each renewal needs a new quotation and bill. FPX is not deducted automatically.</p>
  {!data.outlets.length?<p>No billable test outlet is registered. Contact MARIZ to complete the isolated setup.</p>:<form action={createCommercialQuote}><label>Outlet<select name="outletId" required>{data.outlets.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label><button className={s.secondary}>Review RM59 pilot quotation</button></form>}
  {data.quotes.map(q=>{const state=subscriptionPresentation({payment:q.payment?.status,issuance:q.payment?.issuance_state,term:q.term,delivery:q.activation});return <article className={s.billingItem} key={q.id}>
   <h3>RM59.00 MYR · one outlet · monthly</h3><p>{state.message}</p><p>Quote version {q.snapshot.version} · terms {q.snapshot.terms_version}</p><p>{q.snapshot.terms_text}</p>
   {state.period&&<p>Access period: {state.period.startsAt} – {state.period.endsAt}</p>}
   {!q.accepted_at&&!q.cancelled_at?<form action={acceptCommercialQuote}><input type="hidden" name="outletId" value={q.outlet_id}/><input type="hidden" name="quoteId" value={q.id}/><input type="hidden" name="acceptanceDigest" value={q.acceptance_sha256}/><label><input type="checkbox" name="accept" required/> I accept this displayed isolated test quotation and its draft terms.</label><button className={s.primary}>Accept and open Billplz sandbox</button></form>:q.payment?.provider_bill_id?<form action={refreshCommercialPayment}><input type="hidden" name="outletId" value={q.outlet_id}/><input type="hidden" name="billId" value={q.payment.provider_bill_id}/><button className={s.secondary}>Check payment and POS activation</button></form>:<p>Payment request retained. Do not create another bill while its outcome is uncertain.</p>}
  </article>;})}
  <a href="/co/workspace?section=feedback">Contact MARIZ support</a>
 </section>;
}
