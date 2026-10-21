import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const get=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("MARIZ CO uses official Neon authentication, never uses client-supplied actor IDs",()=>{
 const auth=get("lib/mariz/neon-server.ts");
 const create=get("app/co/workspace/actions.ts");
 assert.ok(auth.includes("createNeonAuth"));
 assert.ok(auth.includes("getSession()"));
 assert.ok(create.includes("currentVerifiedUser()"));
 assert.ok(create.includes("organization.create"));
 assert.ok(create.includes("api_register_company"));
 assert.ok(!create.includes("marizSql()"));
 assert.ok(!create.includes("form.get(\"actor\")"));
});
test("Neon company registration is free and onboarding is disabled by default",()=>{
 const env=get(".env.example");
 const actions=get("app/co/auth/actions.ts");
 assert.ok(env.includes("NEON_V2_ENABLED=false"));
 assert.ok(env.includes("NEON_PUBLIC_REGISTRATION_ENABLED=false"));
 assert.ok(actions.includes("neonRegistrationEnabled()"));
 const sql=get("neon/migrations/20261014_001_mariz_hq_v2_neon_native.sql");
 assert.ok(sql.includes("registration_fee_minor"));
});
test("Neon company membership is verified through DB and approved-company demo gate",()=>{
 const sql=get("neon/migrations/20261014_002_verified_company_read.sql");
 const adapter=get("lib/mariz/neon-server.ts");
 const demo=get("app/co/pos/preview/page.tsx");
 assert.ok(sql.includes("emailVerified"));
 assert.ok(sql.includes('"userId"=p_actor'));
 assert.ok(adapter.includes("api_my_companies"));
 assert.ok(demo.includes("isVerifiedCompanyMember"));
 assert.ok(demo.includes('redirect("/co/workspace")'));
});
test("Original approved PNG and correct two-offering catalog remain",()=>{
 const page=get("app/page.tsx");
 assert.ok(page.includes("/mariz-original-logo.png"));
 assert.ok(!page.includes("MARIZ Events"));
 assert.ok(page.includes("MARIZ POS"));
 assert.ok(page.includes("Custom Web Software"));
});
