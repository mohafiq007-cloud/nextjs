import {NextResponse,type NextRequest} from "next/server";
import {neonBackendConfigured,getNeonAuth} from "./lib/mariz/neon-auth-server";
export function proxy(request:NextRequest){
 if(!neonBackendConfigured())return NextResponse.next({request});
 return getNeonAuth().middleware({loginUrl:"/co/auth"})(request);
}
export const config={matcher:["/co/workspace/:path*","/co/pos/:path*","/admin/kyb/:path*"]};
