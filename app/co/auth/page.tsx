import Link from "next/link";
import { signIn, signUp } from "./actions";
import { marizBackendConfigured } from "../../../lib/mariz/supabase-server";

export const dynamic = "force-dynamic";
export default async function CompanyAccess({ searchParams }: {
 searchParams: Promise<{message?: string}>;
}) {
  const { message } = await searchParams;
  const enabled = marizBackendConfigured();
  return <main className="interior">
    <div className="interior-head"><span className="eyebrow">MARIZ CO / COMPANY ACCESS</span>
      <h1>Start with your company.</h1><p>Registration is free. Once verified, every prepared product demonstration remains available without a trial clock.</p></div>
    {message && <div className="notice" role="status">{message.slice(0,240)}</div>}
    {!enabled && <div className="notice" role="status">Secure registration is disabled on this preview until a dedicated V2 database is commissioned. No personal information is being collected here.</div>}
    <div className="two-col" style={{gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,320px),1fr))"}}>
      <section className="content-panel"><h2 style={{fontSize:25,marginBottom:18}}>Create an account</h2>
        <form action={signUp} className="form-grid" style={{gridTemplateColumns:"1fr"}}>
          <label>Email address<input name="email" type="email" autoComplete="email" required disabled={!enabled} placeholder="you@company.com"/></label>
          <label>Password (12+ characters)<input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} disabled={!enabled}/></label>
          <button className="button button-primary" disabled={!enabled}>Register for free →</button>
        </form>
        <p className="footnote">Email verification and official business documents are required before company approval. No card is needed.</p>
      </section>
      <section className="content-panel"><h2 style={{fontSize:25,marginBottom:18}}>Already registered?</h2>
        <form action={signIn} className="form-grid" style={{gridTemplateColumns:"1fr"}}>
          <label>Email address<input name="email" type="email" required autoComplete="email" disabled={!enabled}/></label>
          <label>Password<input name="password" type="password" required autoComplete="current-password" disabled={!enabled}/></label>
          <button className="button button-primary" disabled={!enabled}>Sign in →</button>
        </form>
        <p className="footnote">Your company workspace manages KYB, authorized staff, subscriptions and product access.</p>
      </section>
    </div><p style={{marginTop:25}}><Link href="/">← Return to MARIZ</Link></p>
  </main>;
}
