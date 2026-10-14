import {NextRequest,NextResponse} from "next/server";
import {neonAuth,neonEnabled} from "../../../../lib/mariz/neon-server";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest) {
  if(!neonEnabled()) return NextResponse.json({error:"MARIZ CO registration is not yet enabled"},{status:503});
  return neonAuth().handler().GET(req);
}
export async function POST(req:NextRequest) {
  if(!neonEnabled()) return NextResponse.json({error:"MARIZ CO registration is not yet enabled"},{status:503});
  return neonAuth().handler().POST(req);
}
