import 'server-only';
import {neon} from '@neondatabase/serverless';
import {currentVerifiedUser,myCompanies} from './neon-server';
import {createBillplzSandboxBill,getBillplzSandboxBill,billplzSandboxConfigured} from './billing/billplz';
import {createPilotBilling} from './pos-commercial-core/pilot-billing.mjs';
import {pilotSqlAdapter} from './pos-commercial-core/pilot-sql-adapter.mjs';
import {deliverCompany} from './pos-commercial-core/activation-delivery.mjs';

export const commercialEnabled=()=>process.env.VERCEL_ENV==='preview'&&process.env.MARIZ_POS_PILOT_ENABLED==='true';
// New bills need an explicit test window. Reads/reconciliation remain available
// after the temporary provider callback access has been revoked.
export const commercialIssuanceEnabled=()=>commercialEnabled()&&process.env.MARIZ_POS_PILOT_ISSUANCE_ENABLED==='true';
function query(){
 if(!commercialEnabled()||process.env.MARIZ_POS_PILOT_BRANCH!=='br-noisy-smoke-aordwffm'||process.env.NEON_AUTH_BASE_URL!=='https://ep-little-cake-aockipdm.neonauth.c-2.ap-southeast-1.aws.neon.tech/marizhq_v2/auth'||!billplzSandboxConfigured())throw Error('Isolated commercial Preview is not configured');
 const raw=process.env.MARIZ_POS_PILOT_DATABASE_URL||'',url=new URL(raw);
 if(url.protocol!=='postgresql:'||url.hostname!=='ep-little-cake-aockipdm.c-2.ap-southeast-1.aws.neon.tech'||url.username!=='mariz_pos_commercial_preview_runtime'||url.pathname!=='/marizhq_v2'||!url.password||url.port||url.hash||url.searchParams.get('sslmode')!=='require'||[...url.searchParams.keys()].some(k=>!['sslmode','channel_binding'].includes(k)))throw Error('Restricted Preview billing connection required');
 const sql=neon(raw);return (text,args=[])=>sql.query(text,args);
}
const one=async(db,text,args=[])=>(await db(text,args))[0]?.result;
export async function commercialActor(){
 if(!commercialEnabled())throw Error('Commercial Preview disabled');
 const user=await currentVerifiedUser();if(!user)throw Error('Verified sign-in required');
 const companies=await myCompanies(user.id),c=companies[0];
 if(companies.length!==1||c.verification_status!=='verified'||!['owner','admin'].includes(c.member_role))throw Error('Approved company administrator required');
 return {id:user.id,company:c.organization_id,name:user.name,email:user.email};
}
export function commercialService(){
 const db=query(),scalar=(text,args=[])=>one(db,text,args);
 const issuance={
  claim:(actor,id)=>scalar('SELECT mariz_billing_live.claim_billplz_invoice($1::uuid,$2::uuid) result',[actor,id]),
  register:(actor,id,bill)=>scalar('SELECT mariz_billing_live.register_billplz_invoice($1::uuid,$2::uuid,$3,$4,$5::integer,$6) result',[actor,id,bill.id,bill.collection_id,bill.amount,bill.url]),
  uncertain:(actor,id)=>scalar('SELECT mariz_billing_live.mark_billplz_uncertain($1::uuid,$2::uuid) result',[actor,id]),
  expected:bill=>scalar('SELECT mariz_billing_live.pos_pilot_expected_payment($1) result',[bill]),
  observe:(request,bill,digest)=>scalar('SELECT mariz_billing_live.pos_pilot_observe_unpaid($1::uuid,$2,$3,$4::integer,$5,$6) result',[request.id,bill.id,bill.collection_id,bill.amount,bill.state,digest])
 };
 const bindings=pilotSqlAdapter({co:db,billing:db,issuance});
 const queue=bindings.billing.queue;
 bindings.billing.queue=async id=>{const queued=await queue(id);if(queued){const company=await scalar('SELECT mariz_billing_live.pos_pilot_request_company($1::uuid) result',[id]);await deliverCommercial(company);}return queued;};
 const provider={environment:'sandbox',collection:process.env.BILLPLZ_COLLECTION_ID,
  create:input=>createBillplzSandboxBill({...input,pilotCheckout:true}),get:getBillplzSandboxBill};
 return createPilotBilling({...bindings,provider,signatureSecret:process.env.BILLPLZ_X_SIGNATURE_KEY});
}
export async function commercialWorkspace(){
 const actor=await commercialActor(),db=query();
 const result=await one(db,'SELECT mariz_billing_live.pos_pilot_checkout_workspace($1::uuid) result',[actor.id]);
 if(!result||result.company!==actor.company||!Array.isArray(result.outlets)||!Array.isArray(result.quotes))throw Error('Checkout context unavailable');
 return {actor,...result};
}
export async function deliverCommercial(company){
 const db=query();
 return deliverCompany(company,{
  pending:org=>one(db,'SELECT mariz_billing_live.pending_pos_events($1::uuid) result',[org]),
  activate:(p,digest)=>one(db,'SELECT mariz_billing_live.receive_pos_pilot_event($1::uuid,$2) result',[p.orderId,digest]),
  revoke:()=>{throw Error('Revocation needs an authorised operator');},
  ack:(kind,id,digest)=>one(db,'SELECT mariz_billing_live.ack_pos_event($1,$2::uuid,$3) result',[kind,id,digest])
 });
}
