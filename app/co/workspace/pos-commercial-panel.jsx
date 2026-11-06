import {commercialWorkspace} from '../../../lib/mariz/pos-commercial-server.mjs';
import {subscriptionPresentation} from '../../../lib/mariz/pos-commercial-core/pilot-billing.mjs';
import {createCommercialQuote,acceptCommercialQuote,refreshCommercialPayment} from './pos-commercial-actions';
import s from './workspace-v3.module.css';
export default async function PosCommercialPanel(){
 let data;try{data=await commercialWorkspace();}catch{return <section className={s.panel}><h2>POS subscription testing is unavailable</h2><p>The isolated billing connection is not ready. No payment has been requested. Your existing POS access is unchanged.</p></section>;}
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
