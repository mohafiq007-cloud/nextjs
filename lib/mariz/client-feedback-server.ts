import 'server-only';
import {currentVerifiedUser,neonAuth,myCompanies} from './neon-server';
export type FeedbackCase={id:string;reference:string;product:string;category:string;subject:string;description:string;status:string;createdAt:string;updatedAt:string};
export type FeedbackDetail={case:FeedbackCase;hasOlderMessages:boolean;messages:Array<{sender:string;body:string;createdAt:string}>};
export class FeedbackError extends Error{constructor(public status:number,message:string){super(message);}}
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function feedbackConfigured(){
 try{feedbackOrigin();return true;}catch{return false;}
}
function feedbackOrigin(){
 const origin=new URL(process.env.MARIZ_CO_FEEDBACK_API_ORIGIN||'');
 const environment=process.env.VERCEL_ENV||process.env.NODE_ENV||'';
 const expectedHost=environment==='production'?'mariz-hq-v4.pages.dev':'co-v3-stage2.mariz-hq-v4.pages.dev';
 if(!['production','preview','development'].includes(environment)||origin.protocol!=='https:'||origin.hostname!==expectedHost||origin.username||origin.password||origin.port||origin.pathname!=='/'||origin.search||origin.hash)throw new FeedbackError(503,'Feedback is not connected yet.');
 return origin.origin;
}
async function request<T>(path:string,method='GET',data?:object):Promise<T>{
 const origin=feedbackOrigin(),user=await currentVerifiedUser();if(!user)throw new FeedbackError(401,'Sign in again to continue.');
 const companies=await myCompanies(user.id);if(companies.length!==1)throw new FeedbackError(403,'Your company access could not be confirmed.');
 const token=await neonAuth().token();if(token.error||!token.data?.token)throw new FeedbackError(401,'Sign in again to continue.');
 let response:Response;try{response=await fetch(origin+'/api/co-feedback'+path,{method,headers:{authorization:'Bearer '+token.data.token,accept:'application/json',...(data?{'content-type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{}),redirect:'error',cache:'no-store',signal:AbortSignal.timeout(12000)});}catch{throw new FeedbackError(503,'We could not confirm your request. Please retry using the same form.');}
 if(!response.ok){const safe:Record<number,string>={400:'Check the required fields.',401:'Sign in again to continue.',403:'Your company access could not be confirmed.',404:'Case not found in your company.',409:'This request was already used for different feedback. Open your feedback history before starting again.',429:'Too many messages. Please try again later.'};throw new FeedbackError(response.status,safe[response.status]||'Feedback is temporarily unavailable. Please retry using the same form.');}
 try{return await response.json() as T;}catch{throw new FeedbackError(503,'The response could not be confirmed. Please retry using the same form.');}
}
export async function feedbackHistory(){const data=await request<{cases:FeedbackCase[]}>('');if(!Array.isArray(data.cases))throw new FeedbackError(503,'Feedback history could not be loaded.');return data.cases;}
export async function feedbackCase(id:string){if(!UUID.test(id))throw new FeedbackError(404,'Case not found in your company.');const detail=await request<FeedbackDetail>('/'+id);if(detail.case?.id!==id||!Array.isArray(detail.messages))throw new FeedbackError(503,'This case could not be loaded.');return detail;}
export const createFeedback=(data:{product:string;category:string;subject:string;description:string;requestKey:string})=>request<{id:string;reference?:string}>('','POST',data);
export async function replyFeedback(id:string,data:{message:string;requestKey:string}){if(!UUID.test(id))throw new FeedbackError(404,'Case not found in your company.');return request<{saved:boolean}>('/'+id+'/messages','POST',data);}
