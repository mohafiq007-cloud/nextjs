import { marizServerClient,marizBackendConfigured } from "../../../lib/mariz/supabase-server";
import { recordCheck,decideKyb } from "./actions";
import { redirect } from "next/navigation";

export const dynamic="force-dynamic";
const requiredChecks=["registry","identity","authority","documents","duplicate","contact"] as const;
type Application={id:string;organization_id:string;status:string;submitted_at:string|null};
type Company={id:string;legal_name:string;registration_no:string;entity_type:string};
type Doc={id:string;application_id:string;document_type:string;storage_path:string};

export default async function AdminKyb({searchParams}:{searchParams:Promise<{notice?:string}>}){
 if(!marizBackendConfigured())return <main className="interior"><h1>MARIZ Admin — KYB</h1><p>Reviewer access is disabled while V2 backend is not configured.</p></main>;
 const sb=await marizServerClient();
 const {data:{user}}=await sb.auth.getUser();
 if(!user)redirect("/co/auth");
 const {data:reviewer}=await sb.rpc("mariz_my_reviewer_status");
 if(reviewer!==true) return <main className="interior"><h1>Restricted administration</h1><p>This account has no MARIZ KYB reviewer grant.</p></main>;
 const {data:apps}=await sb.from("mariz_kyb_applications").select("id,organization_id,status,submitted_at")
  .in("status",["submitted","under_review"]).order("submitted_at",{ascending:true}).limit(30);
 const items=(apps||[]) as Application[];
 const orgIds=[...new Set(items.map(a=>a.organization_id))];
 const {data:orgs}=orgIds.length?await sb.from("mariz_organizations")
  .select("id,legal_name,registration_no,entity_type").in("id",orgIds):{data:[]};
 const orgMap=new Map(((orgs||[]) as Company[]).map(o=>[o.id,o]));
 const appIds=items.map(a=>a.id);
 const {data:docRows}=appIds.length?await sb.from("mariz_kyb_documents")
  .select("id,application_id,document_type,storage_path").in("application_id",appIds):{data:[]};
 const docs=(docRows||[]) as Doc[];
 const {notice}=await searchParams;
 return <main className="interior">
  <div className="interior-head"><span className="eyebrow">MARIZ ADMIN / PRIVATE REVIEWER TERMINAL</span>
   <h1>Company verification.</h1><p>For authorized KYB reviewers only. Approval requires six completed checks and a recorded decision reason. Never approve an application that you belong to.</p></div>
  {notice&&<div className="notice">{notice.slice(0,240)}</div>}
  {items.length===0&&<div className="content-panel"><h2>No applications awaiting review</h2></div>}
  {items.map(a=><section className="content-panel" key={a.id} style={{marginBottom:22}}>
   <div className="panel-top"><div><span className="eyebrow">{orgMap.get(a.organization_id)?.entity_type || "ENTITY"} · {orgMap.get(a.organization_id)?.registration_no || ""}</span>
    <h2>{orgMap.get(a.organization_id)?.legal_name || "Company"}</h2><small>{a.id}</small></div><span className="tag amber">{a.status}</span></div>
   <div style={{marginBottom:18}}><strong>Evidence files</strong>
    {docs.filter(d=>d.application_id===a.id).map(d=><div key={d.id} className="document-row">
     <span>{d.document_type}</span><code style={{marginLeft:"auto",fontSize:10}}>Private: {d.id.slice(0,8)}</code>
    </div>)}
    <p className="footnote">Document bytes are private and require an authorized, audited reviewer-view action. This first review interface intentionally does not expose raw file URLs.</p>
   </div>
   <strong style={{fontSize:14}}>Verification checks</strong>
   <div className="form-grid" style={{margin:"15px 0"}}>
    {requiredChecks.map(c=><form action={recordCheck} className="content-panel" key={c} style={{padding:14,minHeight:0,borderRadius:8}}>
     <input type="hidden" name="application" value={a.id}/><input type="hidden" name="check_code" value={c}/>
     <strong style={{fontSize:12,textTransform:"capitalize"}}>{c}</strong>
     <select name="result" required defaultValue="needs_review" style={{margin:"12px 0",padding:11,border:"1px solid #ddd",borderRadius:6}}>
      <option value="needs_review">Needs review</option><option value="pass">Pass</option><option value="fail">Fail</option>
     </select>
     <input name="notes" maxLength={2000} placeholder="Reviewer notes (optional)" style={{padding:10,border:"1px solid #ddd",borderRadius:6}}/>
     <button className="button button-outline" style={{marginTop:12}}>Save check</button>
    </form>)}
   </div>
   <form action={decideKyb} className="form-grid" style={{borderTop:"1px solid #e2eee4",paddingTop:20}}>
    <input type="hidden" name="application" value={a.id}/>
    <label>Decision<select name="decision" required defaultValue="needs_information">
      <option value="needs_information">Request more information</option>
      <option value="approved">Approve after six passed checks</option>
      <option value="rejected">Reject</option></select></label>
    <label>Decision reason<input name="reason" required minLength={4} maxLength={2000} placeholder="Explain the review decision"/></label>
    <button className="button button-primary">Record decision →</button>
   </form>
  </section>)}
  </main>;
}
