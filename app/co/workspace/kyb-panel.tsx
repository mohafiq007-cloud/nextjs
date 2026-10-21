import {coRpc} from '../../../lib/mariz/neon-server';
import {kybStorageConfigured} from '../../../lib/mariz/kyb-storage';
import {uploadKybEvidence,submitKyb} from './kyb-actions';
type State={application:{id:string;status:string}|null;documents:{id:string;kind:string;status:string;size_bytes:number}[]};
export default async function KybPanel({organizationId}:{organizationId:string}){
 let state:State;try{state=await coRpc<State>('api_kyb_state',{p_organization:organizationId});}catch{return <p>Verification details are temporarily unavailable. Refresh to retry.</p>;}
 if(!state.application)return null;const app=state.application;
 return <div><h3>Company verification documents</h3>
  {state.documents.map(d=><p key={d.id}><a href={'/api/co/kyb/document/'+d.id}>{d.kind.replaceAll('_',' ')} — {d.status} ({Math.ceil(d.size_bytes/1024)} KB)</a></p>)}
  {['draft','needs_information'].includes(app.status)&&kybStorageConfigured()?<>
   <form action={uploadKybEvidence} className="form-grid">
    <input type="hidden" name="organization_id" value={organizationId}/><input type="hidden" name="application_id" value={app.id}/>
    <label>Document type<select name="kind"><option value="registration_profile">Official registration profile</option><option value="registration_certificate">Registration certificate</option><option value="authority_letter">Authority letter</option><option value="other">Other evidence</option></select></label>
    <label>Evidence file (PDF, PNG, JPEG; maximum 4 MB)<input type="file" name="evidence" required accept=".pdf,.png,.jpg,.jpeg"/></label>
    <label><span><input type="checkbox" name="consent" value="yes" required/> I am authorized to provide this company evidence for private MARIZ verification.</span></label>
    <button className="button button-outline">Upload private evidence</button>
   </form>
   <form action={submitKyb} style={{marginTop:16}}><input type="hidden" name="application_id" value={app.id}/><button className="button button-primary">Submit for review</button></form>
  </>:<p>Application status: {app.status}. Private uploads {kybStorageConfigured()?'are locked while this application is reviewed.':'are not enabled.'}</p>}
  <p className="footnote">Evidence is private, access-controlled and audited. Upload only necessary company records. Review is manual; uploading does not approve the company or activate a paid service. <a href="/co/privacy">Registration privacy notice</a></p>
 </div>;
}
