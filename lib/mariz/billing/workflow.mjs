import {createHash} from 'node:crypto';
import {BillingHttpError} from './http.mjs';
async function rpc(sql,name,params){
 const placeholders=params.map((_,i)=>'$'+(i+1)).join(',');
 const rows=await sql.query(`SELECT mariz_billing.${name}(${placeholders}) AS result`,params);
 if(!rows.length)throw new BillingHttpError('billing_unavailable',503);
 return rows[0].result;
}
export async function issueSandboxInvoice(deps,actor,input){
 const {sql,provider,collection}=deps;
 const invoice=await rpc(sql,'reserve_billplz_invoice',[actor,input.organizationId,input.idempotencyKey,collection,input.amountMinor,input.customerName,input.customerEmail,input.description]);
 if(invoice.issuance_state==='registered')return invoice;
 if(invoice.issuance_state!=='reserved'||!await rpc(sql,'claim_billplz_invoice',[actor,invoice.id]))throw new BillingHttpError('invoice_requires_reconciliation',409,invoice.id);
 try{
  const bill=await provider.create({...input,organizationId:invoice.organization_id,requestId:invoice.id});
  if(bill.amount!==invoice.amount_minor || bill.collection_id!==invoice.collection_id)throw new Error('provider mismatch');
  // This RPC commits provider ID, immutable expected amount and tenant before any URL is returned.
  return await rpc(sql,'register_billplz_invoice',[actor,invoice.id,bill.id,bill.collection_id,bill.amount,bill.url]);
 }catch{
  // Creation can have succeeded even when transport/registration failed. Never automatically issue again.
  try{await rpc(sql,'mark_billplz_uncertain',[actor,invoice.id]);}catch{/* creating itself also blocks a second issuance */}
  throw new BillingHttpError('invoice_requires_reconciliation',409,invoice.id);
 }
}
export async function reconcileSandboxInvoice(deps,actor,input){
 const {sql,provider}=deps;
 let invoice=await rpc(sql,'billplz_invoice',[actor,input.requestId]);
 if(invoice.provider_bill_id&&input.providerBillId&&invoice.provider_bill_id!==input.providerBillId)throw new BillingHttpError('bill_mismatch',409);
 const billId=invoice.provider_bill_id||input.providerBillId;
 if(!billId)throw new BillingHttpError('provider_bill_id_required',409,invoice.id);
 const bill=await provider.get(billId);
 if(bill.amount!==invoice.amount_minor||bill.collection_id!==invoice.collection_id||bill.reference_1!==invoice.id||bill.reference_2!==invoice.organization_id)throw new BillingHttpError('bill_mismatch',409);
 if(invoice.issuance_state!=='registered')invoice=await rpc(sql,'register_billplz_invoice',[actor,invoice.id,bill.id,bill.collection_id,bill.amount,bill.url]);
 const digest=createHash('sha256').update(JSON.stringify(['reconciliation',bill.id,bill.collection_id,bill.amount,bill.paid,bill.state])).digest('hex');
 if(!await rpc(sql,'record_billplz_reconciliation',[actor,invoice.id,bill.id,bill.amount,bill.paid,bill.state,digest,bill.collection_id]))throw new BillingHttpError('reconciliation_rejected',409);
 return rpc(sql,'billplz_invoice',[actor,invoice.id]);
}
