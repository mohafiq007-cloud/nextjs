import Link from "next/link";
import {redirect} from "next/navigation";
import {createCompany,startKyb} from "./actions";
import {signOut} from "../auth/actions";
import {currentVerifiedUser,myCompanies,neonEnabled} from "../../../lib/mariz/neon-server";
import {neonErrorCategory} from "../../../lib/mariz/neon-error-category.mjs";
export const dynamic="force-dynamic";
export default async function Workspace({searchParams}:{searchParams:Promise<{notice?:string}>}){
 if(!neonEnabled())return <main className="interior"><h1>MARIZ CO Workspace</h1><p>The isolated Neon database exists. Real company onboarding is disabled until identity and security validation is complete.</p><Link href="/co/auth">Company access →</Link></main>;
 const user=await currentVerifiedUser();
 if(!user)redirect("/co/auth?message="+encodeURIComponent("Email verification is required"));
 let companies;
 try{companies=await myCompanies(user.id);}catch(error){
  console.error("MARIZ_CO_COMPANY_LOOKUP_FAILED",neonErrorCategory(error));
  return <main className="interior"><h1>Workspace unavailable</h1><p>Company records could not be securely retrieved. No changes were made.</p></main>;
 }
 const {notice}=await searchParams;
 return <main className="interior">
  <div className="interior-head"><span className="eyebrow">MARIZ CO / COMPANY WORKSPACE</span>
   <h1>Your company gateway.</h1><p>Registration is free. Verified companies can explore the prepared MARIZ POS demo without an expiry. Live POS activation is separately chargeable, only with consent.</p></div>
  <form action={signOut} style={{marginBottom:22}}><button className="button button-outline">Sign out</button></form>
  {notice&&<p role="status" className="notice">{notice.slice(0,240)}</p>}
  {companies.map(c=><section className="content-panel" key={c.organization_id} style={{marginBottom:22}}>
   <div className="panel-top"><div><span className="eyebrow">{c.entity_type.toUpperCase()} · {c.registration_no}</span><h2>{c.legal_name}</h2></div>
    <span className={"tag "+(c.verification_status==="verified"?"green":"amber")}>{c.verification_status}</span></div>
   {c.verification_status==="verified"?
     <div><p>Your company is approved. The prepared MARIZ POS demo is free and ready.</p>
     <Link href="/co/pos/preview" className="button button-outline">Enter prepared POS demo →</Link>
     {c.pos_status==="active"&&<p>POS subscription active. Operational terminal commissioning is pending.</p>}</div>:
     <div><p>KYB application: <strong>{c.kyb_status||"Not started"}</strong></p>
     {!c.kyb_status&&<form action={startKyb}><input type="hidden" name="organization_id" value={c.organization_id}/><button className="button button-primary">Start company verification →</button></form>}
     <p className="footnote">Official registration evidence and MARIZ approval are required. Document uploads are not live, and no product subscription has started.</p></div>}
  </section>)}
  <section className="content-panel"><h2 style={{fontSize:25}}>Register another company</h2>
   <p className="footnote">Only register companies you are authorized to represent. SSM numbers are checked for duplicates.</p>
   <form action={createCompany} className="form-grid">
    <label>Jurisdiction<input readOnly value="Malaysia"/></label>
    <label>Entity type<select name="entity_type" defaultValue="company"><option value="company">Sdn Bhd / Berhad</option><option value="sole_proprietor">Sole proprietor</option><option value="partnership">Partnership</option><option value="llp">LLP / PLT</option><option value="society">Society</option><option value="other">Other registered entity</option></select></label>
    <label>Registered legal name<input name="legal_name" required minLength={3} maxLength={200}/></label>
    <label>SSM number<input name="registration_no" required minLength={4} maxLength={80}/></label>
    <label className="full">Registered address<input name="address" required minLength={8} maxLength={700}/></label>
    <label>Business email<input type="email" name="business_email" required/></label>
    <label style={{alignSelf:"end"}}><span><input type="checkbox" name="authority" value="yes" required/> I am authorized to register this company.</span></label>
    <button className="button button-primary">Create free company profile →</button>
   </form>
  </section><p style={{marginTop:22}}><Link href="/">← MARIZ homepage</Link></p>
 </main>;
}
