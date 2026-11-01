const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const css = new Proxy({}, {get: (_, key) => String(key)});
function load(file, dependencies, globals = {}) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const output = ts.transpileModule(source, {compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  }}).outputText;
  const module = {exports: {}};
  vm.runInNewContext(output, {module, exports: module.exports, FormData, ...globals,
    require: name => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name),
  });
  return module.exports;
}
const company = {
  organization_id: '11111111-1111-4111-8111-111111111111',
  legal_name: 'Fictional Company', registration_no: 'TEST-001',
  entity_type: 'sole_proprietor', verification_status: 'verified',
  member_role: 'owner', kyb_status: 'approved', pos_status: 'active',
};
const component = load('app/co/workspace/client-workspace.tsx', {
  'next/link': {__esModule: true, default: ({children, ...props}) => React.createElement('a', props, children)},
  'next/image': {__esModule: true, default: ({unoptimized, ...props}) => React.createElement('img', props)},
  '../auth/actions': {signOut: async () => {}},
  './workspace-v3.module.css': {__esModule: true, default: css},
}).default;
const render = props => renderToStaticMarkup(React.createElement(component, {
  company, application: 'PRIVATE_DOCUMENT',companyContext:'PRIVATE_CONTEXT', billing: 'PRIVATE_BILLING', feedback: 'CASE_HISTORY', ...props,
}));
test('owner navigation has six destinations and marks the current page', () => {
  const html = render({section: 'feedback'});
  for (const section of ['home','services','company','billing','feedback','settings']) {
    assert.ok(html.includes('href="/co/workspace?section=' + section + '"'));
  }
  assert.match(html, /section=feedback" aria-current="page"/);
  assert.match(html, /<summary>.*Workspace menu<\/summary>/);
  assert.match(html, /CASE_HISTORY/);
});

test('approved company POS actions lead to support without substituting a legacy demo or selling inactive access',()=>{
  for(const section of ['home','services']){
    const html=render({section});
    assert.match(html,/Ask about MARIZ POS/);
    assert.match(html,/href="\/co\/workspace\?section=feedback"/);
    assert.doesNotMatch(html,/href="\/co\/pos\/preview"|Existing POS customers|Register another company/);
  }
});
test('member cannot render injected private company or billing content', () => {
  for (const section of ['company','billing']) {
    const html = render({section, company: {...company, member_role: 'member'}});
    assert.doesNotMatch(html, /PRIVATE_DOCUMENT|PRIVATE_CONTEXT|PRIVATE_BILLING|section=billing|section=company/);
    assert.match(html, /Your company access is limited/);
  }
});
test('active status alone never manufactures a terminal launch or invoice', () => {
  for (const section of ['home','services']) {
    const html = render({section});
    assert.doesNotMatch(html, /href="\/pos\/terminal|href="\/co\/pos\/[a-f0-9-]+\/backoffice|billplz\.com\/bills/);
    assert.doesNotMatch(html, /Finance|Payroll/);
  }
});
test('company view retains required SSM and optional IC guidance', () => {
  const html = render({section: 'company'});
  assert.match(html, /PRIVATE_DOCUMENT/);
  assert.match(html, /SSM is required\. IC is optional/);
  assert.match(html,/PRIVATE_CONTEXT/);
});
test('company contact adapter denies members and mismatched company responses',async()=>{
  let role='owner',returnedId=company.organization_id,calls=0;
  const reader=load('lib/mariz/client-company-server.ts',{
    'server-only':{},
    './neon-server':{currentVerifiedUser:async()=>({id:'fixture'}),myCompanies:async()=>[{...company,member_role:role}],coRpc:async(name,...params)=>{calls++;assert.equal(name,'api_client_workspace');assert.equal(params.length,0);return {companyId:returnedId,contact:{registeredAddress:'Fictional test address',businessEmail:'test@example.invalid',country:'MY'},members:[{name:'Fictional Owner',role:'owner'}],hasMoreMembers:false};}},
  },{process:{env:{VERCEL_ENV:'preview'}}}).clientCompanyContext;
  assert.equal((await reader()).contact.country,'MY');
  returnedId='22222222-2222-4222-8222-222222222222';await assert.rejects(reader,/could not be confirmed/);
  role='member';await assert.rejects(reader,/administrator access required/);
  assert.equal(calls,2);
});
function actions(transport) {
  const effects = [];
  class FeedbackError extends Error {}
  const module = load('app/co/workspace/feedback-actions.ts', {
    'next/navigation': {redirect: href => {effects.push(['redirect', href]); throw Object.assign(new Error('redirect'), {href});}},
    'next/cache': {revalidatePath: href => effects.push(['revalidate', href])},
    '../../../lib/mariz/client-feedback-server': {...transport, FeedbackError},
  });
  return {...module, effects};
}
const validForm = () => {
  const form = new FormData();
  Object.entries({category:'issue',product:'mariz-co',subject:'Navigation problem',
    description:'The document navigation is difficult to understand.',
    requestKey:'22222222-2222-4222-8222-222222222222',
  }).forEach(([key,value]) => form.set(key,value));
  return form;
};
async function billing(data) {
  const component = load('app/co/workspace/billing-workspace.tsx', {
    'next/link': {__esModule: true, default: ({children, ...props}) => React.createElement('a', props, children)},
    '../../../lib/mariz/client-billing-server': {clientBilling: async () => {
      if (data instanceof Error) throw data;
      return data;
    }},
    './workspace-v3.module.css': {__esModule: true, default: css},
  }).default;
  return renderToStaticMarkup(await component());
}
test('billing failure differs from no mapped account and does not invent debt', async () => {
  assert.match(await billing(new Error('offline')), /Billing could not be retrieved/);
  assert.match(await billing({state:'not_connected'}), /Billing has not been linked/);
});
test('pending verification explains the next step instead of claiming a billing outage', async () => {
  const html=await billing({state:'verification_required'});
  assert.match(html,/Company verification comes first/);
  assert.match(html,/View company verification/);
  assert.doesNotMatch(html,/Billing could not be retrieved|billplz\.com/);
});
test('pending company returns verification state before any billing connection; members remain denied',async()=>{
  let role='owner',calls=0;
  const reader=load('lib/mariz/client-billing-server.ts',{
    'server-only':{},
    '@neondatabase/serverless':{neon:()=>{calls++;throw Error('SQL must not run');}},
    './neon-server':{currentVerifiedUser:async()=>({id:'fixture'}),myCompanies:async()=>[{...company,member_role:role,verification_status:'draft'}]},
  },{process:{env:{VERCEL_ENV:'preview'}}}).clientBilling;
  assert.equal((await reader()).state,'verification_required');
  role='member';await assert.rejects(reader,/administrator access required/);
  assert.equal(calls,0);
});
test('billing maps actual paid, due and failed records and rejects foreign checkout links', async () => {
  const invoices = [
    {id:'1',description:'Paid test',status:'paid',issuanceState:'issued',paymentUrl:'https://www.billplz.com/bills/example'},
    {id:'2',description:'Due test',status:'due',issuanceState:'issued',paymentUrl:'https://attacker.invalid/bills/example'},
    {id:'3',description:'Failed test',status:'due',issuanceState:'failed',paymentUrl:null},
  ].map(item => ({...item,amountMinor:100,currency:'MYR',createdAt:'2026-10-31T00:00:00Z',paidAt:null}));
  const html = await billing({state:'connected',subscriptions:[],invoices,hasOlderInvoices:false});
  assert.match(html, /Paid<\/span>/); assert.match(html, /Awaiting payment/);
  assert.match(html, /Payment request failed/); assert.doesNotMatch(html, /attacker\.invalid/);
  assert.match(html, /View Billplz payment record/);
});
test('invalid feedback does not call persistence or announce success', async () => {
  let calls = 0;
  const a = actions({createFeedback: async () => {calls++;}});
  const form = validForm(); form.set('subject', 'x');
  const result = await a.submitFeedback({}, form);
  assert.ok(result.errors.subject); assert.equal(calls, 0); assert.deepEqual(a.effects, []);
});
test('failed or unconfirmed persistence retains form and never redirects', async () => {
  for (const createFeedback of [async () => {throw new Error('failure');}, async () => ({id:'bad-id'})]) {
    const a = actions({createFeedback});
    const result = await a.submitFeedback({}, validForm());
    assert.ok(result.errors.form); assert.equal(result.values.subject, 'Navigation problem');
    assert.deepEqual(a.effects, []);
  }
});
test('confirmed case opens persisted identifier after refreshing history', async () => {
  const a = actions({createFeedback: async () => ({id:company.organization_id})});
  await assert.rejects(() => a.submitFeedback({}, validForm()), error =>
    error.href === '/co/workspace?section=feedback&case=' + company.organization_id);
  assert.equal(a.effects[0][0], 'revalidate'); assert.equal(a.effects[1][0], 'redirect');
});
