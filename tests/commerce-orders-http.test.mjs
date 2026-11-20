import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import ts from 'typescript';import {validateOrderRequest} from '../apps/mariz-commerce/server/order-request.mjs';
const source=fs.readFileSync(new URL('../app/api/commerce/orders/route.ts',import.meta.url),'utf8');
const id='11111111-1111-4111-8111-111111111111';const origin='https://staging.invalid';
async function handler({env={},user={id},enabled=true,fetcher=async()=>Response.json({id,total_sen:100,payment_state:'pending'})}={}){
 const context=vm.createContext({Request,Response,URL,TextDecoder,process:{env:{MARIZ_COMMERCE_STAGING_ENABLED:'true',MARIZ_COMMERCE_STAGING_ORIGIN:origin,...env}},fetch:fetcher});
 const mod=new vm.SourceTextModule(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,{context});
 await mod.link(async spec=>{
  const exports=spec.includes('neon-server')?{currentVerifiedUser:async()=>user,neonEnabled:()=>enabled,neonAuth:()=>({token:async()=>({data:{token:'signed.test.jwt'},error:null})})}:
   spec.includes('co-data-api')?{validateNeonDataApiUrl:()=>origin}:{validateOrderRequest};
  return new vm.SyntheticModule(Object.keys(exports),function(){for(const [key,value] of Object.entries(exports))this.setExport(key,value);},{context});
 });await mod.evaluate();return mod.namespace.POST;
}
const body=()=>({organization_id:id,request_key:id,items:[{product_id:id,quantity:1}]});
const req=(value=body(),headers={})=>new Request(origin+'/api/commerce/orders',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify(value)});
test('Commerce disabled and production flags fail closed',async()=>{
 for(const env of [{MARIZ_COMMERCE_STAGING_ENABLED:'false'},{VERCEL_ENV:'production'}])assert.equal((await(await handler({env}))(req())).status,503);
});
test('Commerce refuses foreign origin and unauthenticated caller',async()=>{
 assert.equal((await(await handler())(req(body(),{Origin:'https://foreign.invalid'}))).status,403);
 assert.equal((await(await handler({user:null}))(req())).status,401);
});
test('Commerce rejects body paid flag, invalid JSON and oversized stream',async()=>{
 const post=await handler();assert.equal((await post(req({...body(),paid:true}))).status,400);
 assert.equal((await post(req({text:'x'.repeat(17000)}))).status,413);
 assert.equal((await post(new Request(origin+'/api/commerce/orders',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{'}))).status,400);
});
test('Commerce JWT RPC request contains only server-validated fields',async()=>{
 let captured;const post=await handler({fetcher:async(url,options)=>{captured={url,options};return Response.json({id,total_sen:1690,payment_state:'pending'});}});
 const response=await post(req());assert.equal(response.status,200);assert.equal((await response.json()).payment_state,'pending');
 assert.equal(captured.options.headers.Authorization,'Bearer signed.test.jwt');assert.equal(captured.options.redirect,'error');
 assert.deepEqual(JSON.parse(captured.options.body),{p_organization:id,p_request_key:id,p_items:body().items});
});
test('Commerce backend failure cannot leak private response details',async()=>{
 const post=await handler({fetcher:async()=>new Response('private database detail',{status:403})});
 const response=await post(req());assert.equal(response.status,409);assert.ok(!(await response.text()).includes('private'));
});
