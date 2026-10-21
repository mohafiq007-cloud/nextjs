'use server';
import {randomUUID} from 'node:crypto';import {redirect} from 'next/navigation';
import {currentVerifiedUser,coRpc} from '../../../lib/mariz/neon-server';
import {kybStorageConfigured,storeEvidence,MAX_KYB_BYTES} from '../../../lib/mariz/kyb-storage';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function go(notice:string):never{redirect('/co/workspace?notice='+encodeURIComponent(notice));}
export async function uploadKybEvidence(form:FormData){
 if(!await currentVerifiedUser())go('Verified sign-in required');
 if(!kybStorageConfigured())go('Private document uploads are not enabled');
 const org=String(form.get('organization_id')||''),app=String(form.get('application_id')||''),kind=String(form.get('kind')||'');
 const file=form.get('evidence');
 if(!uuid.test(org)||!uuid.test(app)||!['registration_profile','registration_certificate','authority_letter','other'].includes(kind)||!(file instanceof File)||file.size<16||file.size>MAX_KYB_BYTES||form.get('consent')!=='yes')go('Choose a PDF, PNG or JPEG up to 4 MB and confirm your authority');
 try{
  const state=await coRpc<{application:{id:string;status:string}|null}>('api_kyb_state',{p_organization:org});
  if(state.application?.id!==app||!['draft','needs_information'].includes(state.application.status))go('This application cannot accept evidence');
  const document=randomUUID(),key=org+'/'+app+'/'+document,bytes=new Uint8Array(await file.arrayBuffer());
  const {mime,sha}=await storeEvidence(key,bytes);
  await coRpc('api_add_kyb_document',{p_application:app,p_document:document,p_kind:kind,p_storage_key:key,p_mime:mime,p_size:String(bytes.length),p_sha:sha});
 }catch{go('Evidence could not be recorded. Your company is not approved; retry or contact support.');}
 go('Private evidence uploaded. Submit the application when all documents are ready.');
}
export async function submitKyb(form:FormData){
 if(!await currentVerifiedUser())go('Verified sign-in required');
 const app=String(form.get('application_id')||'');if(!uuid.test(app))go('Invalid application');
 try{await coRpc('api_submit_kyb',{p_application:app});}catch{go('Submission requires an official registration profile and an editable application.');}
 go('Verification application submitted for MARIZ review. No product or payment has been activated.');
}
