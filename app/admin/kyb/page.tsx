import {redirect} from 'next/navigation';
import {coRpc,currentVerifiedUser,neonEnabled} from '../../../lib/mariz/neon-server';
import {recordCheck,decideKyb,reviewDocument,requestReviewerCode} from './actions';
import {neonErrorCategory} from '../../../lib/mariz/neon-error-category.mjs';
export const dynamic='force-dynamic';
type Application={id:string;organization_id:string;status:string;legal_name:string;registration_no:string;documents:{id:string;kind:string;status:string}[];checks:{code:string;result:string;at:string}[]};
const requiredChecks=['registry','identity','authority','documents','duplicate','contact'];
export default async function AdminKyb({searchParams}:{searchParams:Promise<{notice?:string}>}){
 if(!neonEnabled())return <main className="interior"><h1>MARIZ KYB</h1><p>Reviewer access is disabled.</p></main>;
 if(!await currentVerifiedUser())redirect('/co/auth');
 let items:Application[]=[],reviewer=false,failed=false;
 try{reviewer=await coRpc<boolean>('api_kyb_reviewer_status');if(reviewer)items=await coRpc<Application[]>('api_kyb_review_queue');}
 catch(error){console.error('MARIZ_CO_REVIEW_LOOKUP_FAILED',neonErrorCategory(error));failed=true;}
 if(failed)return <main className="interior"><h1>Review service unavailable</h1><p>No decision was made. Refresh to retry.</p></main>;
 if(!reviewer)return <main className="interior"><h1>Restricted administration</h1><p>This account has no MARIZ reviewer grant.</p></main>;
 const {notice}=await searchParams;
 return <main className="interior"><h1>Company verification</h1><p>Manual review only. Never approve a company you belong to. Verify official evidence and all six checks; approval does not activate a paid product.</p>
 {notice&&<p role="status" className="notice">{notice.slice(0,240)}</p>}
 <form action={requestReviewerCode}><button className="button button-outline">Send reviewer verification code</button></form>
 {!items.length&&<p>No applications awaiting independent review.</p>}
 {items.map(a=><section key={a.id} className="content-panel" style={{marginBottom:24}}><h2>{a.legal_name}</h2><p>{a.registration_no} · {a.status}</p>
  <h3>Private evidence</h3>{a.documents.map(d=><div key={d.id}><a href={'/api/co/kyb/document/'+d.id}>Download {d.kind.replaceAll('_',' ')}</a><span> — {d.status}</span>
   <form action={reviewDocument}><input type="hidden" name="document" value={d.id}/><select aria-label="Evidence review status" name="status" defaultValue="rejected"><option value="rejected">Reject evidence</option><option value="accepted">Accept after manual review</option></select><button className="button button-outline">Record evidence review</button></form></div>)}
  <h3>Required checks</h3><div className="form-grid">{requiredChecks.map(code=><form key={code} action={recordCheck} className="content-panel"><input type="hidden" name="application" value={a.id}/><input type="hidden" name="check_code" value={code}/><strong>{code}</strong>
   <p>{a.checks.filter(c=>c.code===code).sort((x,y)=>y.at.localeCompare(x.at))[0]?.result||'Not checked'}</p>
   <select aria-label={code+" result"} name="result" defaultValue="needs_review"><option value="needs_review">Needs review</option><option value="pass">Pass</option><option value="fail">Fail</option></select><input aria-label={code+" reviewer notes"} name="notes" maxLength={2000} placeholder="Reviewer notes"/><button className="button button-outline">Save check</button></form>)}</div>
  <form action={decideKyb} className="form-grid"><input type="hidden" name="application" value={a.id}/><label>Decision<select aria-label="Decision" name="decision" defaultValue="needs_information"><option value="needs_information">Request information</option><option value="approved">Approve after all checks</option><option value="rejected">Reject</option></select></label><label>Reason<input name="reason" required minLength={4} maxLength={2000}/></label><label>Fresh reviewer email code<input name="otp" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code"/></label><button className="button button-primary">Record final decision</button></form>
 </section>)}</main>;
}
