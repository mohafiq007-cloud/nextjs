
import Link from "next/link";
import {requestPasswordReset,resetPassword} from "../actions";
import {neonEnabled} from "../../../../lib/mariz/neon-server";
import {AuthShell,AuthNotice,styles} from "../_components/auth-shell";
export const dynamic="force-dynamic";
export default async function Recover({searchParams}:{searchParams:Promise<{message?:string}>}){
 const {message}=await searchParams;const enabled=neonEnabled();
 return <AuthShell eyebrow="Account recovery" title="Reset your password." description="Request a reset code for your existing account, then use it to choose a new password.">
  <AuthNotice message={message}/>{!enabled&&<AuthNotice message="Account recovery is temporarily unavailable."/>}
  <section className={styles.formCard}><h2 className={styles.cardTitle}>1. Request a reset code</h2>
   <form className={styles.form} action={requestPasswordReset} style={{marginTop:18}}>
    <label className={styles.formLabel}>Account email<input className={styles.field} name="email" type="email" maxLength={254} autoComplete="email" required disabled={!enabled}/></label>
    <button className={styles.secondary} disabled={!enabled}>Send reset code</button>
   </form><hr className={styles.separator}/><h2 className={styles.cardTitle}>2. Set a new password</h2>
   <form className={styles.form} action={resetPassword} style={{marginTop:18}}>
    <label className={styles.formLabel}>Account email<input className={styles.field} name="email" type="email" maxLength={254} autoComplete="email" required disabled={!enabled}/></label>
    <label className={styles.formLabel}>Six-digit reset code<input className={styles.field} name="otp" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="one-time-code" required disabled={!enabled}/></label>
    <label className={styles.formLabel}>New password (12–128 characters)<input className={styles.field} name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required disabled={!enabled}/></label>
    <button className={styles.primary} disabled={!enabled}>Reset password</button>
   </form><div className={styles.links}><Link href="/co/auth/login" className={styles.smallLink}>← Return to sign in</Link></div>
  </section>
 </AuthShell>
}
