import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {stripTypeScriptTypes} from "node:module";
import * as crypto from "node:crypto";
import * as signature from "../lib/mariz/billing/billplz-signature.mjs";
import * as http from "../lib/mariz/billing/http.mjs";

const source=stripTypeScriptTypes(fs.readFileSync(new URL("../app/api/payments/billplz/callback/route.ts",import.meta.url),"utf8"));
const secret="test-only-hmac-secret";
async function handler({configured=true,neon=true,billing=true,accepted=true,dbError=false}={}){
 let calls=[];
 const context=vm.createContext({URLSearchParams,process:{env:{BILLPLZ_X_SIGNATURE_KEY:secret,BILLPLZ_COLLECTION_ID:"collection_test"}}});
 const callbackModule=new vm.SourceTextModule(source,{context});
 const modules={
  "node:crypto":{createHash:crypto.createHash},
  "next/server":{NextResponse:{json:(body,options)=>({body,status:options.status,headers:options.headers})}},
  "../../../../../lib/mariz/billing/billplz":{billplzSandboxConfigured:()=>configured},
  "../../../../../lib/mariz/billing/billplz-signature.mjs":signature,
  "../../../../../lib/mariz/billing/http.mjs":http,
  "../../../../../lib/mariz/neon-server":{neonEnabled:()=>neon},
  "../../../../../lib/mariz/neon-runtime-server":{
   billingRuntimeConfigured:()=>billing,
   billingRuntimeSql:()=>({query:async(sql,params)=>{calls.push({sql,params});if(dbError)throw Error("private db failure");return [{accepted}];}})
  }
 };
 await callbackModule.link(spec=>{
  const exports=modules[spec];if(!exports)throw Error("Unexpected dependency "+spec);
  return new vm.SyntheticModule(Object.keys(exports),function(){for(const[k,v]of Object.entries(exports))this.setExport(k,v);},{context});
 });
 await callbackModule.evaluate();
 return {post:callbackModule.namespace.POST,calls};
}
function request(body,type="application/x-www-form-urlencoded"){return{headers:new Headers({"content-type":type}),text:async()=>body};}
function signed(changes={}){
 const fields={id:"bill_test",state:"paid",paid:"true",amount:"100",paid_amount:"100",collection_id:"collection_test",...changes};
 for(const k of Object.keys(fields))if(fields[k]===undefined)delete fields[k];
 fields.x_signature=signature.billplzSignatureHex(fields,secret);
 return new URLSearchParams(fields).toString();
}
test("valid signed callback reaches billing RPC with server-derived values",async()=>{
 const h=await handler();const res=await h.post(request(signed()));
 assert.equal(res.status,200);assert.equal(res.headers["Cache-Control"],"no-store");
 assert.equal(h.calls.length,1);assert.match(h.calls[0].sql,/record_billplz_callback/);
 assert.deepEqual(Array.from(h.calls[0].params).slice(0,4),["bill_test",100,true,"paid"]);
});
for(const settings of [{configured:false},{neon:false},{billing:false}]){
 test("missing readiness fails closed "+JSON.stringify(settings),async()=>{const h=await handler(settings);assert.equal((await h.post(request(signed()))).status,503);assert.equal(h.calls.length,0);});
}
for(const [label,body,type,status]of [
 ["bad signature",signed().replace(/x_signature=[a-f0-9]+/,"x_signature="+ "0".repeat(64)),undefined,401],
 ["tampered amount",signed().replace("amount=100","amount=101"),undefined,401],
 ["wrong collection",signed({collection_id:"wrong"}),undefined,400],
 ["partial paid amount",signed({paid_amount:"99"}),undefined,400],
 ["missing paid amount",signed({paid_amount:undefined}),undefined,400],
 ["failed paid transaction",signed({transaction_status:"failed"}),undefined,400],
 ["paid contradiction",signed({paid:"false"}),undefined,400],
 ["due contradiction",signed({state:"due"}),undefined,400],
 ["negative amount",signed({amount:"-100"}),undefined,400],
 ["oversized integer",signed({amount:"2147483648"}),undefined,400],
 ["decimal amount",signed({amount:"100.1"}),undefined,400],
 ["duplicate field",signed()+"&amount=100",undefined,400],
 ["oversized body","x".repeat(16385),undefined,413],
 ["wrong content type",signed(),"application/json",415]
]){
 test(label+" never queries DB",async()=>{const h=await handler();assert.equal((await h.post(request(body,type))).status,status);assert.equal(h.calls.length,0);});
}
test("unregistered bill fails closed",async()=>{const h=await handler({accepted:false});assert.equal((await h.post(request(signed()))).status,404);});
test("DB failure returns retryable response without leaking error",async()=>{const h=await handler({dbError:true});const res=await h.post(request(signed()));assert.equal(res.status,503);assert.ok(!JSON.stringify(res.body).includes("private"));});
