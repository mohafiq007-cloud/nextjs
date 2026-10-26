import Link from "next/link";
import {redirect} from "next/navigation";
import {createCompany} from "../../workspace/actions";
import {currentVerifiedUser,neonEnabled} from "../../../../lib/mariz/neon-server";
import {AuthShell,AuthNotice,styles} from "../../auth/_components/auth-shell";
export const dynamic="force-dynamic";
export default async function NewCompany({searchParams}:{searchParams:Promise<{notice?:string}>}){
 if(!neonEnabled())return <AuthShell eyebrow="Company registration" title="Company registration is temporarily unavailable." description="We are validating the secure onboarding service before taking new company applications."><Link className={styles.secondary} href="/co/auth">Back to company gateway</Link></AuthShell>;
 const user=await currentVerifiedUser();
 if(!user)redirect("/co/auth/login?message="+encodeURIComponent("Sign in with your verified email before registering a company."));
 const {notice}=await searchParams;
 return <AuthShell eyebrow="Company registration" title="Tell us about your company." description="Use your official registered details. We'll verify your company documents before any services can be activated." step={3}>
  <AuthNotice message={notice}/>
  <section className={styles.formCard}>
   <form action={createCompany} className={styles.form}>
    <label className={styles.formLabel}>Country<input className={styles.field} readOnly value="Malaysia" /></label>
    <label className={styles.formLabel}>Registered entity type<select className={styles.field} name="entity_type" defaultValue="company"><option value="company">Sdn Bhd / Berhad</option><option value="sole_proprietor">Sole proprietor</option><option value="partnership">Partnership</option><option value="llp">LLP / PLT</option><option value="society">Society</option><option value="other">Other registered entity</option></select></label>
    <label className={styles.formLabel}>Legal company name<input className={styles.field} name="legal_name" minLength={3} maxLength={200} autoComplete="organization" required /></label>
    <label className={styles.formLabel}>SSM / registration number<input className={styles.field} name="registration_no" minLength={4} maxLength={80} required /></label>
    <label className={styles.formLabel}>Registered business address<input className={styles.field} name="address" minLength={8} maxLength={700} autoComplete="street-address" required /></label>
    <label className={styles.formLabel}>Business contact email<input className={styles.field} name="business_email" type="email" autoComplete="email" required /></label>
    <label className={styles.formLabel} style={{display:"flex",flexDirection:"row",alignItems:"start",gap:11}}><input type="checkbox" name="authority" value="yes" required /> I am authorized to register this company for MARIZ verification.</label>
    <button className={styles.primary}>Create company profile →</button>
   </form><p className={styles.note}>Your company profile is free. Official evidence and independent approval are required before it is verified. No subscription starts automatically.</p>
   <div className={styles.links}><Link href="/co/workspace" className={styles.smallLink}>← Return to company workspace</Link></div>
  </section>
 </AuthShell>;
}
