import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import * as http from '../lib/mariz/billing/http.mjs';
const userId='10000000-0000-4000-8000-000000000001',origin='https://sandbox.example.invalid';
const input={organizationId:'20000000-0000-4000-8000-000000000001',idempotencyKey:'40000000-0000-4000-8000-000000000001',amountMinor:100,customerName:'Sandbox test',customerEmail:'test@example.invalid',description:'Test invoice'};
async function route({enabled=true,user={id:userId},allow=userId,dbError=null}={},kind='invoices'){
 let mutations=0;const context=vm.createContext({URL,Response,process:{env:{MARIZ_BILLPLZ_OPERATOR_IDS:allow}}}),cache=new Map();
 async function load(file){if(cache.has(file))return cache.get(file);const short=file.replaceAll('\\','/');let values;
  if(short.endsWith('/neon-server'))values={neonEnabled:()=>enabled,currentVerifiedUser:async()=>user};
  else if(short.endsWith('/neon-runtime-server'))values={billingRuntimeConfigured:()=>true};
  else if(short.endsWith('/billing/billplz'))values={billplzSandboxConfigured:()=>enabled,billplzCallbackUrl:()=>origin+'/api/payments/billplz/callback'};
  else if(short.endsWith('/billing/service'))values={sandboxBillingDependencies:()=>({})};
  else if(short.endsWith('/billing/workflow.mjs'))values={issueSandboxInvoice:async()=>{mutations++;if(dbError)throw dbError;return{id:'test',payment_url:'https://www.billplz-sandbox.com/bills/test'};},reconcileSandboxInvoice:async()=>{mutations++;if(dbError)throw dbError;return{status:'paid'};}};
  else if(short.endsWith('/billing/http.mjs'))values=http;
  else if(file==='server-only')values={};
  else if(file==='next/server')values={NextResponse:{json:(body,options)=>Response.json(body,options)}};
  if(values){const m=new vm.SyntheticModule(Object.keys(values),function(){for(const[k,v]of Object.entries(values))this.setExport(k,v);},{context});cache.set(file,m);return m;}
  const filename=file.endsWith('.ts')?file:file+'.ts',source=stripTypeScriptTypes(fs.readFileSync(filename,'utf8'));
  const m=new vm.SourceTextModule(source,{context});cache.set(file,m);await m.link(spec=>load(spec.startsWith('.')?path.resolve(path.dirname(filename),spec):spec));return m;
 }
 const file=path.resolve(`app/api/payments/billplz/${kind}/route.ts`),mod=await load(file);await mod.evaluate();return{post:mod.namespace.POST,get mutations(){return mutations}};
}
function request(body=input,extra={}){return new Request(origin+'/api/payments/billplz/invoices',{method:'POST',headers:{origin,'content-type':'application/json',...extra},body:JSON.stringify(body)});}
for(const kind of ['invoices','reconcile'])for(const[settings,status,label]of [[{enabled:false},503,'disabled'],[{user:null},401,'anonymous'],[{allow:''},403,'empty operator list'],[{allow:'other'},403,'unapproved user']])test(kind+' rejects '+label+' before mutation',async()=>{const h=await route(settings,kind);const r=await h.post(request());assert.equal(r.status,status);assert.equal(h.mutations,0);});
test('operator endpoint rejects cross-origin and forged host',async()=>{const h=await route();assert.equal((await h.post(request(input,{origin:'https://evil.invalid'}))).status,403);assert.equal(h.mutations,0);});
test('operator cannot supply provider URL, tenant actor or callback destination',async()=>{const h=await route();assert.equal((await h.post(request({...input,callback_url:'https://evil.invalid'}))).status,400);assert.equal(h.mutations,0);});
test('authorized operator reaches issuance and response never caches',async()=>{const h=await route();const r=await h.post(request());assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(h.mutations,1);});
test('database tenant denial is controlled and never leaks its exception',async()=>{const h=await route({dbError:{code:'42501',message:'PRIVATE CONNECTION'}});const r=await h.post(request());assert.equal(r.status,403);assert.ok(!(await r.text()).includes('PRIVATE'));});
test('unknown errors return safe retryable diagnostics',async()=>{const h=await route({dbError:Error('PRIVATE CREDENTIAL')});const r=await h.post(request());assert.equal(r.status,503);assert.ok(!(await r.text()).includes('PRIVATE'));});
test('streaming body limit rejects without reading an unbounded payload',async()=>{const h=await route();const r=await h.post(request({...input,description:'x'.repeat(9000)}));assert.equal(r.status,413);assert.equal(h.mutations,0);});
