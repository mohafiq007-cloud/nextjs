import {createHash} from "node:crypto";
import {NextResponse} from "next/server";
import {billplzSandboxConfigured} from "../../../../../lib/mariz/billing/billplz";
import {verifyBillplzSignature} from "../../../../../lib/mariz/billing/billplz-signature.mjs";
import {neonEnabled} from "../../../../../lib/mariz/neon-server";
import {readBillingBody,BillingHttpError} from "../../../../../lib/mariz/billing/http.mjs";

import {billingRuntimeConfigured,billingRuntimeSql} from "../../../../../lib/mariz/neon-runtime-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function reply(body:object,status:number) {
  return NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
}

export async function POST(request:Request) {
  // Fail closed: never accept callbacks on a staging or production endpoint
  // without explicit sandbox opt-in, complete credentials and Neon readiness.
  if (!billplzSandboxConfigured() || !neonEnabled() || !billingRuntimeConfigured()) {
    return reply({error:"billing_disabled"},503);
  }
  const contentType = request.headers.get("content-type")?.toLowerCase() || "";
  if (contentType.split(";")[0].trim() !== "application/x-www-form-urlencoded") {
    return reply({error:"unsupported_content_type"},415);
  }
  let raw:string;
  try{raw=await readBillingBody(request,16_384);}catch(e){return reply({error:"invalid_callback_body"},e instanceof BillingHttpError?e.status:400);}
  const incoming = new URLSearchParams(raw);
  const fields: Record<string,string> = Object.create(null) as Record<string,string>;
  for (const [key,value] of incoming) {
    if (Object.prototype.hasOwnProperty.call(fields,key)) {
      return reply({error:"duplicate_callback_parameter"},400);
    }
    fields[key] = value;
  }
  if (!verifyBillplzSignature(fields,process.env.BILLPLZ_X_SIGNATURE_KEY!)) {
    return reply({error:"invalid_signature"},401);
  }
  const billId = fields.id;
  const state = fields.state;
  const amountRaw = fields.amount;
  const isPaid = fields.paid;
  if (
    !billId || !/^[a-zA-Z0-9_-]{1,64}$/.test(billId) ||
    !["paid","due","deleted"].includes(state) ||
    !["true","false"].includes(isPaid) ||
    (isPaid === "true") !== (state === "paid") ||
    !/^\d{1,10}$/.test(amountRaw ?? "") ||
    fields.collection_id !== process.env.BILLPLZ_COLLECTION_ID
    || (isPaid === "true" && fields.paid_amount !== amountRaw)
    || (fields.transaction_status !== undefined && !["pending","completed","failed"].includes(fields.transaction_status))
    || (isPaid === "true" && fields.transaction_status !== undefined && fields.transaction_status !== "completed")
  ) return reply({error:"invalid_callback_fields"},400);

  const amountMinor = Number(amountRaw);
  if (!Number.isSafeInteger(amountMinor) || amountMinor<1 || amountMinor>2_147_483_647) {
    return reply({error:"invalid_callback_amount"},400);
  }

  // The signature has already been verified; its digest is an idempotency key.
  // A stored bill/amount must match before updating payment state.
  // Product entitlements are intentionally NOT changed by this webhook.
  const eventDigest = createHash("sha256").update(fields.x_signature.toLowerCase()).digest("hex");
  try {
    const sql = billingRuntimeSql();
    const rows = await sql.query(
      "SELECT mariz_billing.record_billplz_callback_v2($1,$2,$3,$4,$5,$6) AS accepted",
      [billId,amountMinor,isPaid==="true",state,eventDigest,fields.collection_id]
    ) as Array<{accepted:boolean}>;
    if (!rows[0]?.accepted) return reply({error:"bill_not_registered"},404);
    return reply({received:true},200);
  } catch {
    // A non-2xx response lets Billplz retry instead of silently losing payment.
    return reply({error:"billing_temporarily_unavailable"},503);
  }
}
