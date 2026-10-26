import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Customer entry offers two clear paths rather than four forms",()=>{
 const home=read("app/co/auth/page.tsx");
 assert.match(home,/href="\/co\/auth\/register"/);
 assert.match(home,/href="\/co\/auth\/login"/);
 assert.doesNotMatch(home,/<form\b/);
 assert.doesNotMatch(home,/sendVerificationCode|requestPasswordReset|verifyEmailCode/);
});

test("Distinct and accessible customer flows keep actions in their own routes",()=>{
 const cases=[
  ["register","signUp","Create my free account"],
  ["login","signIn","Sign in"],
  ["verify","verifyEmailCode","Verify and continue"],
  ["recover","resetPassword","Reset password"],
 ];
 for(const [route,action,label] of cases){
  const page=read("app/co/auth/"+route+"/page.tsx");
  assert.match(page,new RegExp("action=\\{"+action+"\\}"),route);
  assert.ok(page.includes(label),route);
  assert.match(page,/required/);
  assert.match(page,/disabled=\{!enabled\}|disabled=\{!allowed\}/);
  assert.match(page,/AuthNotice/);
 }
});

test("Signup, verification, sign-in, recovery have distinct return paths",()=>{
 const src=read("app/co/auth/actions.ts");
 for(const path of ["/co/auth/register","/co/auth/verify","/co/auth/login","/co/auth/recover"])
  assert.ok(src.includes('"'+path+'"')||src.includes("'"+path+"'"),path);
 assert.match(src,/Account created\. Request the latest email verification code/);
 assert.match(src,/msg\("Email verified\. Sign in to continue\.","\/co\/auth\/login"\)/);
});

test("OTP email carries to verification screen and uses correct purpose",()=>{
 const actions=read("app/co/auth/actions.ts"),verify=read("app/co/auth/verify/page.tsx");
 assert.match(actions,/sendVerificationOtp\(\{email,type:"email-verification"\}\)/);
 assert.match(actions,/verifyEmail\(\{email,otp\}\)/);
 assert.match(verify,/\.get\("mariz_co_otp_email"\)/);
 assert.equal((verify.match(/defaultValue=\{email\}/g)||[]).length,2);
});

test("Responsive flow styling and progress labels exist",()=>{
 const css=read("app/co/auth/auth-flow.module.css"),shell=read("app/co/auth/_components/auth-shell.tsx");
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/grid-template-columns:1fr/);
 assert.match(shell,/aria-label="Company onboarding progress"/);
 assert.match(shell,/aria-current/);
});
