import "server-only";
import {NextResponse} from "next/server";
import {BillingHttpError,readBillingBody} from "./http.mjs";
import {neonErrorCategory} from "../neon-error-category.mjs";
export const billingReply=(data:object,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
export async function billingJson(request:Request):Promise<Record<string,unknown>> {
 if(request.headers.get("content-type")?.split(";")[0].trim().toLowerCase()!=="application/json")throw new BillingHttpError("unsupported_content_type",415);
 let value:unknown;try{value=JSON.parse(await readBillingBody(request));}catch(e){if(e instanceof BillingHttpError)throw e;throw new BillingHttpError("invalid_json");}
 if(!value||typeof value!=="object"||Array.isArray(value))throw new BillingHttpError("invalid_json");
 return value as Record<string,unknown>;
}
export function billingFailure(e:unknown){
 if(e instanceof BillingHttpError)return billingReply({error:e.code,...(e.requestId?{requestId:e.requestId}:{})},e.status);
 const code=(e&&typeof e==="object"&&"code"in e)?e.code:null;
 if(code==="42501")return billingReply({error:"organization_operator_required"},403);
 if(code==="22023"||code==="23505")return billingReply({error:"invoice_conflict"},409);
 // Never return/log provider bodies, URLs, database exception text or credentials.
 return billingReply({error:"billing_temporarily_unavailable",diagnostic:neonErrorCategory(e)},503);
}
