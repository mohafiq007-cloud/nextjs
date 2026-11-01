
import Link from "next/link";
import {signUp} from "../actions";
import {neonRegistrationEnabled} from "../../../../lib/mariz/neon-server";
import {AuthShell,AuthNotice,styles} from "../_components/auth-shell";
export const dynamic="force-dynamic";
export default async function Register({searchParams}:{searchParams:Promise<{message?:string}>}){
 const {message}=await searchParams;
 const allowed=neonRegistrationEnabled();
 return <AuthShell eyebrow="New company account" title="Create your MARIZ account." description="Start with your personal contact details. Company documents come later, after your email is verified." step={1}>
  <AuthNotice message={message}/>
  {!allowed&&<AuthNotice message="New registrations are temporarily paused while we complete secure onboarding checks. Please do not create multiple accounts."/>}
  <section className={styles.formCard}><form action={signUp} className={styles.form}>
   <label className={styles.formLabel}>Representative full name<input className={styles.field} name="name" minLength={2} maxLength={120} autoComplete="name" placeholder="Full name" required disabled={!allowed}/></label>
   <label className={styles.formLabel}>Business email<input className={styles.field} type="email" name="email" maxLength={254} autoComplete="email" placeholder="you@company.com" required disabled={!allowed}/></label>
   <label className={styles.formLabel}>Password (12–128 characters)<input className={styles.field} name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required disabled={!allowed}/></label>
   <button className={styles.primary} disabled={!allowed}>Create my free account →</button>
  </form><div className={styles.links}><span>Already registered? <Link href="/co/auth/login" className={styles.smallLink}>Sign in</Link></span><Link href="/co/auth/verify" className={styles.smallLink}>Have a verification code?</Link></div>
  </section><p className={styles.note}>No free trial, payment details or automatic subscription. Company approval is a separate review.</p>
 </AuthShell>
}
