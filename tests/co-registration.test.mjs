import test from "node:test";
import assert from "node:assert/strict";
import {registrationSlug,registerCompanyRecoverably} from "../lib/mariz/co-registration.mjs";
const profile={p_registration_no:"2026-001234",p_legal_name:"Fictional test company"};
function fixture() {
 const orgs=[];let creates=0,writes=0,fail=true;
 const auth={organization:{list:async()=>({data:orgs,error:null}),create:async input=>{
  if(orgs.some(o=>o.slug===input.slug))return {data:null,error:{code:"DUPLICATE"}};
  creates++;const org={...input,id:"test-org"};orgs.push(org);return {data:org,error:null};
 }}};
 const rpc=async(name,params)=>{writes++;if(fail)throw Error("RPC unavailable");return params.p_organization;};
 return {auth,rpc,orgs,counts:()=>({creates,writes}),recover:()=>{fail=false;}};
}
test("registration identity ignores SSM formatting, isolates actors, hides identifiers",()=>{
 assert.equal(registrationSlug("A","2026-001234"),registrationSlug("A","2026001234"));
 assert.notEqual(registrationSlug("A","2026001234"),registrationSlug("B","2026001234"));
 assert.match(registrationSlug("A","2026001234"),/^mariz-[a-f0-9]{40}$/);
 assert.throws(()=>registrationSlug("A","---"));
});
test("profile failure resumes same Auth organization without orphan duplication",async()=>{
 const f=fixture(),args={actorId:"A",profile,auth:f.auth,rpc:f.rpc};
 await assert.rejects(registerCompanyRecoverably(args));f.recover();
 assert.equal(await registerCompanyRecoverably(args),"test-org");
 assert.deepEqual(f.counts(),{creates:1,writes:2});
});
test("concurrent submissions arbitrate through unique Auth slug",async()=>{
 const f=fixture();f.recover();
 const args={actorId:"A",profile,auth:f.auth,rpc:f.rpc};
 assert.deepEqual(await Promise.all([registerCompanyRecoverably(args),registerCompanyRecoverably(args)]),["test-org","test-org"]);
 assert.equal(f.counts().creates,1);
});
test("ambiguous Auth timeout recovers committed organization",async()=>{
 const f=fixture();f.recover();const create=f.auth.organization.create;
 f.auth.organization.create=async input=>{await create(input);throw Error("timeout");};
 assert.equal(await registerCompanyRecoverably({actorId:"A",profile,...f}),"test-org");
 assert.equal(f.counts().creates,1);
});
test("failed organization lookup fails closed before creating or writing",async()=>{
 const f=fixture();f.auth.organization.list=async()=>({data:null,error:{code:"UNAVAILABLE"}});
 await assert.rejects(registerCompanyRecoverably({actorId:"A",profile,...f}));
 assert.deepEqual(f.counts(),{creates:0,writes:0});
});
