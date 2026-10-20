import test from "node:test";
import assert from "node:assert/strict";
import {validateMarizDatabaseUrl as validate} from "../lib/mariz/neon-runtime-policy.mjs";
const host="ep-sweet-night-ao7w6nf3-pooler.c-2.ap-southeast-1.aws.neon.tech";
const make=(role="mariz_runtime_restricted")=>"postgresql://"+role+":test-only-not-a-real-password@"+host+"/marizhq_v2?sslmode=require&channel_binding=require";

test("separate restricted company and billing credentials are accepted",()=>{
 assert.equal(validate(make(),"company",host),make());
 assert.equal(validate(make("mariz_billing_runtime_limited"),"billing",host),make("mariz_billing_runtime_limited"));
});
for(const role of ["marizhq_v2_owner","mariz_v2_runtime","mariz_app_v2","mariz_billing_runtime_test","authenticator"]){
 test("reject elevated or unrelated role "+role,()=>assert.throws(()=>validate(make(role),"company",host),/Invalid isolated/));
}
test("a billing credential cannot become a company credential",()=>assert.throws(()=>validate(make("mariz_billing_runtime_limited"),"company",host)));
test("a company credential cannot become a billing credential",()=>assert.throws(()=>validate(make(),"billing",host)));
for(const [label,raw,expected]of [
 ["missing URL",undefined,host],["malformed URL","not a url",host],["missing host",make(),undefined],
 ["wrong project host",make().replace("sweet-night","other-host"),host],
 ["host suffix attack",make().replace(host,host+".attacker.invalid"),host],
 ["wrong database",make().replace("/marizhq_v2?","/neondb?"),host],
 ["database suffix",make().replace("/marizhq_v2?","/other/marizhq_v2?"),host],
 ["missing password",make().replace(":test-only-not-a-real-password",""),host],
 ["wrong protocol",make().replace("postgresql:","https:"),host],
 ["disabled TLS",make().replace("sslmode=require","sslmode=disable"),host],
 ["duplicate TLS",make()+"&sslmode=disable",host],
 ["missing channel binding",make().replace("&channel_binding=require",""),host],
 ["disabled channel binding",make().replace("channel_binding=require","channel_binding=disable"),host],
 ["duplicate channel binding",make()+"&channel_binding=disable",host],
 ["connection override option",make()+"&options=-c%20role%3Dmarizhq_v2_owner",host],
 ["fragment",make()+"#fragment",host]
]){
 test("reject "+label,()=>assert.throws(()=>validate(raw,"company",expected),/Invalid isolated/));
}
test("validation errors never echo credentials",()=>{
 try{validate(make("marizhq_v2_owner"),"company",host);assert.fail();}catch(e){assert.ok(!e.message.includes("test-only-not-a-real-password"));assert.ok(!e.message.includes("postgresql"));}
});
