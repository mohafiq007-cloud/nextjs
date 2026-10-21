"use server";
import {randomUUID} from "node:crypto";
import {redirect} from "next/navigation";
import {currentVerifiedUser, coRpc, neonAuth, neonEnabled} from "../../../lib/mariz/neon-server";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function notice(value:string):never{redirect("/co/workspace?notice="+encodeURIComponent(value));}
async function verifiedUser(){
 if(!neonEnabled())notice("MARIZ CO integration is not active");
 const user=await currentVerifiedUser();
 if(!user)redirect("/co/auth?message="+encodeURIComponent("Verify your email and sign in first"));
 return user;
}
export async function createCompany(form:FormData){
 await verifiedUser();
 const legal=String(form.get("legal_name")||"").trim();
 const reg=String(form.get("registration_no")||"").trim();
 const type=String(form.get("entity_type")||"");
 const address=String(form.get("address")||"").trim();
 const email=String(form.get("business_email")||"").trim().toLowerCase();
 if(form.get("authority")!=="yes"||legal.length<3||legal.length>200||reg.length<4||reg.length>80||address.length<8||address.length>700||
 !["company","sole_proprietor","partnership","llp","society","other"].includes(type)||
 !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
  notice("Complete all official company details and your authority declaration");
 // Auth organization membership is created first; profile and KYB remain unverified.
 // An RPC failure can leave an orphan Auth organization; support must reconcile it.
 const slug="mariz-"+reg.toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,26)+"-"+randomUUID().slice(0,8);
 const {data:org,error:orgError}=await neonAuth().organization.create({name:legal,slug});
 if(orgError||!org?.id)notice("Could not create organization. Review your information and retry.");
 try{
  await coRpc<string>("api_register_company",{
    p_organization:org.id,
    p_legal_name:legal,
    p_entity_type:type,
    p_registration_no:reg,
    p_registered_address:address,
    p_business_email:email,
  });
 }catch{
  notice("Organization created, but company profile needs support reconciliation. Avoid registering a duplicate.");
 }
 notice("Free company profile created. Start KYB verification next.");
}
export async function startKyb(form:FormData){
 await verifiedUser();
 const org=String(form.get("organization_id")||"");
 if(!uuid.test(org))notice("Invalid company");
 try{
  await coRpc<string>("api_start_kyb",{p_organization:org});
 }catch{notice("Unable to start KYB for this company");}
 notice("KYB application draft created. Secure document uploads are not open yet.");
}
