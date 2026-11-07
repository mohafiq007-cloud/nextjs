const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const css=new Proxy({},{get:(_,k)=>String(k)});
async function render(data){
 const {subscriptionPresentation}=await import('../lib/mariz/pos-commercial-core/pilot-billing.mjs');
 const source=fs.readFileSync('app/co/workspace/pos-commercial-panel.jsx','utf8');
 const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const module={exports:{}},logs=[];
 vm.runInNewContext(output,{module,exports:module.exports,console:{error:(...x)=>logs.push(x)},require:name=>{
  if(name.includes('pos-commercial-server'))return {commercialIssuanceEnabled:()=>false,commercialWorkspace:async()=>{if(data instanceof Error)throw data;return data;}};
  if(name.includes('pilot-billing'))return {subscriptionPresentation};
  if(name.includes('neon-error-category'))return {neonErrorCategory:()=> 'database_request_failed'};
  if(name.includes('pos-commercial-actions'))return {};
  if(name.endsWith('.css'))return {__esModule:true,default:css};
  return require(name);
 }});
 return {html:renderToStaticMarkup(await module.exports.default({accessOnly:true})),logs};
}
const data=term=>({outlets:[{id:'test-outlet',name:'Fictional test outlet'}],quotes:[{outlet_id:'test-outlet',term}]});
test('verified active period links to operational isolated setup, not legacy terminal',async()=>{
 const {html}=await render(data({status:'active',startsAt:'2026-01-01',endsAt:'2099-01-01'}));
 assert.match(html,/Open isolated POS setup/);assert.match(html,/mariz-pos-operational-preview/);assert.doesNotMatch(html,/pos\.marizhq\.com|RM39/);
});
for(const term of [null,{status:'suspended',startsAt:'2026-01-01',endsAt:'2099-01-01'},{status:'active',startsAt:'2020-01-01',endsAt:'2020-02-01'}])test('unconfirmed, revoked or expired access shows billing without launch',async()=>{
 const {html}=await render(data(term));assert.doesNotMatch(html,/Open isolated POS setup/);assert.match(html,/Review RM59 test quotation/);
});
test('read failure never claims payment was not requested and never logs raw secrets',async()=>{
 const {html,logs}=await render(new Error('postgresql://private-secret'));assert.match(html,/Do not pay again/);assert.doesNotMatch(html,/No payment has been requested|private-secret/);assert.deepEqual(logs,[['MARIZ_POS_CHECKOUT_READ_FAILED','database_request_failed']]);
});
function pausedActions(){
 const effects=[];
 const source=fs.readFileSync('app/co/workspace/pos-commercial-actions.ts','utf8');
 const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const module={exports:{}};
 vm.runInNewContext(output,{module,exports:module.exports,FormData,process:{env:{MARIZ_POS_PILOT_ORIGIN:'https://test.example.invalid'}},require:name=>{
  if(name==='next/headers')return {headers:async()=>new Headers({origin:'https://test.example.invalid'})};
  if(name==='next/navigation')return {redirect:()=>{throw Error('redirected');}};
  if(name.includes('pos-commercial-server'))return {commercialIssuanceEnabled:()=>false,commercialActor:async()=>{effects.push('actor');},commercialWorkspace:async()=>({actor:{id:'trusted-user',company:'trusted-company'}}),commercialService:()=>({reconcile:async()=>{effects.push('reconciled');}}),deliverCommercial:async()=>{effects.push('delivered');}};
  return require(name);
 }});
 return {actions:module.exports,effects};
}
test('closed test window rejects new quotation and acceptance before identity or payment writes',async()=>{
 const {actions,effects}=pausedActions();
 await assert.rejects(actions.createCommercialQuote(new FormData()),/paused/);
 await assert.rejects(actions.acceptCommercialQuote(new FormData()),/paused/);
 assert.deepEqual(effects,[]);
});
test('paused new bills retain authenticated reconciliation for an existing bill',async()=>{
 const {actions,effects}=pausedActions(),form=new FormData();form.set('outletId','11111111-1111-4111-8111-111111111111');form.set('billId','existing_sandbox_bill');
 await assert.rejects(actions.refreshCommercialPayment(form),/redirected/);
 assert.deepEqual(effects,['reconciled','delivered']);
});
