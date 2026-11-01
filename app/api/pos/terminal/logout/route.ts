import { NextRequest,NextResponse } from "next/server";
import {DEVICE_COOKIE,STAFF_COOKIE,digest,parseDeviceCookie,requireTerminalBackend,terminalBackendEnabled,verifySameOrigin} from "../../../../../lib/mariz/pos-terminal-server";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 if(!terminalBackendEnabled())return NextResponse.json({error:"Unavailable"},{status:503});
 if(!verifySameOrigin(request))return NextResponse.json({error:"Forbidden"},{status:403});
 const device=parseDeviceCookie(request.cookies.get(DEVICE_COOKIE)?.value);
 const raw=request.cookies.get(STAFF_COOKIE)?.value;
 if(device&&raw&&/^[a-zA-Z0-9_-]{40,60}$/.test(raw)){
  const sb=requireTerminalBackend();
  await sb.rpc("mariz_pos_terminal_sign_out",{p_device:device.device,
    p_device_sha256:device.tokenSha256,p_operator_sha256:digest(raw)});
 }
 const response=NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 response.cookies.delete(STAFF_COOKIE);
 return response;
}
