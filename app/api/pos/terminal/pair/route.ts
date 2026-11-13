import { NextRequest,NextResponse } from "next/server";
import {DEVICE_COOKIE,STAFF_COOKIE,mintSecret,digest,readJsonObject,requireTerminalBackend,terminalBackendEnabled,uuidPattern,verifySameOrigin} from "../../../../../lib/mariz/pos-terminal-server";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 if(!terminalBackendEnabled())return NextResponse.json({error:"Live terminal pairing is disabled"},{status:503});
 if(!verifySameOrigin(request))return NextResponse.json({error:"Forbidden"},{status:403});
 const body=await readJsonObject(request);
 const device=String(body?.device_id||""),challenge=String(body?.challenge_id||""),code=String(body?.pairing_code||"");
 if(!uuidPattern.test(device)||!uuidPattern.test(challenge)||!/^[0-9]{6}$/.test(code))
  return NextResponse.json({error:"Invalid pairing request"},{status:400});
 const secret=mintSecret(),fingerprint=digest(secret);
 const sb=requireTerminalBackend();
 const {data,error}=await sb.rpc("mariz_pos_terminal_complete_pairing",{
  p_device:device,p_challenge:challenge,p_code:code,p_token_sha256:fingerprint
 });
 if(error)return NextResponse.json({error:"Pairing could not be completed"},{status:503});
 if(!data?.ok)return NextResponse.json({error:"Code invalid, expired or already used"},{status:403});
 const response=NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 response.cookies.set(DEVICE_COOKIE,device+"."+secret,{httpOnly:true,secure:true,sameSite:"strict",path:"/",maxAge:30*86400});
 response.cookies.delete(STAFF_COOKIE);
 return response;
}
