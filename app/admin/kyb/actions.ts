'use server';
import {redirect} from 'next/navigation';
import {coRpc,currentVerifiedUser,neonAuth} from '../../../lib/mariz/neon-server';
import {decisionProof} from '../../../lib/mariz/kyb-step-up';
import {neonErrorCategory} from '../../../lib/mariz/neon-error-category.mjs';
import {readEvidence,type EvidenceDescriptor} from '../../../lib/mariz/kyb-storage';
function go(message:string):never{redirect('/admin/kyb?notice='+encodeURIComponent(message));}
function id(value:FormDataEntryValue|null){const result=String(value||'');if(!/^[a-f0-9-]{36}$/i.test(result))go('Invalid reference');return result;}
async function reviewer(){if(!await currentVerifiedUser()||!await coRpc<boolean>('api_kyb_reviewer_status'))go('Reviewer access required');}
export async function recordCheck(form:FormData){
 await reviewer();const app=id(form.get('application')),code=String(form.get('check_code')||''),result=String(form.get('result')||''),note=String(form.get('notes')||'').slice(0,2000);
 if(!['registry','identity','authority','documents','duplicate','contact'].includes(code)||!['pass','fail','needs_review'].includes(result))go('Invalid check');
 try{await coRpc('api_record_kyb_check',{p_application:app,p_code:code,p_result:result,p_note:note});}catch{go('Check denied. Verify reviewer authority and conflict-of-interest rules.');}
 go('Verification check recorded');
}
export async function reviewDocument(form:FormData){
 await reviewer();const document=id(form.get('document')),status=String(form.get('status')||'');
 if(!['accepted','rejected'].includes(status))go('Invalid evidence review');
 try{
  const meta=await coRpc<EvidenceDescriptor>('api_kyb_document_access',{p_document:document});
  await readEvidence(meta);
  await coRpc('api_accept_kyb_document',{p_document:document,p_status:status});
 }catch{go('Evidence review denied or stored bytes failed integrity verification.');}
 go('Evidence review recorded');
}
export async function decideKyb(form:FormData){
 await reviewer();const app=id(form.get('application')),decision=String(form.get('decision')||''),reason=String(form.get('reason')||'').trim();
 if(!['approved','rejected','needs_information'].includes(decision)||reason.length<4||reason.length>2000)go('A valid decision and reason are required');
 const user=await currentVerifiedUser(),otp=String(form.get('otp')||'').trim();
 if(!user||!/^\d{6}$/.test(otp))go('Request and enter a fresh reviewer email code');
 try{
  const {data,error}=await neonAuth().signIn.emailOtp({email:user.email,otp});
  if(error||!data?.user||data.user.id!==user.id){console.error('MARIZ_CO_STEP_UP_IDENTITY_FAILED',typeof error?.code==='string'&&/^[A-Za-z_]{3,70}$/.test(error.code)?error.code:'identity_mismatch');throw Error('Reviewer verification failed');}
  await coRpc('api_decide_kyb_step_up',{p_application:app,p_decision:decision,p_reason:reason,...decisionProof(user.id,app,decision,reason)});
 }catch(error){console.error('MARIZ_CO_DECISION_FAILED',neonErrorCategory(error));go('Decision denied. Use a fresh reviewer code. Approval also needs six passed checks and accepted official registration evidence.');}
 go('KYB decision recorded. No subscription was activated.');
}
export async function requestReviewerCode(){
 await reviewer();const user=await currentVerifiedUser();if(!user)go('Reviewer access required');
 try{const {error}=await neonAuth().emailOtp.sendVerificationOtp({email:user.email,type:'sign-in'});if(error)throw Error('Provider denied');}catch{go('Reviewer verification email unavailable. No decision was made.');}
 go('Reviewer code requested. Enter it with your final decision. Each code can be used once.');
}
