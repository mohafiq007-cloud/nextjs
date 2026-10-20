import {sandboxOperator,billingUuid} from "../../../../../lib/mariz/billing/operator";
import {billingJson,billingReply,billingFailure} from "../../../../../lib/mariz/billing/operator-http";
import {BillingHttpError} from "../../../../../lib/mariz/billing/http.mjs";
import {sandboxBillingDependencies} from "../../../../../lib/mariz/billing/service";
import {reconcileSandboxInvoice} from "../../../../../lib/mariz/billing/workflow.mjs";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function POST(request:Request){
 try{
  const actor=await sandboxOperator(request),data=await billingJson(request);
  if(Object.keys(data).some(k=>!["requestId","providerBillId"].includes(k))||!billingUuid(data.requestId)||(data.providerBillId!==undefined&&(typeof data.providerBillId!=="string"||!/^[a-zA-Z0-9_-]{1,64}$/.test(data.providerBillId))))throw new BillingHttpError("invalid_reconciliation");
  const invoice=await reconcileSandboxInvoice(sandboxBillingDependencies(),actor.id,{requestId:data.requestId,providerBillId:data.providerBillId as string|undefined});
  return billingReply({invoice});
 }catch(e){return billingFailure(e);}
}
