import Link from "next/link";
import { redirect } from "next/navigation";
import { marizBackendConfigured, marizServerClient } from "../../../lib/mariz/supabase-server";

export const dynamic="force-dynamic";
export const metadata={title:"MARIZ POS | Back Office",robots:{index:false,follow:false}};

type Workspace={id:string;organization_id:string;workspace_status:string};
type Organization={id:string;legal_name:string;verification_status:string};
type Outlet={id:string;workspace_id:string;outlet_name:string;outlet_code:string;outlet_status:string};
type Staff={id:string;workspace_id:string;display_name:string;role:string;staff_status:string};
type Terminal={id:string;workspace_id:string;terminal_label:string;device_status:string};

export default async function PosBackOffice(){
 if(!marizBackendConfigured())return <main className="interior">
  <div className="interior-head"><span className="eyebrow">MARIZ POS / BACK OFFICE</span><h1>POS Back Office</h1><p>Dedicated V2 database is not provisioned yet. No real company, outlet or staff records can be created in this preview.</p></div>
  <div className="content-panel"><h2>Explore the interface</h2><p>Use the isolated workflow simulator to review outlet setup, staff permissions, terminal enrollment and staff login.</p><Link className="button button-primary" href="/co/pos/preview">Open setup prototype →</Link></div>
 </main>;
 const sb=await marizServerClient();
 const {data:{user},error:authError}=await sb.auth.getUser();
 if(authError||!user)redirect("/co/auth");
 const {data:memberships,error:memberError}=await sb.from("mariz_memberships").select("organization_id,member_role").eq("user_id",user.id).eq("membership_status","active").in("member_role",["owner","admin"]);
 if(memberError) return <main className="interior"><h1>Workspace temporarily unavailable</h1><p>Please contact MARIZ support.</p></main>;
 const orgIds=[...new Set((memberships||[]).map(x=>x.organization_id))];
 const {data:orgRows}=orgIds.length?await sb.from("mariz_organizations").select("id,legal_name,verification_status").in("id",orgIds):{data:[]};
 const orgs=(orgRows||[]) as Organization[];
 const verifiedIds=orgs.filter(x=>x.verification_status==="verified").map(x=>x.id);
 const {data:workspaceRows,error:workspaceError}=verifiedIds.length?await sb.from("mariz_pos_workspaces").select("id,organization_id,workspace_status").in("organization_id",verifiedIds):{data:[],error:null};
 if(workspaceError) return <main className="interior"><h1>MARIZ POS activation unavailable</h1><p>The isolated POS schema is not yet active. No production POS has been connected.</p></main>;
 const workspaces=(workspaceRows||[]) as Workspace[];
 const wsIds=workspaces.map(x=>x.id);
 const [outletRes,staffRes,terminalRes]=await Promise.all([
  wsIds.length?sb.from("mariz_pos_outlets").select("id,workspace_id,outlet_name,outlet_code,outlet_status").in("workspace_id",wsIds):Promise.resolve({data:[]}),
  wsIds.length?sb.from("mariz_pos_staff").select("id,workspace_id,display_name,role,staff_status").in("workspace_id",wsIds):Promise.resolve({data:[]}),
  wsIds.length?sb.from("mariz_pos_terminal_devices").select("id,workspace_id,terminal_label,device_status").in("workspace_id",wsIds):Promise.resolve({data:[]}),
 ]);
 const outlets=(outletRes.data||[]) as Outlet[];
 const staff=(staffRes.data||[]) as Staff[];
 const terminals=(terminalRes.data||[]) as Terminal[];
 return <main className="interior">
  <div className="interior-head"><span className="eyebrow">MARIZ CO / MARIZ POS</span><h1>POS Back Office</h1><p>Company-managed access to outlets, staff roles and registered store terminals. Only verified organizations and authorized company administrators can view their own workspaces.</p></div>
  {workspaces.length===0?<div className="content-panel"><h2>No activated MARIZ POS workspace</h2><p>Registration in MARIZ CO is free. A live POS workspace is only provisioned when you intentionally activate a paid product under the agreed terms.</p><Link href="/co/pos/preview" className="button button-primary">Explore the free POS setup demo →</Link></div>
   : workspaces.map(w=><section className="content-panel" key={w.id} style={{marginBottom:20}}>
    <div className="panel-top"><div><span className="eyebrow">MARIZ POS / COMPANY</span><h2>{orgs.find(o=>o.id===w.organization_id)?.legal_name || "Company"}</h2></div><span className="tag green">{w.workspace_status}</span></div>
    <div className="metrics"><div><small>OUTLETS</small><strong>{outlets.filter(x=>x.workspace_id===w.id).length}</strong></div>
     <div><small>STAFF RECORDS</small><strong>{staff.filter(x=>x.workspace_id===w.id).length}</strong></div>
     <div><small>REGISTERED TERMINALS</small><strong>{terminals.filter(x=>x.workspace_id===w.id).length}</strong></div></div>
    <h3 style={{marginTop:30}}>Outlets</h3>{outlets.filter(x=>x.workspace_id===w.id).length===0?<p>No outlets provisioned.</p>:outlets.filter(x=>x.workspace_id===w.id).map(x=><div className="document-row" key={x.id}><strong>{x.outlet_name} ({x.outlet_code})</strong><span className="tag">{x.outlet_status}</span></div>)}
    <h3 style={{marginTop:25}}>Terminals</h3>{terminals.filter(x=>x.workspace_id===w.id).length===0?<p>No terminals registered.</p>:terminals.filter(x=>x.workspace_id===w.id).map(x=><div className="document-row" key={x.id}><strong>{x.terminal_label}</strong><span className="tag">{x.device_status}</span></div>)}
    <p className="footnote">Device enrollment, PIN issuance, sales and payment writes remain disabled until V2 provisioning and security tests pass. Legacy Shahira POS is not connected to this workspace.</p>
   </section>)}
  <p style={{marginTop:25}}><Link href="/co/workspace">← MARIZ CO</Link> · <Link href="/co/pos/preview">Test POS workflow</Link></p>
 </main>;
}
