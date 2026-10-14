import {NextResponse,type NextRequest} from "next/server";
import {getNeonAuth,neonBackendConfigured,neonPublicSignupsEnabled} from "../../../../lib/mariz/neon-auth-server";
export const dynamic="force-dynamic";
function blocked(){return NextResponse.json({error:"MARIZ CO registration is not open yet"},{status:503,headers:{"Cache-Control":"no-store"}});}
export async function GET(request:NextRequest,context:{params:Promise<{path:string[]}>}){
 if(!neonBackendConfigured())return blocked();
 return getNeonAuth().handler().GET(request,context);
}
export async function POST(request:NextRequest,context:{params:Promise<{path:string[]}>}){
 if(!neonBackendConfigured())return blocked();
 const {path}=await context.params;
 if(path[0]==="sign-up"&&!neonPublicSignupsEnabled())return blocked();
 return getNeonAuth().handler().POST(request,context);
}
