import {NextResponse,type NextRequest} from "next/server";
import {neonEnabled,neonAuth} from "./lib/mariz/neon-server";
export function proxy(request:NextRequest){
 if(!neonEnabled())return NextResponse.next({request});
 return neonAuth().middleware({loginUrl:"/co/auth"})(request);
}
export const config={matcher:["/co/workspace/:path*","/co/pos/:path*","/admin/kyb/:path*"]};
