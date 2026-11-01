
import Link from "next/link";
import {signIn} from "../actions";
import {neonEnabled} from "../../../../lib/mariz/neon-server";
import {AuthShell,AuthNotice,styles} from "../_components/auth-shell";
export const dynamic="force-dynamic";
export default async function Login({searchParams}:{searchParams:Promise<{message?:string}>}){
 const {message}=await searchParams;const enabled=neonEnabled();
 return <AuthShell eyebrow="Existing account" title="Welcome back." description="Sign in to continue your company application or access your MARIZ CO workspace.">
  <AuthNotice message={message}/>
  {!enabled&&<AuthNotice message="Sign-in is temporarily unavailable while secure service configuration is completed."/>}
  <section className={styles.formCard}><form className={styles.form} action={signIn}>
   <label className={styles.formLabel}>Email<input className={styles.field} name="email" type="email" autoComplete="email" maxLength={254} required disabled={!enabled}/></label>
   <label className={styles.formLabel}>Password<input className={styles.field} name="password" type="password" autoComplete="current-password" required disabled={!enabled}/></label>
   <button className={styles.primary} disabled={!enabled}>Sign in →</button>
  </form><div className={styles.links}><Link href="/co/auth/recover" className={styles.smallLink}>Forgot your password?</Link><Link href="/co/auth/verify" className={styles.smallLink}>Verify email</Link></div></section>
  <p className={styles.note}>Don't have an account? <Link href="/co/auth/register" className={styles.smallLink}>Create one for free</Link>.</p>
 </AuthShell>
}
