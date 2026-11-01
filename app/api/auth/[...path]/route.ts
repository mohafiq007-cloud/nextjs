import {NextRequest,NextResponse} from "next/server";
import {neonAuth,neonEnabled,neonRegistrationEnabled} from "../../../../lib/mariz/neon-server";
export const dynamic="force-dynamic";
type Context={params:Promise<{path:string[]}>};
function unavailable(){return NextResponse.json({error:"MARIZ CO Auth is not yet enabled"},{status:503,headers:{"Cache-Control":"no-store"}});}
export async function GET(req:NextRequest,context:Context){
 if(!neonEnabled())return unavailable();
 return neonAuth().handler().GET(req,context);
}
export async function POST(req:NextRequest,context:Context){
 if(!neonEnabled())return unavailable();
 const {path}=await context.params;
 // Guard the API itself; hiding the signup form would not stop direct requests.
 if(path[0]==="sign-up"&&!neonRegistrationEnabled())return unavailable();
 return neonAuth().handler().POST(req,context);
}
