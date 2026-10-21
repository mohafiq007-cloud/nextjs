"use server";
import {redirect} from "next/navigation";
import {neonAuth,neonEnabled,neonRegistrationEnabled} from "../../../lib/mariz/neon-server";
import {resetPasswordWithOtp} from '../../../lib/mariz/neon-email-recovery';

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

export async function requestPasswordReset(form:FormData) {
 if(!neonEnabled())msg("Account recovery is not enabled yet");
 const email=String(form.get('email')||'').trim().toLowerCase();
 if(email.length>254||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))msg('Enter a valid email');
 try{await neonAuth().emailOtp.sendVerificationOtp({email,type:'forget-password'});}catch{}
 msg('If this account is eligible, a password reset code has been requested. Check your email.');
}
export async function resetPassword(form:FormData) {
 if(!neonEnabled())msg('Account recovery is not enabled yet');
 const email=String(form.get('email')||'').trim().toLowerCase(),otp=String(form.get('otp')||'').trim(),password=String(form.get('password')||'');
 if(email.length>254||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||!/^\d{6}$/.test(otp)||password.length<12||password.length>128)msg('Enter your email, six-digit reset code and a new password of 12–128 characters');
 let failed=true;
 try{await resetPasswordWithOtp(email,otp,password);failed=false;}catch{console.error('MARIZ_CO_RESET_FAILED','provider_or_transport_error');}
 if(failed)msg('Password reset failed. The code may be invalid or expired.');
 await neonAuth().signOut();
 msg('Password reset complete. Sign in with your new password.');
}
