import { NextRequest,NextResponse } from "next/server";
import {DEVICE_COOKIE,STAFF_COOKIE,parseDeviceCookie,digest,requireTerminalBackend,terminalBackendEnabled} from "../../../../../lib/mariz/pos-terminal-server";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"};
export async function GET(request:NextRequest){
 if(!terminalBackendEnabled())return NextResponse.json({state:"disabled"},{status:503,headers:noStore});
 const device=parseDeviceCookie(request.cookies.get(DEVICE_COOKIE)?.value);
 if(!device)return NextResponse.json({state:"unpaired"},{status:401,headers:noStore});
 const sb=requireTerminalBackend();
 const {data:verified,error}=await sb.rpc("mariz_pos_terminal_validate_device",{
  p_device:device.device,p_token_sha256:device.tokenSha256
 });
 if(error||!verified?.ok)return NextResponse.json({state:"unpaired"},{status:401,headers:noStore});
 const {data:staff,error:staffError}=await sb.from("mariz_pos_staff")
  .select("id,staff_name,role").eq("organization_id",verified.organization_id)
  .eq("status","active").limit(200);
 if(staffError)return NextResponse.json({state:"unavailable"},{status:503,headers:noStore});
 const operatorRaw=request.cookies.get(STAFF_COOKIE)?.value||"";
 const operatorSecret=/^[a-zA-Z0-9_-]{40,60}$/.test(operatorRaw)?digest(operatorRaw):null;
 let operator=null;
 if(operatorSecret){
  const {data}=await sb.rpc("mariz_pos_terminal_validate_operator",{
   p_device:device.device,p_device_sha256:device.tokenSha256,p_operator_sha256:operatorSecret
  });
  if(data?.ok)operator={id:data.staff_id,name:data.staff_name,role:data.role};
 }
 return NextResponse.json({state:operator?"signed_in":"paired",device_id:device.device,
  outlet_id:verified.outlet_id,staff:staff||[],operator},{headers:noStore});
}
