import Link from "next/link";
import {signIn,signUp} from "./actions";
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
 {!enabled&&<p className="notice" role="status">Private V2 integration preview: real sign-in and onboarding are disabled pending security validation.</p>}
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
 </div><p style={{marginTop:25}}><Link href="/">← Return to MARIZ</Link></p></main>;
}
