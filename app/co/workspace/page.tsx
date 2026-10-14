import Link from "next/link";
import { redirect } from "next/navigation";
import { marizBackendConfigured, marizServerClient } from "../../../lib/mariz/supabase-server";
import { createCompany, startKyb, uploadKybDocument, submitKyb } from "./actions";
import { signOut } from "../auth/actions";

export const dynamic = "force-dynamic";

type Company = { id:string; legal_name:string; registration_no:string; verification_status:string; entity_type:string };
type Application = { id:string; status:string; created_at:string };

export default async function Workspace({ searchParams }: { searchParams: Promise<{message?: string}> }) {
  if (!marizBackendConfigured()) return <main className="interior"><h1>MARIZ CO Workspace</h1><p>Awaiting isolated V2 database. No data collection is active.</p><Link href="/co/auth">Company access</Link></main>;
  const supabase = await marizServerClient();
  const { data: { user },error } = await supabase.auth.getUser();
  if (error||!user) redirect("/co/auth");
  const memberships = await supabase.from("mariz_memberships").select("organization_id,member_role").eq("user_id",user.id);
  const ids=(memberships.data || []).map(m=>m.organization_id);
  let companies:Company[]=[];
  if(ids.length) {
    const { data }=await supabase.from("mariz_organizations").select("id,legal_name,registration_no,verification_status,entity_type").in("id",ids);
    companies=(data || []) as Company[];
  }
  const appByOrg: Record<string,Application|undefined>={};
  for(const company of companies){
    const { data }=await supabase.from("mariz_kyb_applications").select("id,status,created_at")
      .eq("organization_id",company.id).order("created_at",{ascending:false}).limit(1).maybeSingle();
    if(data)appByOrg[company.id]=data;
  }
  const {message}=await searchParams;
  return <main className="interior">
    <div className="interior-head"><span className="eyebrow">MARIZ CO / VERIFIED COMPANY GATEWAY</span><h1>Your company workspace.</h1><p>Free company registration. Prepared product demos unlock after verification. Real product activation requires a separate commercial agreement.</p></div>
    <form action={signOut} style={{marginBottom:22}}><button className="button button-outline">Sign out</button></form>
    {message&&<div className="notice" role="status">{message.slice(0,240)}</div>}
    {companies.map(c=>{
      const a=appByOrg[c.id];
      return <section className="content-panel" style={{marginBottom:24}} key={c.id}>
        <div className="panel-top"><div><span className="eyebrow">{c.entity_type.toUpperCase()} · {c.registration_no}</span><h2>{c.legal_name}</h2></div>
          <span className={"tag "+(c.verification_status==="verified"?"green":"amber")}>{c.verification_status}</span></div>
        {c.verification_status==="verified"?
          <div><p>Company KYB approved. Your prepared demos are ready. MARIZ product activation is separate and chargeable only when explicitly accepted.</p>
            <Link href="/" className="button button-primary">Explore prepared demos →</Link></div>
        :<div>
          <p style={{color:"#667c72"}}>KYB application: <strong>{a?.status || "Not started"}</strong></p>
          {!a && <form action={startKyb}><input type="hidden" name="organization_id" value={c.id}/><button className="button button-primary">Start company verification →</button></form>}
          {a && ["draft","needs_information"].includes(a.status) && <>
            <form action={uploadKybDocument} encType="multipart/form-data" className="form-grid" style={{marginTop:20}}>
              <input type="hidden" name="organization_id" value={c.id}/><input type="hidden" name="application_id" value={a.id}/>
              <label>Document type<select name="document_type" defaultValue="registration_profile"><option value="registration_profile">Current official SSM business/company profile</option><option value="authority_letter">Representative authority letter</option><option value="registration_certificate">Registration certificate</option><option value="other">Other supporting evidence</option></select></label>
              <label>Private document (PDF, PNG or JPEG; up to 10MB)<input type="file" name="document" accept=".pdf,.png,.jpg,.jpeg" required/></label>
              <button className="button button-outline">Upload verification evidence →</button>
            </form>
            <form action={submitKyb} style={{marginTop:22}}><input type="hidden" name="application_id" value={a.id}/>
              <label style={{display:"block",fontSize:12,marginBottom:14}}><input type="checkbox" name="declaration" value="yes" required/> I confirm I am authorized to act for this organization and the submitted information is accurate.</label>
              <button className="button button-primary">Submit for MARIZ review →</button></form>
          </>}
          {a && ["submitted","under_review"].includes(a.status) && <p className="notice">Your company is under review. No payment is required and no product subscription has been started.</p>}
          {a && a.status==="rejected" && <p className="notice">This application was rejected. Please contact MARIZ support to appeal or correct the submission.</p>}
        </div>}
      </section>;
    })}
    <section className="content-panel"><h2 style={{fontSize:25,marginBottom:12}}>Register another company</h2><p className="footnote">Only create an organization you are authorized to represent. If the company already exists in MARIZ, request an invitation instead of registering it again.</p>
      <form action={createCompany} className="form-grid">
        <label>Jurisdiction<select name="country" defaultValue="MY"><option value="MY">Malaysia (MY)</option></select></label>
        <label>Entity type<select name="entity_type" required defaultValue="company"><option value="company">Sdn Bhd / Berhad</option><option value="sole_proprietor">Sole proprietorship</option><option value="partnership">Partnership</option><option value="llp">LLP / PLT</option><option value="society">Society</option><option value="other">Other legal entity</option></select></label>
        <label>Legal registered name<input name="legal_name" required minLength={3} maxLength={200}/></label>
        <label>SSM / registrar number<input name="registration_no" required minLength={4} maxLength={80}/></label>
        <label className="full">Registered business address<input name="address" required minLength={8} maxLength={700}/></label>
        <label>Business email<input name="business_email" type="email" required/></label>
        <label style={{alignSelf:"end"}}><span><input type="checkbox" name="authority_confirmation" value="yes" required/> I am authorized to register this company.</span></label>
        <button className="button button-primary">Create free company draft →</button>
      </form>
    </section>
    <p style={{marginTop:22}}><Link href="/">← MARIZ Homepage</Link></p>
  </main>;
}
