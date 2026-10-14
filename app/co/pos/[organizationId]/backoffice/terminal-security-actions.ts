"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { marizServerClient,marizBackendConfigured } from "../../../../../lib/mariz/supabase-server";
import { pinHmac,uuidPattern } from "../../../../../lib/mariz/pos-terminal-server";

type PairingState={error:string;challenge_id:string;device_id:string;pairing_code:string};
const empty:PairingState={error:"",challenge_id:"",device_id:"",pairing_code:""};
export async function issuePairingCode(_state:PairingState,form:FormData):Promise<PairingState>{
 const org=String(form.get("organization_id")||""),device=String(form.get("device_id")||"");
 if(!uuidPattern.test(org)||!uuidPattern.test(device))
   return {...empty,error:"Invalid company or terminal"};
 if(!marizBackendConfigured())return {...empty,error:"V2 database not configured"};
 const sb=await marizServerClient();
 const {data:{user},error:authError}=await sb.auth.getUser();
 if(authError||!user)return {...empty,error:"Sign in to MARIZ CO to continue"};
 const {data,error}=await sb.rpc("mariz_pos_admin_start_pairing",{p_organization:org,p_device:device});
 if(error||!data?.pairing_code||!data?.challenge_id)return {...empty,error:"Pairing denied. Verify company permissions, product activation, device status and limits."};
 return {error:"",challenge_id:String(data.challenge_id),device_id:String(data.device_id),pairing_code:String(data.pairing_code)};
}
export async function enrollPosStaffPin(form:FormData):Promise<void>{
 const org=String(form.get("organization_id")||""),staff=String(form.get("staff_id")||"");
 const pin=String(form.get("pin")||""),confirm=String(form.get("confirm_pin")||"");
 if(!uuidPattern.test(org)||!uuidPattern.test(staff))redirect("/co/workspace");
 function status(message:string):never {
  redirect("/co/pos/"+org+"/backoffice?notice="+encodeURIComponent(message));
 }
 if(pin!==confirm||!/^[0-9]{6,8}$/.test(pin))status("PINs must match and contain 6–8 digits");
 if(!marizBackendConfigured())status("V2 database not configured");
 let hmac:string;
 try{hmac=pinHmac(staff,pin)}catch{status("PIN credential service is not configured");}
 const sb=await marizServerClient();
 const {data:{user},error:authError}=await sb.auth.getUser();
 if(authError||!user)redirect("/co/auth");
 // This SQL RPC checks KYB, active POS entitlement and owner/admin access again.
 const {error}=await sb.rpc("mariz_pos_admin_enroll_pin",{p_organization:org,p_staff:staff,p_hmac:hmac});
 if(error)status("PIN enrollment denied. Review company, role and access.");
 revalidatePath("/co/pos/"+org+"/backoffice");
 status("Staff PIN enrolled. Old staff terminal sessions were revoked.");
}
