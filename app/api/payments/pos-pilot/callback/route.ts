import {NextResponse} from 'next/server';
import {commercialEnabled,commercialService,deliverCommercial} from '../../../../../lib/mariz/pos-commercial-server.mjs';
import {readBillingBody} from '../../../../../lib/mariz/billing/http.mjs';
export const dynamic='force-dynamic';export const runtime='nodejs';
export async function POST(request:Request){
 if(!commercialEnabled())return NextResponse.json({error:'disabled'},{status:503});
 try{
  const result=await commercialService().callback(await readBillingBody(request));
  // Delivery is retried by authenticated refresh and subsequent callbacks.
  // A receiver failure must never discard the separately committed payment.
  return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});
 }catch(error){const message=error instanceof Error?error.message:'';return NextResponse.json({error:'verification_or_reconciliation_required'},{status:message==='Invalid callback signature'?401:503,headers:{'Cache-Control':'no-store'}});}
}
