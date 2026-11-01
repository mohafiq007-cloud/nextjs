import {currentVerifiedUser,coRpc} from '../../../../../../lib/mariz/neon-server';
import {readEvidence,type EvidenceDescriptor} from '../../../../../../lib/mariz/kyb-storage';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  if(!await currentVerifiedUser())return new Response('Sign-in required',{status:401});
  const {id}=await params;if(!/^[a-f0-9-]{36}$/i.test(id))return new Response('Not found',{status:404});
  const meta=await coRpc<EvidenceDescriptor>('api_kyb_document_access',{p_document:id});const bytes=await readEvidence(meta);
  return new Response(Buffer.from(bytes),{headers:{'Content-Type':meta.mime_type,'Content-Disposition':'attachment; filename="company-evidence-'+id+'"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox; default-src 'none'"}});
 }catch{return new Response('Evidence unavailable',{status:404,headers:{'Cache-Control':'no-store'}});}
}
