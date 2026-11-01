// Same Cloudflare Access issuer/audience/allowlist boundary as the existing inbox.
import {createRemoteJWKSet,jwtVerify} from 'jose';
export async function authorizeAdmin(request,env){
 const team=String(env.CF_ACCESS_TEAM_DOMAIN||'').replace(/\/$/,''),aud=String(env.CF_ACCESS_AUD||''),allowed=String(env.FEEDBACK_ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
 if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/i.test(team)||!aud||!allowed.length)return {error:'Admin access is not configured.',status:503};
 const token=request.headers.get('cf-access-jwt-assertion');if(!token)return {error:'Secure Admin sign-in required.',status:401};
 try{const {payload}=await jwtVerify(token,createRemoteJWKSet(new URL(team+'/cdn-cgi/access/certs')),{issuer:team,audience:aud,algorithms:['RS256']});const email=String(payload.email||'').toLowerCase();if(!allowed.includes(email))return {error:'Not permitted.',status:403};return {email};}catch{return {error:'Admin session expired or invalid.',status:401};}
}
