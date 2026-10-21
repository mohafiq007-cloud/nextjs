"use server";
import {redirect} from "next/navigation";
import {neonAuth,neonEnabled,neonRegistrationEnabled} from "../../../lib/mariz/neon-server";

function msg(value:string):never{redirect("/co/auth?message="+encodeURIComponent(value));}
export async function signUp(form:FormData) {
 if(!neonRegistrationEnabled())msg("MARIZ CO account registration is not open yet");
 const name=String(form.get("name")||"").trim();
 const email=String(form.get("email")||"").trim().toLowerCase();
 const password=String(form.get("password")||"");
 if(name.length<2||name.length>120||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||password.length<12||password.length>128)
  msg("Enter your name, a valid email and a password of at least 12 characters");
 let failed=false;
 try{const {error}=await neonAuth().signUp.email({name,email,password});failed=Boolean(error);}
 catch{failed=true;}
 if(failed)msg("Registration could not be completed. Review the details and retry.");
 msg("Account requested. Complete email verification before accessing MARIZ CO.");
}
export async function signIn(form:FormData) {
 if(!neonEnabled())msg("Secure sign-in is not enabled yet");
 const email=String(form.get("email")||"").trim().toLowerCase();
 const password=String(form.get("password")||"");
 if(!email||!password)msg("Enter an email and password");
 let failed=false;
 try{const {error}=await neonAuth().signIn.email({email,password});failed=Boolean(error);}
 catch{failed=true;}
 if(failed)msg("Sign-in failed. Check your credentials and verify your email.");
 redirect("/co/workspace");
}
export async function signOut() {
 if(neonEnabled())await neonAuth().signOut();
 redirect("/co/auth");
}
export async function sendVerificationCode(form:FormData) {
 if(!neonEnabled())msg("Email verification is not enabled yet");
 const email=String(form.get("email")||"").trim().toLowerCase();
 if(email.length>254||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))msg("Enter a valid email");
 // Provider enforces OTP expiry, attempt and resend limits; never disclose existence.
 try{await neonAuth().emailOtp.sendVerificationOtp({email,type:"email-verification"});}catch{}
 msg("If this account is eligible, a verification code has been requested. Check your email and wait before resending.");
}
export async function verifyEmailCode(form:FormData) {
 if(!neonEnabled())msg("Email verification is not enabled yet");
 const email=String(form.get("email")||"").trim().toLowerCase();
 const otp=String(form.get("otp")||"").trim();
 if(email.length>254||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||!/^\d{6}$/.test(otp))msg("Enter your email and six-digit verification code");
 let failed=true;
 try{const {error}=await neonAuth().emailOtp.verifyEmail({email,otp});failed=Boolean(error);}catch{}
 if(failed)msg("Code could not be verified. It may be invalid or expired. Request a new code if needed.");
 msg("Email verified. Sign in to continue.");
}
