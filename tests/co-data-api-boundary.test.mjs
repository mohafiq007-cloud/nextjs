import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {callVerifiedRpc, validateNeonDataApiUrl} from "../lib/mariz/co-data-api-request.mjs";
const endpoint = "https://ep-twilight-lake-aomjxn05.apirest.c-2.ap-southeast-1.aws.neon.tech/marizhq_v2/rest/v1";
const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.signature";

test("company Data API URL is pinned to the exact project and path", () => {
  assert.equal(validateNeonDataApiUrl(endpoint), endpoint);
  assert.equal(validateNeonDataApiUrl(endpoint.replace('ep-twilight-lake-aomjxn05','ep-misty-mouse-aoq558cc')),endpoint.replace('ep-twilight-lake-aomjxn05','ep-misty-mouse-aoq558cc'));
  for (const invalid of [
    "http://ep-twilight-lake-aomjxn05.apirest.c-2.ap-southeast-1.aws.neon.tech/marizhq_v2/rest/v1",
    "https://attacker.example/marizhq_v2/rest/v1",
    endpoint + "?redirect=evil",
    endpoint.replace("/marizhq_v2/", "/neondb/"),
    endpoint + "/rpc/api_start_kyb",
    "https://example.org@" + endpoint.slice("https://".length),
  ]) assert.throws(() => validateNeonDataApiUrl(invalid));
});

test("JWT-scoped RPC only calls allowlisted functions with no cookies or SQL password", async () => {
  let captured;
  const result = await callVerifiedRpc({
    url: endpoint, token: jwt, name:"api_my_companies",
    fetcher:async (url,options) => {
      captured={url,options};
      return new Response(JSON.stringify([{organization_id:"a",legal_name:"Example"}]),{status:200,headers:{"Content-Type":"application/json"}});
    },
  });
  assert.equal(result[0].legal_name, "Example");
  assert.equal(captured.url, endpoint + "/rpc/api_my_companies");
  assert.equal(captured.options.method,"POST");
  assert.equal(captured.options.headers.Authorization,"Bearer " + jwt);
  assert.equal(captured.options.headers["Content-Profile"],"mariz_core");
  assert.equal(captured.options.cache,"no-store");
  assert.equal(captured.options.redirect,"error");
  assert.ok(!Object.hasOwn(captured.options.headers,"Cookie"));
});

test("unlisted RPC, opaque session tokens and error details fail closed", async () => {
  let networkCalls=0;
  const fetcher=async()=>{networkCalls++; return new Response("private database details",{status:403});};
  await assert.rejects(callVerifiedRpc({url:endpoint,token:jwt,name:"approve_kyb",fetcher}),/secure company service unavailable/);
  await assert.rejects(callVerifiedRpc({url:endpoint,token:"opaque_session",name:"api_my_companies",fetcher}),/secure company service unavailable/);
  await assert.rejects(callVerifiedRpc({url:endpoint,token:jwt,name:"api_start_kyb",params:{p_organization:"test"},fetcher}), error => {
    assert.ok(!error.message.includes("private database details"));
    assert.ok(!error.message.includes(jwt));
    return true;
  });
  assert.equal(networkCalls,1);
});

test("server-side onboarding never passes a caller-controlled actor or elevated SQL", () => {
  const source = fs.readFileSync(new URL("../app/co/workspace/actions.ts", import.meta.url),"utf8");
  const server = fs.readFileSync(new URL("../lib/mariz/neon-server.ts", import.meta.url),"utf8");
  assert.ok(source.includes('registerCompanyRecoverably'));
  assert.ok(source.includes('coRpc<string>("api_start_kyb"'));
  assert.ok(!source.includes("marizSql()"));
  assert.ok(!source.includes('form.get("actor")'));
  assert.ok(server.includes('neonAuth().token()'));
  assert.ok(server.includes('NEON_PUBLIC_REGISTRATION_ENABLED === "true"'));
  assert.ok(server.includes('MARIZ_CO_PUBLIC_SIGNUP_ENABLED === "true"'));
  assert.ok(server.includes('MARIZ_EMAIL_VERIFICATION_ENFORCED === "true"'));
});
