import {sandboxOperator,billingUuid} from "../../../../../lib/mariz/billing/operator";
import {billingJson,billingReply,billingFailure} from "../../../../../lib/mariz/billing/operator-http";
import {BillingHttpError} from "../../../../../lib/mariz/billing/http.mjs";
import {sandboxBillingDependencies} from "../../../../../lib/mariz/billing/service";
import {issueSandboxInvoice} from "../../../../../lib/mariz/billing/workflow.mjs";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function POST(request:Request){
 try{
  const actor=await sandboxOperator(request),data=await billingJson(request);
  if(Object.keys(data).some(k=>!["organizationId","idempotencyKey","amountMinor","customerName","customerEmail","description"].includes(k))||!billingUuid(data.organizationId)||!billingUuid(data.idempotencyKey)
   ||typeof data.amountMinor!=="number"||!Number.isSafeInteger(data.amountMinor)||data.amountMinor<100||data.amountMinor>2147483647
   ||typeof data.customerName!=="string"||data.customerName.trim().length<2||data.customerName.length>255
   ||typeof data.customerEmail!=="string"||data.customerEmail.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerEmail)
   ||typeof data.description!=="string"||!data.description.trim()||data.description.length>200)throw new BillingHttpError("invalid_invoice");
  const invoice=await issueSandboxInvoice(sandboxBillingDependencies(),actor.id,{organizationId:data.organizationId,idempotencyKey:data.idempotencyKey,amountMinor:data.amountMinor,customerName:data.customerName.trim(),customerEmail:data.customerEmail,description:data.description.trim()});
  return billingReply({invoice});
 }catch(e){return billingFailure(e);}
}
