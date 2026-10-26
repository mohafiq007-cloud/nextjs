import Link from "next/link";
import {redirect} from "next/navigation";
import {startKyb} from "./actions";
import {signOut} from "../auth/actions";
import {currentVerifiedUser,myCompanies,neonEnabled} from "../../../lib/mariz/neon-server";
import {neonErrorCategory} from "../../../lib/mariz/neon-error-category.mjs";
import KybPanel from './kyb-panel';
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
     {c.kyb_status&&<KybPanel organizationId={c.organization_id}/>}
     <p className="footnote">Official registration evidence and MARIZ approval are required. No product subscription has started.</p></div>}
  </section>)}
  {companies.length===0&&<section className="content-panel"><h2>Register your first company</h2><p>Your account is verified. Add the official company details to begin your application.</p><Link href="/co/company/new" className="button button-primary">Register a company →</Link></section>}
  {companies.length>0&&<p style={{marginTop:20}}><Link href="/co/company/new" className="button button-outline">Register another company →</Link></p>}
<p style={{marginTop:22}}><Link href="/">← MARIZ homepage</Link></p>
 </main>;
}
