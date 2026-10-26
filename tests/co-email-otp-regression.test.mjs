import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("MARIZ CO OTP sends inspect the returned provider error (not only exceptions)",()=>{
 const src=read("app/co/auth/actions.ts");
 assert.match(src,/const \{error\}=await neonAuth\(\)\.emailOtp\.sendVerificationOtp\(/);
 assert.match(src,/if\(error\)console\.error\("MARIZ_CO_OTP_SEND_FAILED",otpFailureCategory\(error\)\)/);
 assert.match(src,/catch\(error\)\{console\.error\("MARIZ_CO_OTP_SEND_FAILED",otpFailureCategory\(error\)\);\}/);
});

test("MARIZ CO OTP verification emits safe categories, not credentials or raw errors",()=>{
 const src=read("app/co/auth/actions.ts");
 assert.match(src,/console\.error\("MARIZ_CO_OTP_VERIFY_FAILED",otpFailureCategory\(error\)\)/);
 assert.match(src,/return "provider_or_transport_error"/);
 assert.doesNotMatch(src,/console\.(?:log|warn|error)\(\s*(?:email|otp|password|error)\s*\)/);
});

test("Resend and verify retain the same email across server-action redirects",()=>{
 const src=read("app/co/auth/actions.ts"),page=read("app/co/auth/page.tsx");
 assert.match(src,/\.set\("mariz_co_otp_email",email,/);
 assert.match(page,/\.get\("mariz_co_otp_email"\)/);
 assert.equal((page.match(/defaultValue=\{verificationEmail\}/g)||[]).length,2);
 assert.match(src,/\.set\("mariz_co_otp_email","",/);
});
