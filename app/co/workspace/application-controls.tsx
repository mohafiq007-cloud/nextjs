'use client';
import {useId,useState} from 'react';
import {useFormStatus} from 'react-dom';
import {uploadKybEvidence,submitKyb} from './kyb-actions';
import s from './registration-ui.module.css';
function UploadFields({title}:{title:string}){
 const {pending}=useFormStatus(),id=useId();const [file,setFile]=useState(''),[error,setError]=useState('');
 return <fieldset className={s.uploadFields} disabled={pending}>
  <label htmlFor={id}>Choose your {title} file</label><small id={id+'-help'}>PDF, PNG or JPEG · Up to 4 MB per file</small>
  <input className={s.fileInput} id={id} type="file" name="evidence" required accept=".pdf,.png,.jpg,.jpeg" aria-describedby={id+'-help'+(error?' '+id+'-error':'')} aria-invalid={!!error} onChange={e=>{const f=e.target.files?.[0];setFile(f?.name||'');setError(!f?'':f.size<16?'This file appears empty. Choose the original document.':f.size>4194304?'This file is over 4 MB. Choose a smaller file.':!/\.(pdf|png|jpe?g)$/i.test(f.name)?'Choose a PDF, PNG or JPEG.':'');}}/>
  <p className={s.selection} role="status">{pending?'Uploading securely. Please keep this page open…':file?'Selected: '+file+' — not uploaded yet.':'Choose a file, then click Upload below.'}</p>
  {error&&<p id={id+'-error'} role="alert" className={s.error}>{error}</p>}
  <label className={s.consent}><input name="consent" type="checkbox" value="yes" required/><span>I am authorised to provide this document for MARIZ verification.</span></label>
  <button className={s.primary} disabled={pending||!file||!!error}>{pending?'Uploading…':'Upload '+title}</button>
 </fieldset>;
}
export function DocumentUpload({organizationId,applicationId,kind,title}:{organizationId:string;applicationId:string;kind:string;title:string}){return <form action={uploadKybEvidence} className={s.upload}><input type="hidden" name="organization_id" value={organizationId}/><input type="hidden" name="application_id" value={applicationId}/><input type="hidden" name="kind" value={kind}/><UploadFields title={title}/></form>;}
function SendButton({ready,resubmit}:{ready:boolean;resubmit:boolean}){const {pending}=useFormStatus();return <button className={s.primary} disabled={!ready||pending}>{pending?'Sending…':resubmit?'Resubmit for review':'Send for review'}</button>;}
export function SendApplication({organizationId,applicationId,ready,resubmit}:{organizationId:string;applicationId:string;ready:boolean;resubmit:boolean}){return <form action={submitKyb}><input type="hidden" name="organization_id" value={organizationId}/><input type="hidden" name="application_id" value={applicationId}/><SendButton ready={ready} resubmit={resubmit}/></form>;}
