import {createHash,timingSafeEqual} from 'node:crypto';import {NextResponse} from 'next/server';
import {commercialReadiness} from '../../../../../lib/mariz/pos-commercial-readiness.mjs';
export const dynamic='force-dynamic';export const runtime='nodejs';
export async function GET(request:Request){
 const expected=process.env.MARIZ_POS_PILOT_CALLBACK_BYPASS,provided=request.headers.get('x-mariz-readiness');
 if(process.env.VERCEL_ENV!=='preview'||!expected||!provided||!timingSafeEqual(createHash('sha256').update(expected).digest(),createHash('sha256').update(provided).digest()))return NextResponse.json({error:'forbidden'},{status:403,headers:{'Cache-Control':'no-store'}});
 try{return NextResponse.json(await commercialReadiness(),{headers:{'Cache-Control':'no-store'}});}
 catch(error){const code=error instanceof Error&&/^[a-z_]+$/.test(error.message)?error.message:'readiness_check_failed';return NextResponse.json({error:code},{status:503,headers:{'Cache-Control':'no-store'}});}
}
