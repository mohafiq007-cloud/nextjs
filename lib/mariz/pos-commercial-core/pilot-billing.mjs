import {createHash} from 'node:crypto';
import {verifyBillplzSignature} from './billplz-signature.mjs';
const uuid=s=>typeof s==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(s);
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export const pilotOfferId='pos-cash-pilot-59-v2';

/** Server adapter only. actor must come from CO's existing verified session.
 * No route, credentials, browser-supplied identity, live enable flag or new Auth.
 */
export function createPilotBilling({coContext,billing,provider,signatureSecret}){
 if(provider.environment!=='sandbox')throw Error('Isolated sandbox provider required; live release is not authorised');
 async function context(actor,outlet){
  if(!uuid(actor)||!uuid(outlet))throw Error('Verified CO session and outlet required');
  const company=await coContext(actor,outlet);if(!uuid(company))throw Error('Approved CO company required');return company;
 }
 async function reconcileBill(invoice,bill){
  checkBill(bill,invoice,provider.collection);
  if(typeof bill.paid!=='boolean'||!['due','paid','deleted'].includes(bill.state)||bill.paid!==(bill.state==='paid')||bill.paid_amount!==(bill.paid?5900:0))throw Error('Provider has not confirmed full payment');
  const proof=digest({billId:bill.id,request:invoice.id,company:invoice.organization_id,collection:bill.collection_id,amount:bill.amount,paidAmount:bill.paid_amount,paid:bill.paid,state:bill.state});
  if(!bill.paid){
   if(typeof billing.observe!=='function'||await billing.observe(invoice,bill,proof)!==true)throw Error('Unpaid reconciliation unavailable');
   return {payment:bill.state==='deleted'?'cancelled':'not_confirmed',activation:'none'};
  }
  if(await billing.reconcile(invoice,bill,proof)!==true)throw Error('Payment reconciliation rejected');
  return {payment:'confirmed',activation:await billing.queue(invoice.id)?'queued':'held_for_review'};
 }
 return {
  async quote(actor,outlet,key){return billing.quote(actor,await context(actor,outlet),outlet,key,pilotOfferId);},
  async accept(actor,outlet,quoteId,acceptance,customer){
   const company=await context(actor,outlet);
   if(!uuid(quoteId)||!/^[a-f0-9]{64}$/.test(acceptance)||typeof customer?.name!=='string'||customer.name.length>255||typeof customer.email!=='string'||customer.email.length>254)throw Error('Invalid acceptance');
   // Atomic DB reservation attaches the accepted quote BEFORE provider issuance.
   const invoice=await billing.accept(actor,company,quoteId,acceptance,provider.collection,customer,outlet);
   if(invoice.organization_id!==company||invoice.amount_minor!==5900||invoice.collection_id!==provider.collection)throw Error('Reserved quotation mismatch');
   if(invoice.issuance_state==='registered')return invoice;
   if(!await billing.claim(actor,invoice.id))return {...invoice,issuance_state:'uncertain',message:'Confirm the existing bill before trying another payment.'};
   try{
    const bill=await provider.create({requestId:invoice.id,organizationId:company,amountMinor:5900,customerName:customer.name,customerEmail:customer.email,description:'MARIZ POS pilot - one outlet / one month'});
    checkBill(bill,invoice,provider.collection);
    return await billing.register(actor,invoice.id,bill);
   }catch(error){
    // Provider may have committed despite a lost response. Never create a second
    // bill automatically. Registration recovery requires the original bill ID.
    await billing.uncertain(actor,invoice.id);throw new Error('Bill creation needs reconciliation; do not create another bill',{cause:error});
   }
  },
  async callback(body){
   if(typeof body!=='string'||Buffer.byteLength(body)>8192)throw Error('Invalid callback body');
   const params=new URLSearchParams(body),fields=Object.fromEntries(params);
   if([...params.keys()].some(k=>params.getAll(k).length!==1)||!verifyBillplzSignature(fields,signatureSecret))throw Error('Invalid callback signature');
   if(fields.collection_id!==provider.collection||!/^\d+$/.test(fields.amount??'')||Number(fields.amount)!==5900||!['true','false'].includes(fields.paid)||!['due','paid','deleted'].includes(fields.state)||fields.paid!==String(fields.state==='paid')||!/^\d+$/.test(fields.paid_amount??'')||Number(fields.paid_amount)!==(fields.paid==='true'?5900:0))throw Error('Payment callback mismatch');
   const invoice=await billing.expected(fields.id);
   if(!invoice||invoice.amount_minor!==5900||invoice.currency!=='MYR'||invoice.collection_id!==provider.collection||invoice.provider_bill_id!==fields.id||!uuid(invoice.organization_id))throw Error('Unknown pilot payment');
   // Callback/redirect alone never grants service. Reconcile provider records.
   const bill=await provider.get(fields.id);
   if(fields.paid==='true'&&bill.paid!==true)throw Error('Provider has not confirmed full payment');
   // Reconciliation commits independently of delivery, preserving paid evidence
   // even when the receiver is unavailable. Existing dispatcher retries outbox.
   return reconcileBill(invoice,bill);
  },
  async reconcile(actor,outlet,billId){
   const company=await context(actor,outlet),invoice=await billing.expected(billId);
   if(!invoice||invoice.organization_id!==company||invoice.amount_minor!==5900||invoice.currency!=='MYR'||invoice.collection_id!==provider.collection||invoice.provider_bill_id!==billId)throw Error('Company payment unavailable');
   return reconcileBill(invoice,await provider.get(billId));
  }
 };
}
function checkBill(bill,invoice,collection){
 if(!bill||typeof bill.id!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(bill.id)||bill.collection_id!==collection||bill.amount!==5900||bill.reference_1!==invoice.id||bill.reference_2!==invoice.organization_id||(invoice.provider_bill_id&&bill.id!==invoice.provider_bill_id))throw Error('Provider bill association mismatch');
 const url=new URL(bill.url);
 if(url.origin!=='https://www.billplz-sandbox.com'||url.pathname!=='/bills/'+bill.id||url.search||url.hash||url.username||url.password)throw Error('Unexpected sandbox checkout destination');
}

export function subscriptionPresentation({payment='none',issuance='reserved',term=null,delivery='none',trial=false,now=Date.now()}={}){
 const valid=term&&Number.isFinite(Date.parse(term.startsAt))&&Number.isFinite(Date.parse(term.endsAt))&&Date.parse(term.endsAt)>Date.parse(term.startsAt);
 const active=Boolean(valid&&term.status==='active'&&Date.parse(term.startsAt)<=now&&Date.parse(term.endsAt)>now);
 const state=term?.status==='cancelled'?'cancelled':term?.status==='suspended'?'inactive':active?(trial?'trial':'active'):valid&&Date.parse(term.endsAt)<=now?'expired':payment==='paid'?(delivery==='held'?'activation_review':'activation_pending'):payment==='void'?'cancelled':payment==='failed'?'payment_failed':issuance==='uncertain'?'payment_uncertain':payment==='due'?'payment_pending':'inactive';
 const messages={active:'POS access is active for the displayed outlet and period.',trial:'Complimentary or trial access. This is not a paid subscription.',expired:'Access has expired. A new accepted quotation and confirmed payment are required.',cancelled:'Cancelled. Historical payments and merchant sales are retained.',inactive:'No current POS access.',activation_pending:'Payment confirmed. POS activation is still pending. Contact MARIZ if it is delayed.',activation_review:'Payment confirmed, but activation needs MARIZ review. Do not pay again.',payment_failed:'Payment was not confirmed. Existing paid access continues only until its current expiry.',payment_uncertain:'The payment request needs reconciliation. Do not start a second payment.',payment_pending:'Awaiting payment confirmation. Returning from checkout does not activate POS.'};
 return {state,active,message:messages[state],renewal:'A new bill is required each month. FPX is not deducted automatically.',period:valid?{startsAt:term.startsAt,endsAt:term.endsAt}:null};
}
