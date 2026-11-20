"use client";
import Link from "next/link";
import {useRef,useState,type FormEvent} from "react";
import {createAuthClient} from "@neondatabase/auth/next";

const auth=createAuthClient();
export default function TestAccountSetup(){
 const [email,setEmail]=useState("");
 const [step,setStep]=useState<"email"|"verify"|"recovery"|"password"|"done">("email");
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const pending=useRef(false);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending.current)return;
  pending.current=true;setBusy(true);setMessage("");
  const form=event.currentTarget,fields=new FormData(form);
  const otp=String(fields.get("otp")||"").trim();
  const password=String(fields.get("password")||"");
  const address=email.trim().toLowerCase();
  try{
   if(step==="email"){
    const result=await auth.emailOtp.sendVerificationOtp({email:address,type:"email-verification"});
    if(result.error)throw new Error("verification_send");
    setEmail(address);setStep("verify");setMessage("Check your inbox for the verification code. Enter it here privately.");
   }else if(step==="verify"){
    const result=await auth.emailOtp.verifyEmail({email:address,otp});
    if(result.error)throw new Error("verification_failed");
    setStep("recovery");setMessage("Email verified. Request a separate password setup code next.");
   }else if(step==="recovery"){
    const result=await auth.emailOtp.requestPasswordReset({email:address});
    if(result.error)throw new Error("recovery_send");
    setStep("password");setMessage("Check your inbox for the new password reset code. Use this new code, not the earlier verification code.");
   }else if(step==="password"){
    if(password.length<12||password.length>128||password!==String(fields.get("confirm")||"")){
     setMessage("Use matching passwords of 12–128 characters.");return;
    }
    const result=await auth.emailOtp.resetPassword({email:address,otp,password});
    if(result.error)throw new Error("password_setup_failed");
    setStep("done");setMessage("Password set. Continue to company login and sign in privately.");
   }
   form.reset();
  }catch{
   setMessage("This step could not be completed. Check the latest code and retry. If it expired, start again to request fresh codes.");
  }finally{pending.current=false;setBusy(false);}
 }
 return <section className="content-panel" style={{maxWidth:600}}>
  {message&&<p className="notice" role="status">{message}</p>}
  {step!=="done"&&<form onSubmit={submit} className="form-grid" style={{gridTemplateColumns:"1fr"}}>
   <label>Test account email<input name="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required disabled={busy||step!=="email"}/></label>
   {(step==="verify"||step==="password")&&<label>Email code<input name="otp" required inputMode="numeric" autoComplete="one-time-code" minLength={4} maxLength={16} disabled={busy}/></label>}
   {step==="password"&&<>
    <label>New test password<input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" disabled={busy}/></label>
    <label>Confirm new password<input name="confirm" type="password" required minLength={12} maxLength={128} autoComplete="new-password" disabled={busy}/></label>
   </>}
   <button className="button button-primary" disabled={busy}>{busy?"Please wait…":step==="email"?"Send verification code":step==="verify"?"Verify email":step==="recovery"?"Send password setup code":"Set test password"}</button>
   {step!=="email"&&<button type="button" className="button" disabled={busy} onClick={()=>{setStep("email");setMessage("");}}>Start again</button>}
  </form>}
  <p className="footnote">Enter codes and passwords only on this page. No public registration, billing access or product activation is granted here.</p>
  <Link href="/co/auth">Continue to company login →</Link>
 </section>;
}
