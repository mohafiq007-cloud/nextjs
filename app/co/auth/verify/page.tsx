
import Link from "next/link";
import {cookies} from "next/headers";
import {sendVerificationCode,verifyEmailCode} from "../actions";
import {neonEnabled} from "../../../../lib/mariz/neon-server";
import {AuthShell,AuthNotice,styles} from "../_components/auth-shell";
export const dynamic="force-dynamic";
export default async function Verify({searchParams}:{searchParams:Promise<{message?:string}>}){
 const {message}=await searchParams;const enabled=neonEnabled();
 const email=(await cookies()).get("mariz_co_otp_email")?.value?.slice(0,254)??"";
 return <AuthShell eyebrow="Confirm your email" title="Verify your account." description="We'll send a six-digit code to your email address. Enter the newest code below to activate your verified account." step={2}>
  <AuthNotice message={message}/>
  {!enabled&&<AuthNotice message="Email verification is temporarily unavailable while secure onboarding is being completed."/>}
  <section className={styles.formCard}>
   <form className={styles.form} action={verifyEmailCode}>
    <label className={styles.formLabel}>Account email<input className={styles.field} name="email" type="email" autoComplete="email" maxLength={254} defaultValue={email} required disabled={!enabled}/></label>
    <label className={styles.formLabel}>Six-digit verification code<input className={styles.field} name="otp" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="one-time-code" placeholder="000000" required disabled={!enabled}/></label>
    <button className={styles.primary} disabled={!enabled}>Verify and continue →</button>
   </form><hr className={styles.separator}/><p className={styles.note}>Didn't receive your code, or has it expired? Request a new one. Use the same email address you registered with.</p>
   <form className={styles.form} action={sendVerificationCode} style={{marginTop:16}}>
    <label className={styles.formLabel}>Email for resend<input className={styles.field} name="email" type="email" autoComplete="email" maxLength={254} defaultValue={email} required disabled={!enabled}/></label>
    <button className={styles.secondary} disabled={!enabled}>Send a new code</button>
   </form><div className={styles.links}><Link href="/co/auth/login" className={styles.smallLink}>Already verified? Sign in</Link><Link href="/co/auth/register" className={styles.smallLink}>Return to signup</Link></div>
  </section>
 </AuthShell>
}
