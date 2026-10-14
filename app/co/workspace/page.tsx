import Link from "next/link";
import {redirect} from "next/navigation";
import {getVerifiedNeonUser,neonBackendConfigured} from "../../../lib/mariz/neon-auth-server";
import {neonDatabase} from "../../../lib/mariz/neon-db";
import {createCompany,startKyb} from "./actions";
import {signOut} from "../auth/actions";

export const dynamic="force-dynamic";
type Company={organization_id:string;legal_name:string;registration_no:string;verification_status:string;entity_type:string;kyb_id:string|null;kyb_status:string|null;pos_status:string|null};
export default async function Workspace({searchParams}:{searchParams:Promise<{message?:string}>}){
 if(!neonBackendConfigured())return <main className="interior"><h1>MARIZ CO</h1><p>Secure Neon company access is not active on this preview yet. No registration data is collected.</p><Link href="/co/auth">Company access</Link></main>;
 const user=await getVerifiedNeonUser();
 if(!user)redirect("/co/auth?message=Verify%20your%20email%20before%20accessing%20MARIZ%20CO");
 const sql=neonDatabase();
 const companies=(await sql.query(
  'SELECT c.organization_id,c.legal_name,c.registration_no,c.verification_status,c.entity_type,a.id AS kyb_id,a.status AS kyb_status,e.status AS pos_status FROM mariz_core.company_profiles c JOIN neon_auth.member m ON m."organizationId"=c.organization_id LEFT JOIN LATERAL (SELECT id,status FROM mariz_core.kyb_applications WHERE organization_id=c.organization_id ORDER BY created_at DESC LIMIT 1) a ON true LEFT JOIN mariz_core.product_entitlements e ON e.organization_id=c.organization_id AND e.product_code=$2 WHERE m."userId"=$1::uuid ORDER BY c.created_at DESC',[user.id,"pos"])) as Company[];
 const {message}=await searchParams;
 return <main className="interior">
  <div className="interior-head"><span className="eyebrow">MARIZ CO / FREE COMPANY GATEWAY</span>
   <h1>Your company workspace.</h1>
   <p>Register your company once, complete legal verification and explore the prepared POS demo. Registration is free; live MARIZ POS activation requires a separate paid agreement.</p></div>
  <form action={signOut} style={{marginBottom:22}}><button className="button button-outline">Sign out</button></form>
  {message&&<div className="notice" role="status">{message.slice(0,240)}</div>}
  {companies.map(c=><section key={c.organization_id} className="content-panel" style={{marginBottom:22}}>
   <div className="panel-top"><div><span className="eyebrow">{c.entity_type.toUpperCase()} · {c.registration_no}</span>
    <h2>{c.legal_name}</h2></div><span className={"tag "+(c.verification_status==="verified"?"green":"amber")}>{c.verification_status}</span></div>
   {c.verification_status==="verified"?<div>
    <p>Your organization is verified. Enjoy the unlimited prepared MARIZ POS demo. Live product billing and activation are separate.</p>
    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}><Link className="button button-outline" href="/co/pos/preview">Explore free POS demo →</Link>
    {c.pos_status==="active"&&<Link className="button button-primary" href={"/co/pos/"+c.organization_id+"/backoffice"}>Open activated Back Office →</Link>}</div>
   </div>:<div>
    <p>KYB application: <strong>{c.kyb_status||"Not yet started"}</strong></p>
    {!c.kyb_id&&<form action={startKyb}><input type="hidden" name="organization_id" value={c.organization_id}/><button className="button button-primary">Start KYB →</button></form>}
    {c.kyb_id&&["draft","needs_information"].includes(c.kyb_status||"")&&<div className="notice">
     This application is a draft. Official SSM evidence upload is being integrated with Neon's private storage; submission and approval will remain blocked until that process is secure.
    </div>}
    {["submitted","under_review"].includes(c.kyb_status||"")&&<p className="notice">Your company is awaiting MARIZ review.</p>}
   </div>}
  </section>)}
  <section className="content-panel">
   <h2 style={{fontSize:25,marginBottom:10}}>Register a company for free</h2>
   <p className="footnote">Only register an organization you are authorized to represent. This does not activate or charge for MARIZ POS.</p>
   <form action={createCompany} className="form-grid">
    <label>Jurisdiction<select name="country" defaultValue="MY"><option value="MY">Malaysia</option></select></label>
    <label>Entity type<select name="entity_type" defaultValue="company">
     <option value="company">Sdn Bhd / Berhad</option><option value="sole_proprietor">Sole proprietorship</option>
     <option value="partnership">Partnership</option><option value="llp">LLP / PLT</option>
     <option value="society">Society</option><option value="other">Other legal entity</option>
    </select></label>
    <label>Registered legal name<input name="legal_name" required minLength={3} maxLength={200}/></label>
    <label>SSM registration number<input name="registration_no" required minLength={4} maxLength={80}/></label>
    <label className="full">Registered address<input name="address" required minLength={8} maxLength={700}/></label>
    <label>Business email<input type="email" name="business_email" required/></label>
    <label style={{alignSelf:"end"}}><span><input type="checkbox" name="authority_confirmation" value="yes" required/> I am authorized to register this company.</span></label>
    <button className="button button-primary">Create free company profile →</button>
   </form>
  </section>
 </main>;
}
