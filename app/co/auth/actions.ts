"use server";
import {redirect} from "next/navigation";
import {cookies} from "next/headers";
import {neonAuth,neonEnabled,neonRegistrationEnabled} from "../../../lib/mariz/neon-server";
import {resetPasswordWithOtp} from '../../../lib/mariz/neon-email-recovery';

type AuthPath="/co/auth"|"/co/auth/register"|"/co/auth/login"|"/co/auth/verify"|"/co/auth/recover";
function msg(value:string,target:AuthPath="/co/auth"):never{redirect(target+"?message="+encodeURIComponent(value));}
// Emit only fixed diagnostic categories: never log an email, OTP, credential or raw provider response.
function otpFailureCategory(error:unknown):string {
 const e:{status?:number;statusCode?:number;code?:string;message?:string}=(error&&typeof error==="object")?error as {status?:number;statusCode?:number;code?:string;message?:string}:{};
 const status=Number(e.status??e.statusCode);
 const description=[e.code,e.message].filter(x=>typeof x==="string").join(" ").toLowerCase();
 if(status===429||/rate.?limit|too.many/.test(description))return "rate_limited";
 if(status===401||status===403)return "authorization_rejected";
 if(status===404)return "endpoint_not_found";
 if(status>=500)return "provider_unavailable";
 if(/expir/.test(description))return "expired_code";
 if(/invalid|incorrect|wrong|mismatch/.test(description))return "invalid_code_or_purpose";
 if(/already.verify/.test(description))return "already_verified";
 if(status===400||status===422)return "provider_rejected";
 return "provider_or_transport_error";
}
export async function signUp(form:FormData) {
 if(!neonRegistrationEnabled())msg("MARIZ CO account registration is not open yet","/co/auth/register");
 const name=String(form.get("name")||"").trim();
 const email=String(form.get("email")||"").trim().toLowerCase();
 const password=String(form.get("password")||"");
 if(name.length<2||name.length>120||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||password.length<12||password.length>128)
  msg("Enter your name, a valid email and a password of at least 12 characters","/co/auth/register");
 let failed=false;
 try{const {error}=await neonAuth().signUp.email({name,email,password});failed=Boolean(error);}
 catch{failed=true;}
 if(failed)msg("Registration could not be completed. Check the details, or sign in if an account already exists.","/co/auth/register");
 (await cookies()).set("mariz_co_otp_email",email,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/co/auth",maxAge:15*60});
 msg("Account created. Request the latest email verification code to continue.","/co/auth/verify");
}
export async function signIn(form:FormData) {
 if(!neonEnabled())msg("Secure sign-in is not enabled yet","/co/auth/login");
 const email=String(form.get("email")||"").trim().toLowerCase();
 const password=String(form.get("password")||"");
 if(!email||!password)msg("Enter an email and password","/co/auth/login");
 let failed=false;
 try{const {error}=await neonAuth().signIn.email({email,password});failed=Boolean(error);}
 catch{failed=true;}
 if(failed)msg("Sign-in failed. Check your credentials and verify your email.","/co/auth/login");
 redirect("/co/workspace");
}
export async function signOut() {
 if(neonEnabled())await neonAuth().signOut();
 redirect("/co/auth/login");
}
export async function sendVerificationCode(form:FormData) {
 if(!neonEnabled())msg("Email verification is not enabled yet","/co/auth/verify");
 const email=String(form.get("email")||"").trim().toLowerCase();
 if(email.length>254||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))msg("Enter a valid email","/co/auth/verify");
 // Keep the account email across redirect, so the resend and verification forms use the same address.
 // This cookie is only a UI hint: Neon Auth remains the authority for identity and verification.
 (await cookies()).set("mariz_co_otp_email",email,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/co/auth",maxAge:15*60});
 // Do not disclose account existence; do record a safe failure category for operations.
 try{
  const {error}=await neonAuth().emailOtp.sendVerificationOtp({email,type:"email-verification"});
  if(error)console.error("MARIZ_CO_OTP_SEND_FAILED",otpFailureCategory(error));
 }catch(error){console.error("MARIZ_CO_OTP_SEND_FAILED",otpFailureCategory(error));}
 msg("If this account is eligible, a verification code has been requested. Use the newest code. If already verified, sign in instead.","/co/auth/verify");
}
export async function verifyEmailCode(form:FormData) {
 if(!neonEnabled())msg("Email verification is not enabled yet","/co/auth/verify");
 const email=String(form.get("email")||"").trim().toLowerCase();
 const otp=String(form.get("otp")||"").trim();
 if(email.length>254||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||!/^\d{6}$/.test(otp))msg("Enter your email and six-digit verification code","/co/auth/verify");
 let failed=true;
 try{
  const {error}=await neonAuth().emailOtp.verifyEmail({email,otp});
  failed=Boolean(error);
  if(error)console.error("MARIZ_CO_OTP_VERIFY_FAILED",otpFailureCategory(error));
 }catch(error){console.error("MARIZ_CO_OTP_VERIFY_FAILED",otpFailureCategory(error));}
 if(failed)msg("Code could not be verified. Use the latest code for this account, or sign in if already verified.","/co/auth/verify");
 (await cookies()).set("mariz_co_otp_email","",{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/co/auth",maxAge:0});
 msg("Email verified. Sign in to continue.","/co/auth/login");
}

export async function requestPasswordReset(form:FormData) {
 if(!neonEnabled())msg("Account recovery is not enabled yet");
 const email=String(form.get('email')||'').trim().toLowerCase();
 if(email.length>254||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))msg('Enter a valid email','/co/auth/recover');
 try{await neonAuth().emailOtp.sendVerificationOtp({email,type:'forget-password'});}catch{}
 msg('If this account is eligible, a password reset code has been requested. Check your email.','/co/auth/recover');
}
export async function resetPassword(form:FormData) {
 if(!neonEnabled())msg('Account recovery is not enabled yet','/co/auth/recover');
 const email=String(form.get('email')||'').trim().toLowerCase(),otp=String(form.get('otp')||'').trim(),password=String(form.get('password')||'');
 if(email.length>254||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||!/^\d{6}$/.test(otp)||password.length<12||password.length>128)msg('Enter your email, six-digit reset code and a new password of 12–128 characters','/co/auth/recover');
 let failed=true;
 try{await resetPasswordWithOtp(email,otp,password);failed=false;}catch{console.error('MARIZ_CO_RESET_FAILED','provider_or_transport_error');}
 if(failed)msg('Password reset failed. The code may be invalid or expired.','/co/auth/recover');
 await neonAuth().signOut();
 msg('Password reset complete. Sign in with your new password.','/co/auth/login');
}
