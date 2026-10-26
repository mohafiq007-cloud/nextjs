
import Link from "next/link";
import {AuthShell,styles} from "./_components/auth-shell";
export default function CompanyAccess(){
 return <AuthShell eyebrow="Company gateway" title="Welcome to MARIZ CO." description="One place for your company. Create a free account to begin verification, or sign in to resume where you left off.">
  <div className={styles.cards}>
   <section className={styles.card}><span className={styles.eyebrow}>New to MARIZ</span><h2 className={styles.cardTitle}>Create an account</h2><p className={styles.cardDescription}>Start with your name and business email. We’ll guide you through email verification and company registration one step at a time.</p><Link href="/co/auth/register" className={styles.primary}>Get started →</Link></section>
   <section className={styles.card}><span className={styles.eyebrow}>Welcome back</span><h2 className={styles.cardTitle}>Sign in</h2><p className={styles.cardDescription}>Continue your company application, check verification progress, or access your company workspace.</p><Link href="/co/auth/login" className={styles.secondary}>Sign in →</Link></section>
  </div>
  <p className={styles.note}>Creating a company account is free. No subscription, card payment or product activation happens automatically.</p>
 </AuthShell>
}
