import 'server-only';
import {createHash,createHmac,randomUUID} from 'node:crypto';
export function decisionProof(actor:string,application:string,decision:string,reason:string){
 const secret=process.env.MARIZ_KYB_STEP_UP_SECRET;
 if(!secret||secret.length<43)throw Error('Reviewer verification unavailable');
 const expiry=String(Math.floor(Date.now()/1000)+60),nonce=randomUUID();
 const payload=[actor,application,decision,createHash('sha256').update(reason).digest('hex'),expiry,nonce].join('\n');
 return {p_expiry:expiry,p_nonce:nonce,p_mac:createHmac('sha256',secret).update(payload).digest('hex')};
}
