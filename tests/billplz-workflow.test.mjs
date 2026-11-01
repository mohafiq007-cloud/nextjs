import test from 'node:test';
import assert from 'node:assert/strict';
import {issueSandboxInvoice,reconcileSandboxInvoice} from '../lib/mariz/billing/workflow.mjs';
const actor='10000000-0000-4000-8000-000000000001',org='20000000-0000-4000-8000-000000000001',id='30000000-0000-4000-8000-000000000001';
const input={organizationId:org,idempotencyKey:'40000000-0000-4000-8000-000000000001',amountMinor:100,customerName:'Sandbox test',customerEmail:'test@example.invalid',description:'Sandbox only'};
function harness({createError=false,registerError=false,claim=true,readError=false,wrongRef=false,paid=true}={}){
 let invoice={id,organization_id:org,amount_minor:100,collection_id:'collection_test',provider_bill_id:null,payment_url:null,status:'draft',issuance_state:'reserved'},creates=0,reads=0,registered=false;const calls=[];
 const bill={id:'bill_test',collection_id:'collection_test',amount:100,paid,state:paid?'paid':'due',url:'https://www.billplz-sandbox.com/bills/bill_test',reference_1:id,reference_2:wrongRef?'other-tenant':org};
 const deps={collection:'collection_test',sql:{query:async(q,p)=>{const name=q.match(/mariz_billing\.([^(]+)/)[1];calls.push({name,p});switch(name){
 case 'reserve_billplz_invoice':return[{result:{...invoice}}];
 case 'claim_billplz_invoice':if(claim)invoice.issuance_state='creating';return[{result:claim}];
 case 'register_billplz_invoice':if(registerError)throw Error('PRIVATE DATABASE URL');invoice={...invoice,provider_bill_id:p[2],payment_url:p[5],status:'due',issuance_state:'registered'};registered=true;return[{result:{...invoice}}];
 case 'mark_billplz_uncertain':invoice.issuance_state='uncertain';return[{result:null}];
 case 'billplz_invoice':return[{result:{...invoice}}];
 case 'record_billplz_reconciliation':if(p[4])invoice.status='paid';return[{result:true}];
 default:throw Error('unexpected RPC');}}},provider:{create:async(data)=>{creates++;assert.equal(data.requestId,id);if(createError)throw Error('PRIVATE API KEY');return bill;},get:async()=>{reads++;if(readError)throw Error('PRIVATE API KEY');return bill;}}};
 return{deps,calls,get creates(){return creates},get reads(){return reads},get registered(){return registered},get invoice(){return invoice}};
}
test('reserve and claim precede provider creation; URL returned only after durable registration',async()=>{const h=harness();const r=await issueSandboxInvoice(h.deps,actor,input);assert.ok(h.registered);assert.equal(r.payment_url,'https://www.billplz-sandbox.com/bills/bill_test');assert.deepEqual(h.calls.map(c=>c.name),['reserve_billplz_invoice','claim_billplz_invoice','register_billplz_invoice']);});
test('idempotent retry of registered invoice never creates another provider bill',async()=>{const h=harness();await issueSandboxInvoice(h.deps,actor,input);await issueSandboxInvoice(h.deps,actor,input);assert.equal(h.creates,1);});
for(const settings of [{createError:true},{registerError:true}])test('uncertain creation cannot be automatically retried '+JSON.stringify(settings),async()=>{const h=harness(settings);await assert.rejects(issueSandboxInvoice(h.deps,actor,input),e=>e.code==='invoice_requires_reconciliation'&&e.requestId===id&&!e.message.includes('PRIVATE'));await assert.rejects(issueSandboxInvoice(h.deps,actor,input));assert.equal(h.creates,1);assert.equal(h.invoice.issuance_state,'uncertain');assert.equal(h.invoice.payment_url,null);});
test('concurrent losing claim never reaches provider',async()=>{const h=harness({claim:false});await assert.rejects(issueSandboxInvoice(h.deps,actor,input));assert.equal(h.creates,0);});
test('reconciliation uses authenticated provider read and stable event digest',async()=>{const h=harness();await issueSandboxInvoice(h.deps,actor,input);const a=await reconcileSandboxInvoice(h.deps,actor,{requestId:id});await reconcileSandboxInvoice(h.deps,actor,{requestId:id});assert.equal(a.status,'paid');const events=h.calls.filter(c=>c.name==='record_billplz_reconciliation');assert.equal(events[0].p[6],events[1].p[6]);});
test('uncertain registration recovers existing provider bill without issuing again',async()=>{const h=harness({createError:true});await assert.rejects(issueSandboxInvoice(h.deps,actor,input));const invoice=await reconcileSandboxInvoice(h.deps,actor,{requestId:id,providerBillId:'bill_test'});assert.equal(invoice.status,'paid');assert.equal(h.creates,1);assert.equal(h.reads,1);});
test('wrong organization reference is rejected before registration or event recording',async()=>{const h=harness({wrongRef:true});await issueSandboxInvoice(h.deps,actor,input);await assert.rejects(reconcileSandboxInvoice(h.deps,actor,{requestId:id}),e=>e.code==='bill_mismatch');assert.equal(h.calls.filter(c=>c.name==='record_billplz_reconciliation').length,0);});
test('caller cannot substitute another provider bill on a registered invoice',async()=>{const h=harness();await issueSandboxInvoice(h.deps,actor,input);await assert.rejects(reconcileSandboxInvoice(h.deps,actor,{requestId:id,providerBillId:'other'}));assert.equal(h.reads,0);});
test('provider read failure never records a payment',async()=>{const h=harness({readError:true});await issueSandboxInvoice(h.deps,actor,input);await assert.rejects(reconcileSandboxInvoice(h.deps,actor,{requestId:id}));assert.equal(h.calls.filter(c=>c.name==='record_billplz_reconciliation').length,0);});
test('failed payment remains due',async()=>{const h=harness({paid:false});await issueSandboxInvoice(h.deps,actor,input);const r=await reconcileSandboxInvoice(h.deps,actor,{requestId:id});assert.equal(r.status,'due');});
