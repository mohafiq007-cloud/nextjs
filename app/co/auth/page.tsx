import Link from "next/link";
import {signIn,signUp,sendVerificationCode,verifyEmailCode} from "./actions";
import {neonEnabled,neonRegistrationEnabled} from "../../../lib/mariz/neon-server";
export const dynamic="force-dynamic";
export default async function CompanyAccess({searchParams}:{searchParams:Promise<{message?:string}>}){
 const {message}=await searchParams;
 const enabled=neonEnabled(),register=neonRegistrationEnabled();
 return <main className="interior">
 <div className="interior-head"><span className="eyebrow">MARIZ CO / COMPANY GATEWAY</span>
  <h1>Your company starts here.</h1>
  <p>Register your company for free. Verify your email address and submit official company documentation for MARIZ review. Paid products activate only when explicitly selected.</p></div>
 {message&&<p className="notice" role="status">{message.slice(0,240)}</p>}
 {!enabled&&<p className="notice" role="status">Company onboarding is temporarily unavailable while secure registration is being verified. Please do not retry with multiple accounts.</p>}
 {enabled&&!register&&<p className="notice" role="status">New account registration is temporarily closed pending email-verification and company-registration checks.</p>}
 <div className="two-col" style={{gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,320px),1fr))"}}>
  <section className="content-panel"><h2>Create a MARIZ CO account</h2>
   <form action={signUp} className="form-grid" style={{gridTemplateColumns:"1fr"}}>
    <label>Representative full name<input name="name" required minLength={2} maxLength={120} disabled={!register} placeholder="As per official records"/></label>
    <label>Business email<input name="email" type="email" required autoComplete="email" disabled={!register} placeholder="you@company.com"/></label>
    <label>Password (12+ characters)<input name="password" type="password" minLength={12} maxLength={128} required autoComplete="new-password" disabled={!register}/></label>
    <button className="button button-primary" disabled={!register}>Register for free →</button>
   </form>
   <p className="footnote">No credit card, no free trial and no automatic product activation. All companies require verification.</p></section>
  <section className="content-panel"><h2>Company login</h2>
   <form action={signIn} className="form-grid" style={{gridTemplateColumns:"1fr"}}>
    <label>Email<input name="email" type="email" required autoComplete="email" disabled={!enabled}/></label>
    <label>Password<input name="password" type="password" required autoComplete="current-password" disabled={!enabled}/></label>
    <button className="button button-primary" disabled={!enabled}>Sign in →</button>
   </form>
   <p className="footnote">MARIZ CO is the organization platform. MARIZ POS and Custom Web Software are the available offerings.</p></section>
 </div>
 <section className="content-panel" style={{marginTop:22}}><h2>Verify your email</h2>
  <p>Request a code for your MARIZ account, then enter the code from your email. Codes expire; do not share them.</p>
  <form action={sendVerificationCode} className="form-grid">
   <label>Account email<input name="email" type="email" required maxLength={254} autoComplete="email" disabled={!enabled}/></label>
   <button className="button button-outline" disabled={!enabled}>Send or resend verification code</button>
  </form>
  <form action={verifyEmailCode} className="form-grid" style={{marginTop:16}}>
   <label>Account email<input name="email" type="email" required maxLength={254} autoComplete="email" disabled={!enabled}/></label>
   <label>Six-digit code<input name="otp" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="one-time-code" required disabled={!enabled}/></label>
   <button className="button button-primary" disabled={!enabled}>Verify email</button>
  </form>
 </section><p style={{marginTop:25}}><Link href="/">← Return to MARIZ</Link></p></main>;
}
