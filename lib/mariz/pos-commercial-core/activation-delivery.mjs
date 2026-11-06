import {createHash} from 'node:crypto';
const uuid=s=>typeof s==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(s);
export async function deliverCompany(company,deps){
 if(!uuid(company))throw Error('Trusted company required');
 let count=0;
 for(let batch=0;batch<5;batch++){
  const events=await deps.pending(company);if(!Array.isArray(events)||events.length>20)throw Error('Invalid activation batch');
  for(const e of events){
   if(!uuid(e.id)||typeof e.raw!=='string'||Buffer.byteLength(e.raw)>262144||createHash('sha256').update(e.raw).digest('hex')!==e.digest)throw Error('Activation integrity failure');
   const p=JSON.parse(e.raw);
   if(p.version!==1||!uuid(p.orderId)||!uuid(p.paymentRequestId))throw Error('Invalid activation contract');
   if(e.kind==='activation'){
    if(e.id!==p.orderId||!Array.isArray(p.terms)||!p.terms.length||p.terms.some(t=>t.coOrganizationId!==company||t.sourceBranch!=='br-bold-unit-aothxcnn'))throw Error('Activation company mismatch');
    await deps.activate(p,e.digest);
   }else if(e.kind==='revocation'){
    if(e.id!==p.eventId||p.coOrganizationId!==company||!uuid(p.outletId)||!['cancelled','suspended'].includes(p.status))throw Error('Invalid revocation contract');
    await deps.revoke(p,e.digest);
   }else throw Error('Unknown activation event');
   // Cross-database delivery cannot be one transaction. The receiver commits
   // idempotently first; a lost acknowledgement safely replays that same event.
   if(!await deps.ack(e.kind,e.id,e.digest))throw Error('Activation acknowledgement failed');count++;
  }
  if(events.length<20)return count;
 }
 throw Error('Activation backlog requires another bounded delivery attempt');
}
