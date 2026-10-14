import Link from "next/link";
import { redirect } from "next/navigation";
import { marizBackendConfigured, marizServerClient } from "../../../../../lib/mariz/supabase-server";
import { createPosOutlet, createPosStaff, createPosItem, createPosPendingDevice } from "./actions";
import PairingAdminForm from "./pairing-admin-form";
import { enrollPosStaffPin } from "./terminal-security-actions";
import "../../../../pos-v2/pos-v2.css";

export const dynamic="force-dynamic";
export const metadata={title:"MARIZ POS — Company Back Office",robots:{index:false,follow:false}};
type RecordRow={id:string;[key:string]:unknown};
function money(value:unknown){
  const cents=typeof value==="number" && Number.isSafeInteger(value)?value:0;
  return "RM "+(cents/100).toFixed(2);
}

export default async function CompanyPOSBackOffice({
 params,searchParams
}:{
 params:Promise<{organizationId:string}>,
 searchParams:Promise<{notice?:string}>
}){
 const {organizationId:orgId}=await params;
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(orgId))redirect("/co/workspace");
 if(!marizBackendConfigured())return <main className="interior"><h1>MARIZ POS Back Office</h1>
  <p>This protected workspace is awaiting the dedicated V2 database. No operational data is active.</p>
  <Link href="/co/pos/preview">Explore safe POS demo</Link></main>;
 const sb=await marizServerClient();
 const {data:{user},error:authError}=await sb.auth.getUser();
 if(authError||!user)redirect("/co/auth");
 const {data:member,error:memberError}=await sb.from("mariz_memberships")
   .select("member_role,membership_status").eq("organization_id",orgId)
   .eq("user_id",user.id).maybeSingle();
 if(memberError||!member||member.membership_status!=="active"||!["owner","admin"].includes(member.member_role))
   redirect("/co/workspace");
 const {data:organization,error:orgError}=await sb.from("mariz_organizations")
   .select("legal_name,verification_status").eq("id",orgId).maybeSingle();
 if(orgError||!organization||organization.verification_status!=="verified")redirect("/co/workspace");
 const {data:workspace,error:wsError}=await sb.from("mariz_pos_workspaces")
   .select("id,status").eq("organization_id",orgId).maybeSingle();
 if(wsError||!workspace||workspace.status!=="active")return <main className="interior">
    <span className="eyebrow">MARIZ CO / PRODUCT ACCESS</span>
    <h1>MARIZ POS is not yet activated</h1>
    <p>Your verified company account is free. The live POS workspace requires a separate, explicitly accepted product subscription. No subscription or charge was created.</p>
    <p><Link href="/co/pos/preview">Explore the prepared POS demo →</Link></p>
    <Link href="/co/workspace">← Back to MARIZ CO</Link>
   </main>;
 const [outletsQuery,staffQuery,devicesQuery,productsQuery,salesQuery]=await Promise.all([
   sb.from("mariz_pos_outlets").select("id,outlet_name,outlet_status").eq("organization_id",orgId).order("created_at",{ascending:true}).limit(100),
   sb.from("mariz_pos_staff").select("id,staff_name,role,status").eq("organization_id",orgId).order("created_at",{ascending:true}).limit(500),
   sb.from("mariz_pos_devices").select("id,display_name,status,outlet_id").eq("organization_id",orgId).order("created_at",{ascending:true}).limit(200),
   sb.from("mariz_pos_products").select("id,name,price_minor,active").eq("organization_id",orgId).order("created_at",{ascending:true}).limit(200),
   sb.from("mariz_pos_sales").select("id,total_minor,created_at,status").eq("organization_id",orgId).order("created_at",{ascending:false}).limit(50)
 ]);
 const errors=[outletsQuery.error,staffQuery.error,devicesQuery.error,productsQuery.error,salesQuery.error].filter(Boolean);
 if(errors.length)return <main className="interior"><h1>Back Office data unavailable</h1><p>We could not securely retrieve this company's data. No changes have been made.</p><Link href="/co/workspace">Return to MARIZ CO</Link></main>;
 const outlets=(outletsQuery.data||[]) as RecordRow[],staff=(staffQuery.data||[]) as RecordRow[];
 const devices=(devicesQuery.data||[]) as RecordRow[],products=(productsQuery.data||[]) as RecordRow[];
 const sales=(salesQuery.data||[]) as RecordRow[];
 const {notice}=await searchParams;
 return <main className="posv2" style={{minHeight:"100vh"}}>
   <header className="posv2-header"><div className="posv2-brand">
    <img src="/mariz-original-logo.png" alt="MARIZ Point of Sale original logo"/>
    <span><strong>MARIZ POS</strong><small>{String(organization.legal_name)} · Back Office</small></span></div>
    <div className="posv2-head-actions"><Link href="/co/workspace">← MARIZ CO</Link>
     <Link href="/co/pos/preview">Free demo</Link></div></header>
   <div className="posv2-warning">LIVE WORKSPACE FOUNDATION · NO LIVE TERMINAL LOGIN, RECEIPT PRINTING OR PAYMENTS ENABLED</div>
   <div className="posv2-main" style={{maxWidth:1180,margin:"auto"}}>
    <div className="posv2-title"><div><small>VERIFIED COMPANY / AUTHORIZED ADMINISTRATOR</small><h1>POS Back Office</h1></div><span className="posv2-pill">Workspace active</span></div>
    {notice&&<div className="posv2-notice" role="status">{String(notice).slice(0,240)}</div>}
    <div className="posv2-metrics">
     <article><small>Outlets</small><strong>{outlets.length}</strong></article>
     <article><small>Staff</small><strong>{staff.length}</strong></article>
     <article><small>Registered devices</small><strong>{devices.length}</strong></article>
     <article><small>Recorded sales</small><strong>{sales.length}{sales.length===50?"+":""}</strong></article>
    </div>
    <div className="posv2-live-grid">
     <section className="posv2-panel"><h2>Outlets</h2>
      {outlets.map(o=><div className="posv2-row" key={o.id}><strong>{String(o.outlet_name)}</strong><small>{String(o.outlet_status)}</small></div>)}
      <form action={createPosOutlet} className="posv2-form"><input type="hidden" name="organization_id" value={orgId}/>
       <label>Outlet name<input required name="name" minLength={2} maxLength={140} placeholder="e.g. Main Outlet"/></label>
       <button className="posv2-primary">Create outlet</button></form></section>
     <section className="posv2-panel"><h2>Staff records</h2>
      {staff.map(s=><div className="posv2-staff-security" key={s.id}>
       <div className="posv2-row"><strong>{String(s.staff_name)}</strong><small>{String(s.role)} · {String(s.status)}</small></div>
       <form action={enrollPosStaffPin} className="posv2-form">
        <input type="hidden" name="organization_id" value={orgId}/>
        <input type="hidden" name="staff_id" value={String(s.id)}/>
        <label>New staff PIN<input type="password" name="pin" required inputMode="numeric" pattern="[0-9]{6,8}" minLength={6} maxLength={8} autoComplete="new-password" placeholder="6–8 digits"/></label>
        <label>Confirm PIN<input type="password" name="confirm_pin" required inputMode="numeric" pattern="[0-9]{6,8}" minLength={6} maxLength={8} autoComplete="new-password"/></label>
        <button className="posv2-primary">Enroll / rotate PIN</button>
       </form>
      </div>)}
      <form action={createPosStaff} className="posv2-form"><input type="hidden" name="organization_id" value={orgId}/>
       <label>Staff name<input name="name" required minLength={2} maxLength={140}/></label>
       <label>Role<select name="role" defaultValue="cashier"><option value="cashier">Cashier</option><option value="manager">Manager</option><option value="kitchen">Kitchen</option></select></label>
       <button className="posv2-primary">Add staff record</button></form>
      <p>PIN enrollment stores only a salted, pepper-protected hash. Staff sessions are time-limited and revocable; full end-to-end testing is required before live activation.</p></section>
     <section className="posv2-panel"><h2>Products and prices</h2>
      {products.map(p=><div className="posv2-row" key={p.id}><strong>{String(p.name)}</strong><small>{money(p.price_minor)}</small></div>)}
      <form action={createPosItem} className="posv2-form"><input type="hidden" name="organization_id" value={orgId}/>
       <label>Item name<input required name="name" minLength={2} maxLength={140}/></label>
       <label>Price (MYR)<input required name="price" inputMode="decimal" placeholder="16.90"/></label>
       <button className="posv2-primary">Add item</button></form></section>
     <section className="posv2-panel"><h2>Terminal registry</h2>
      {devices.map(d=><div key={d.id} className="posv2-staff-security">
        <div className="posv2-row"><strong>{String(d.display_name)}</strong><small>{String(d.status)}</small></div>
        {d.status==="pending"&&<PairingAdminForm orgId={orgId} deviceId={String(d.id)}/>}
       </div>)}
      <form action={createPosPendingDevice} className="posv2-form"><input type="hidden" name="organization_id" value={orgId}/>
       <label>Outlet<select name="outlet_id" required>{outlets.map(o=><option key={o.id} value={String(o.id)}>{String(o.outlet_name)}</option>)}</select></label>
       <label>Terminal name<input required name="name" minLength={2} maxLength={80} placeholder="Counter 01"/></label>
       <button disabled={outlets.length===0} className="posv2-primary">Register pending device</button></form>
      <p>Pending devices cannot transact. Live device pairing is controlled by the deployment security switch and stays disabled until tested; printer binding remains a later milestone.</p></section>
    </div>
    <section className="posv2-panel" style={{marginTop:20}}><h2>Recent sales</h2>
      {sales.length===0?<p>No live sales yet. Transaction posting is disabled until the sales engine is tested.</p>
       :sales.map(s=><div key={s.id} className="posv2-row"><span>{new Date(String(s.created_at)).toLocaleString("en-MY")}</span><strong>{money(s.total_minor)}</strong><small>{String(s.status)}</small></div>)}
    </section>
   </div>
  </main>;
}
