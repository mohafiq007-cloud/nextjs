import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=p=>fs.readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("POS privileged terminal SQL is service-only and lockout-protected",()=>{
 const sql=read("supabase/migrations/202610140008_mariz_pos_v2_pairing_pin_sessions.sql");
 for(const fn of ["mariz_pos_terminal_complete_pairing","mariz_pos_terminal_validate_device",
 "mariz_pos_terminal_sign_in","mariz_pos_terminal_validate_operator","mariz_pos_terminal_sign_out"]){
  assert.ok(sql.includes(fn),"Missing "+fn);
  assert.ok(sql.includes("revoke all on function public."+fn),"Missing REVOKE for "+fn);
 }
 assert.match(sql,/to service_role;/i);
 assert.match(sql,/attempts=attempts\+1/i);
 assert.match(sql,/expires_at<=now\(\)/i);
 assert.match(sql,/locked_until=case when failed_attempts\+1>=5/i);
 assert.match(sql,/interval '15 minutes'/i);
 assert.match(sql,/interval '5 minutes'/i);
 assert.match(sql,/interval '12 hours'/i);
 assert.match(sql,/extensions\.crypt\(/i);
 assert.ok(!sql.includes("grant execute on function public.mariz_pos_terminal_sign_in(uuid,text,uuid,text,text) to authenticated"));
});
test("Revocation invalidates device credentials and staff sessions",()=>{
 const sql=read("supabase/migrations/202610140009_mariz_pos_v2_revocations.sql");
 assert.match(sql,/pos_device_credentials set revoked_at=now\(\)/);
 assert.match(sql,/pos_operator_sessions set revoked_at=now\(\)/);
 assert.match(sql,/mariz_pos_admin_revoke_device/);
 assert.match(sql,/mariz_pos_admin_suspend_staff/);
 assert.match(sql,/mariz_private\.is_owner\(p_organization\)/);
});
test("Live terminal API endpoints default to disabled and restrict browser origins",()=>{
 for(const name of ["pair","login","session","logout"]){
  const code=read("app/api/pos/terminal/"+name+"/route.ts");
  assert.ok(code.includes("terminalBackendEnabled()"),"Kill switch missing in "+name);
  if(name!=="session")assert.ok(code.includes("verifySameOrigin(request)"),"Origin guard missing in "+name);
 }
 const helper=read("lib/mariz/pos-terminal-server.ts");
 assert.ok(helper.includes('process.env.MARIZ_POS_LIVE_TERMINALS_ENABLED==="true"'));
 assert.ok(helper.includes("randomBytes(32)"));
 assert.ok(helper.includes("createHmac("));
 assert.ok(helper.includes("createHash("));
});
test("Operational terminal does not implement insecure demo checkout or shared PIN",()=>{
 const terminal=read("app/pos/terminal/terminal-client.tsx");
 assert.ok(terminal.includes('"/api/pos/terminal/login"'));
 assert.ok(terminal.includes('"/api/pos/terminal/pair"'));
 assert.ok(!terminal.includes('1234'));
 assert.ok(!terminal.includes('2468'));
 assert.ok(!terminal.includes("Simulate checkout"));
});
test("Company Back Office activation remains separate from free demonstration",()=>{
 const page=read("app/co/pos/[organizationId]/backoffice/page.tsx");
 const workspace=read("app/co/workspace/page.tsx");
 assert.ok(page.includes('organization.verification_status!=="verified"'));
 assert.ok(page.includes('workspace.status!=="active"'));
 assert.ok(page.includes('["owner","admin"]'));
 assert.ok(workspace.includes('href="/co/pos/preview"'));
 assert.ok(workspace.includes('c.pos_status==="active"'));
});
test("Service role and PIN pepper stay server-only",()=>{
 const env=read(".env.example");
 assert.ok(env.includes("MARIZ_POS_LIVE_TERMINALS_ENABLED=false"));
 assert.match(env,/^SUPABASE_SERVICE_ROLE_KEY=/m);
 assert.match(env,/^MARIZ_POS_PIN_PEPPER=/m);
 assert.ok(!env.includes("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY"));
 assert.ok(!env.includes("NEXT_PUBLIC_MARIZ_POS_PIN_PEPPER"));
});
