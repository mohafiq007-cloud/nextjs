import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {stripTypeScriptTypes} from "node:module";
import {validateMarizDatabaseUrl} from "../lib/mariz/neon-runtime-policy.mjs";
const source=stripTypeScriptTypes(fs.readFileSync(new URL("../lib/mariz/neon-runtime-server.ts",import.meta.url),"utf8"));
const host="ep-sweet-night-ao7w6nf3-pooler.c-2.ap-southeast-1.aws.neon.tech";
const url=role=>"postgresql://"+role+":test-only@"+host+"/marizhq_v2?sslmode=require&channel_binding=require";
async function factory(env){
 const connections=[];
 const context=vm.createContext({process:{env}});
 const module=new vm.SourceTextModule(source,{context});
 await module.link(spec=>{
  const exports=spec==="server-only"?{}:spec==="@neondatabase/serverless"?{neon:value=>{connections.push(value);return {value};}}:{validateMarizDatabaseUrl};
  return new vm.SyntheticModule(Object.keys(exports),function(){for(const[k,v]of Object.entries(exports))this.setExport(k,v);},{context});
 });
 await module.evaluate();return {api:module.namespace,connections};
}
const env=()=>({MARIZ_NEON_DATABASE_HOST:host,MARIZ_NEON_DATABASE_URL:url("mariz_runtime_restricted"),MARIZ_BILLING_DATABASE_URL:url("mariz_billing_runtime_limited")});
test("company and billing factories use separate credentials",async()=>{
 const f=await factory(env());assert.equal(f.api.companyRuntimeConfigured(),true);assert.equal(f.api.billingRuntimeConfigured(),true);
 f.api.companyRuntimeSql();f.api.billingRuntimeSql();assert.deepEqual(f.connections,[env().MARIZ_NEON_DATABASE_URL,env().MARIZ_BILLING_DATABASE_URL]);
});
test("missing billing credential never falls back to company",async()=>{
 const e=env();delete e.MARIZ_BILLING_DATABASE_URL;const f=await factory(e);
 assert.equal(f.api.billingRuntimeConfigured(),false);assert.throws(()=>f.api.billingRuntimeSql());assert.equal(f.connections.length,0);
});
test("elevated company role fails readiness before signup",async()=>{
 const e=env();e.MARIZ_NEON_DATABASE_URL=url("mariz_v2_runtime");const f=await factory(e);
 assert.equal(f.api.companyRuntimeConfigured(),false);assert.throws(()=>f.api.companyRuntimeSql());assert.equal(f.connections.length,0);
});
test("billing factory rejects company credential",async()=>{
 const e=env();e.MARIZ_BILLING_DATABASE_URL=e.MARIZ_NEON_DATABASE_URL;const f=await factory(e);
 assert.equal(f.api.billingRuntimeConfigured(),false);assert.throws(()=>f.api.billingRuntimeSql());assert.equal(f.connections.length,0);
});
