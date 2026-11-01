'use server';
import {createHash,randomUUID} from 'node:crypto';import {redirect} from 'next/navigation';
import {currentVerifiedUser,coRpc} from '../../../lib/mariz/neon-server';
import {kybStorageConfigured,storeEvidence,MAX_KYB_BYTES} from '../../../lib/mariz/kyb-storage';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function go(notice:string,org=''):never{const query=new URLSearchParams({notice});if(uuid.test(org))query.set('company',org);redirect('/co/workspace?'+query.toString());}
export async function uploadKybEvidence(form:FormData){
 const org=String(form.get('organization_id')||''),app=String(form.get('application_id')||''),kind=String(form.get('kind')||'');
 if(!await currentVerifiedUser())go('Verified sign-in required');
 if(!kybStorageConfigured())go('Private uploads are temporarily unavailable. Please try again later.',org);
 const file=form.get('evidence');
 if(!uuid.test(org)||!uuid.test(app)||!['registration_profile','identity_document','authority_letter'].includes(kind)||!(file instanceof File)||file.size<16||file.size>MAX_KYB_BYTES||form.get('consent')!=='yes')go('Choose a PDF, PNG or JPEG up to 4 MB and confirm your authority.',org);
 try{
  const state=await coRpc<{application:{id:string;status:string}|null;documents:{sha256_hex?:string}[]}>('api_kyb_state',{p_organization:org});
  if(state.application?.id!==app||!['draft','needs_information'].includes(state.application.status))go('This application is with MARIZ and cannot accept uploads right now.',org);
  const document=randomUUID(),key=org+'/'+app+'/'+document,bytes=new Uint8Array(await file.arrayBuffer());
  const fingerprint=createHash('sha256').update(bytes).digest('hex');
  if(state.documents.some(d=>d.sha256_hex===fingerprint))go('This exact file is already saved. View it below; only upload a different page or a corrected file.',org);
  const {mime,sha}=await storeEvidence(key,bytes);
  await coRpc('api_add_kyb_document',{p_application:app,p_document:document,p_kind:kind,p_storage_key:key,p_mime:mime,p_size:String(bytes.length),p_sha:sha});
 }catch(error){
  if(error instanceof Error&&'digest' in error&&String(error.digest).startsWith('NEXT_REDIRECT'))throw error;
  const failure=error as {name?:string;Code?:string;$metadata?:{httpStatusCode?:number}};
  console.error('co_kyb_upload_failure',JSON.stringify({name:failure.name||'Unknown',code:failure.Code||null,httpStatus:failure.$metadata?.httpStatusCode||null}));
  go('The file could not be saved. Check the format and size, then try again. Your saved documents are unchanged.',org);
 }
 go(kind==='registration_profile'?'SSM saved. Check it below, then choose Send for review or Resubmit for review. IC is optional.':'Document saved. Check your files below, then send or resubmit your application for review.',org);
}
export async function submitKyb(form:FormData){
 if(!await currentVerifiedUser())go('Verified sign-in required');
 const org=String(form.get('organization_id')||''),app=String(form.get('application_id')||'');if(!uuid.test(app))go('Invalid application');
 try{await coRpc('api_submit_kyb',{p_application:app});}catch{go('Your application was not sent. Check that your SSM business profile is saved and any required corrections are complete. IC is optional.',org);}
 go('Application sent to MARIZ. No further action is needed unless we request changes.',org);
}
