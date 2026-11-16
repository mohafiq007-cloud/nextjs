import { NextRequest,NextResponse } from "next/server";
import {DEVICE_COOKIE,STAFF_COOKIE,mintSecret,digest,pinHmac,parseDeviceCookie,readJsonObject,requireTerminalBackend,terminalBackendEnabled,uuidPattern,verifySameOrigin} from "../../../../../lib/mariz/pos-terminal-server";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 if(!terminalBackendEnabled())return NextResponse.json({error:"Staff login is disabled"},{status:503});
 if(!verifySameOrigin(request))return NextResponse.json({error:"Forbidden"},{status:403});
 const device=parseDeviceCookie(request.cookies.get(DEVICE_COOKIE)?.value);
 if(!device)return NextResponse.json({error:"Pair terminal before staff login"},{status:401});
 const body=await readJsonObject(request);
 const staff=String(body?.staff_id||""),pin=String(body?.pin||"");
 if(!uuidPattern.test(staff)||!/^[0-9]{6,8}$/.test(pin))
  return NextResponse.json({error:"Invalid staff credentials"},{status:400});
 const session=mintSecret(),sb=requireTerminalBackend();
 const {data,error}=await sb.rpc("mariz_pos_terminal_sign_in",{
  p_device:device.device,p_device_sha256:device.tokenSha256,
  p_staff:staff,p_pin_hmac:pinHmac(staff,pin),p_session_sha256:digest(session)
 });
 if(error)return NextResponse.json({error:"Staff login unavailable"},{status:503});
 if(!data?.ok)return NextResponse.json({error:"Invalid PIN or account temporarily locked"},{status:401});
 const response=NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 response.cookies.set(STAFF_COOKIE,session,{httpOnly:true,secure:true,sameSite:"strict",path:"/",maxAge:12*3600});
 return response;
}
