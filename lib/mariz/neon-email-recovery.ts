import 'server-only';
import {headers} from 'next/headers';
// The pinned Neon SDK 0.5.0-beta maps this method to /email-otp/passcode (404).
// Upstream: https://github.com/neondatabase/neon-js/issues/229
// Keep this narrow adapter until that mapping is fixed and a new SDK is verified.
const bases=new Set([
 'https://ep-twilight-lake-aomjxn05.neonauth.c-2.ap-southeast-1.aws.neon.tech/marizhq_v2/auth',
 'https://ep-misty-mouse-aoq558cc.neonauth.c-2.ap-southeast-1.aws.neon.tech/marizhq_v2/auth',
]);
export async function resetPasswordWithOtp(email:string,otp:string,password:string){
 const base=process.env.NEON_AUTH_BASE_URL;
 if(!base||!bases.has(base))throw Error('Account recovery unavailable');
 const origin=(await headers()).get('origin');
 if(!origin)throw Error('Account recovery origin required');
 const response=await fetch(base+'/email-otp/reset-password',{
  method:'POST',headers:{'Content-Type':'application/json',Origin:origin,'x-neon-auth-proxy':'nextjs'},
  body:JSON.stringify({email,otp,password}),cache:'no-store',redirect:'error',
 });
 if(!response.ok)throw Object.assign(new Error('Account recovery denied'),{status:response.status});
}
