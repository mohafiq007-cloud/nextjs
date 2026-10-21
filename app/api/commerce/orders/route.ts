import {currentVerifiedUser,neonAuth,neonEnabled} from '../../../../lib/mariz/neon-server';
import {validateNeonDataApiUrl} from '../../../../lib/mariz/co-data-api-request.mjs';
import {validateOrderRequest} from '../../../../apps/mariz-commerce/server/order-request.mjs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 const reply=(error:string,status:number)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
 if(process.env.MARIZ_COMMERCE_STAGING_ENABLED!=='true'||process.env.VERCEL_ENV==='production'||!neonEnabled())return reply('Commerce staging is disabled',503);
 const origin=process.env.MARIZ_COMMERCE_STAGING_ORIGIN;
 if(!origin||request.headers.get('origin')!==origin||new URL(request.url).origin!==origin)return reply('Forbidden',403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return reply('JSON required',415);
 try{
  if(!await currentVerifiedUser())return reply('Verified sign-in required',401);
  const reader=request.body?.getReader();if(!reader)return reply('Invalid order',400);
  let raw='',size=0;const decoder=new TextDecoder();
  while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;
   if(size>16384){await reader.cancel();return reply('Request too large',413);}raw+=decoder.decode(chunk.value,{stream:true});}
  raw+=decoder.decode();
  let params;try{params=validateOrderRequest(JSON.parse(raw));}catch{return reply('Invalid order',400);}
  const {data,error}=await neonAuth().token();if(error||!data?.token)return reply('Verified sign-in required',401);
  const base=validateNeonDataApiUrl(process.env.NEON_DATA_API_URL);
  const response=await fetch(base+'/rpc/api_commerce_create_order',{method:'POST',cache:'no-store',redirect:'error',
   headers:{Authorization:'Bearer '+data.token,'Content-Type':'application/json','Content-Profile':'mariz_core','Accept-Profile':'mariz_core'},body:JSON.stringify(params)});
  if(!response.ok)return reply('Order not accepted',409);
  return Response.json(await response.json(),{headers:{'Cache-Control':'no-store'}});
 }catch{return reply('Order service unavailable',503);}
}
