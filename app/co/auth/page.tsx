import Link from "next/link";
import {signIn,signUp} from "./actions";
import {neonBackendConfigured,neonPublicSignupsEnabled} from "../../../lib/mariz/neon-auth-server";
export const dynamic="force-dynamic";
export default async function CompanyAccess({searchParams}:{searchParams:Promise<{message?:string}>}){
 const {message}=await searchParams,loginEnabled=neonBackendConfigured(),signupEnabled=neonPublicSignupsEnabled();
 return <main className="interior">
  <div className="interior-head"><span className="eyebrow">MARIZ CO / COMPANY GATEWAY</span><h1>Your company starts here.</h1><p>MARIZ CO is free company registration, verification and onboarding. Explore the prepared MARIZ POS demo after approval; only live product activation is chargeable.</p></div>
  {message&&<div className="notice" role="status">{message.slice(0,240)}</div>}
  {!loginEnabled&&<div className="notice" role="status">Neon Auth is not connected to this preview. Registration and login are disabled.</div>}
  {loginEnabled&&!signupEnabled&&<div className="notice" role="status">New registration is paused until Neon's verified-email policy has been confirmed.</div>}
  <div className="two-col" style={{gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,320px),1fr))"}}>
   <section className="content-panel"><h2 style={{fontSize:25}}>Create representative account</h2><form action={signUp} className="form-grid" style={{gridTemplateColumns:"1fr"}}>
    <label>Full name<input name="name" autoComplete="name" required disabled={!signupEnabled} minLength={3} maxLength={120}/></label>
    <label>Email<input name="email" type="email" autoComplete="email" required disabled={!signupEnabled}/></label>
    <label>Password (12+ characters)<input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} disabled={!signupEnabled}/></label>
    <button className="button button-primary" disabled={!signupEnabled}>Register free →</button>
   </form><p className="footnote">Company KYB follows email verification. No payment method or trial timer.</p></section>
   <section className="content-panel"><h2 style={{fontSize:25}}>Existing account</h2><form action={signIn} className="form-grid" style={{gridTemplateColumns:"1fr"}}>
    <label>Email<input name="email" type="email" autoComplete="email" required disabled={!loginEnabled}/></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" required disabled={!loginEnabled}/></label>
    <button className="button button-primary" disabled={!loginEnabled}>Sign in →</button>
   </form><p className="footnote">MARIZ CO is your company gateway, not a paid software product.</p></section>
  </div><p style={{marginTop:24}}><Link href="/">← MARIZ Homepage</Link></p>
 </main>;
}
