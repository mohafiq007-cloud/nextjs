const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const css=new Proxy({},{get:(_,k)=>String(k)});
async function render(data){
 const {subscriptionPresentation}=await import('../lib/mariz/pos-commercial-core/pilot-billing.mjs');
 const source=fs.readFileSync('app/co/workspace/pos-commercial-panel.jsx','utf8');
 const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const module={exports:{}},logs=[];
 vm.runInNewContext(output,{module,exports:module.exports,console:{error:(...x)=>logs.push(x)},require:name=>{
  if(name.includes('pos-commercial-server'))return {commercialWorkspace:async()=>{if(data instanceof Error)throw data;return data;}};
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
