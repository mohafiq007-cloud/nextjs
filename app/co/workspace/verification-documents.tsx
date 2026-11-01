import {uploadKybEvidence,submitKyb} from './kyb-actions';
import styles from './kyb-panel.module.css';
type Document={id:string;kind:string;status:string;size_bytes:number};
export type KybState={application:{id:string;status:string;submitted_at?:string;resubmission_count?:number}|null;review_message?:{decision:string;reason:string;at:string}|null;documents:Document[]};
const statusLabel=(status:string)=>({uploaded:'Uploaded — awaiting review',accepted:'Accepted',rejected:'Rejected — upload a corrected document'}[status]||status);
export default function VerificationDocuments({organizationId,state,uploadsEnabled}:{organizationId:string;state:KybState;uploadsEnabled:boolean}){
 if(!state.application)return null;
 if(state.application.status==='approved')return state.review_message?<section className={styles.panel} aria-label="MARIZ approval message"><h3>Company approved</h3><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{state.review_message.reason}</p></section>:null;
 const app=state.application,editable=['draft','needs_information'].includes(app.status)&&uploadsEnabled;
 const has=(kind:string)=>state.documents.some(d=>d.kind===kind&&['uploaded','accepted'].includes(d.status));
 const ready=has('registration_profile');
 const groups=[
  {kind:'registration_profile',title:'1. Business registration (SSM)',help:'Upload your SSM business profile showing the registered business name, registration number and owner or directors. This is the business document, not an IC.',file:'SSM business registration file',button:'Upload SSM document',required:true},
  {kind:'identity_document',title:'2. Owner / representative identity (IC)',help:'Optional at submission. Upload the IC of the owner or authorised representative now, or provide it later if MARIZ requests it. Do not upload the SSM document here.',file:'Owner / representative IC file',button:'Upload IC document',required:false},
  {kind:'authority_letter',title:'Supporting document: authorisation letter',help:'If you are acting for the business, upload a letter showing that you are authorised to submit this application. Business owners do not need this extra upload unless the reviewer requests it.',file:'Authorisation letter file',button:'Upload authorisation letter',required:false},
 ];
 const list=(docs:Document[])=>docs.length?<ul className={styles.files}>{docs.map((d,i)=><li key={d.id}><a href={'/api/co/kyb/document/'+d.id}>File {i+1} · {Math.ceil(d.size_bytes/1024)} KB</a><span>{statusLabel(d.status)}</span></li>)}</ul>:<p className={styles.missing}>No file uploaded yet.</p>;
 return <div className={styles.panel}><h3>Documents for company verification</h3>
  {state.review_message&&<section className={styles.step} aria-label="MARIZ review message"><h4>{app.status==='needs_information'?'Changes requested by MARIZ':'Latest message from MARIZ'}</h4><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{state.review_message.reason}</p>{app.status==='needs_information'&&<p>Upload corrected or missing documents below. When all requested changes are ready, choose Resubmit for review. Uploading a file alone does not send the application back.</p>}</section>}
  {app.status==='submitted'&&(app.resubmission_count||0)>0&&<p role="status">Your changes have been resubmitted. MARIZ will review your updated application.</p>}
  <p>Upload the required SSM business profile. The owner / representative IC is optional at submission and may be requested during review.</p>
  {groups.map(group=><section className={styles.step} key={group.kind} aria-label={group.title}>
   <div className={styles.heading}><h4>{group.title}</h4><span>{group.required?(has(group.kind)?'Uploaded':'Required'):'If applicable'}</span></div>
   <p>{group.help}</p>{list(state.documents.filter(d=>d.kind===group.kind))}
   {editable&&<form action={uploadKybEvidence} className={styles.form}>
    <input type="hidden" name="organization_id" value={organizationId}/><input type="hidden" name="application_id" value={app.id}/><input type="hidden" name="kind" value={group.kind}/>
    <label>{group.file}<input type="file" name="evidence" required accept=".pdf,.png,.jpg,.jpeg"/><small>PDF, PNG or JPEG · Maximum 4 MB per file. Upload another file only for an additional page or a correction.</small></label>
    <label className={styles.consent}><input type="checkbox" name="consent" value="yes" required/><span>I am authorised to provide this document for private MARIZ verification.</span></label>
    <button className="button button-outline">{group.button}</button>
   </form>}
  </section>)}
  {state.documents.some(d=>!groups.some(g=>g.kind===d.kind))&&<section className={styles.step}><h4>Previously uploaded supporting documents</h4>{list(state.documents.filter(d=>!groups.some(g=>g.kind===d.kind)))}<p>These files retain their original category. They do not replace the required SSM business profile.</p></section>}
  {editable?<div className={styles.submit}><h4>3. {app.status==='needs_information'?'Resubmit your changes':'Submit for review'}</h4><p>{ready?'The required SSM business profile is uploaded. You may submit now; the IC can be provided later if requested.':'Upload the SSM business profile before submitting.'}</p><form action={submitKyb}><input type="hidden" name="application_id" value={app.id}/><button className="button button-primary" disabled={!ready}>{app.status==='needs_information'?'Resubmit for review':'Submit documents for review'}</button></form></div>:<p>Application status: {app.status.replaceAll('_',' ')}. {uploadsEnabled?'Uploads are locked during review. If more documents are needed, MARIZ will return the application with a request.':'Private uploads are temporarily unavailable.'}</p>}
  <p className="footnote">Documents are private, access-controlled and audited. Upload only the requested records. Submission does not approve the company or activate a paid service. <a href="/co/privacy">Registration privacy notice</a></p>
 </div>;
}
