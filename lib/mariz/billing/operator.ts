import "server-only";
import {currentVerifiedUser,neonEnabled} from "../neon-server";
import {billingRuntimeConfigured} from "../neon-runtime-server";
import {billplzSandboxConfigured,billplzCallbackUrl} from "./billplz";
import {BillingHttpError} from "./http.mjs";

export const billingUuid=(s:unknown):s is string=>typeof s==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
export function sandboxOperatorAllowed(id:string){
 const operators=(process.env.MARIZ_BILLPLZ_OPERATOR_IDS||"").split(",").map(s=>s.trim().toLowerCase()).filter(billingUuid);
 return operators.includes(id.toLowerCase());
}
export async function sandboxOperator(request:Request) {
  if(!neonEnabled()||!billplzSandboxConfigured()||!billingRuntimeConfigured())throw new BillingHttpError("billing_disabled",503);
  // One configured origin, never the untrusted Host/forwarded headers. No CORS opt-in.
  const origin=new URL(billplzCallbackUrl()).origin;
  if(new URL(request.url).origin!==origin || request.headers.get("origin")!==origin || request.headers.get("sec-fetch-site")==="cross-site")throw new BillingHttpError("invalid_origin",403);
  const user=await currentVerifiedUser();
  if(!user||!billingUuid(user.id))throw new BillingHttpError("sign_in_required",401);
  if(!sandboxOperatorAllowed(user.id))throw new BillingHttpError("operator_required",403);
  return user;
}
