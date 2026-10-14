"use server";
import {randomUUID} from "node:crypto";
import {redirect} from "next/navigation";
import {getVerifiedNeonUser,neonBackendConfigured} from "../../../lib/mariz/neon-auth-server";
import {getNeonAuth} from "../../../lib/mariz/neon-auth-server";
import {neonDatabase,isUuid} from "../../../lib/mariz/neon-db";

function go(message:string):never {redirect("/co/workspace?message="+encodeURIComponent(message));}
async function actor(){
 if(!neonBackendConfigured())redirect("/co/auth");
 const user=await getVerifiedNeonUser();
 if(!user)redirect("/co/auth?message=Verified%20account%20required");
 return user;
}
export async function createCompany(form:FormData){
 const user=await actor();
 const name=String(form.get("legal_name")||"").trim(),entity=String(form.get("entity_type")||"");
 const number=String(form.get("registration_no")||"").trim(),address=String(form.get("address")||"").trim();
 const email=String(form.get("business_email")||"").trim().toLowerCase();
 if(form.get("authority_confirmation")!=="yes"||form.get("country")!=="MY"||
  !["company","sole_proprietor","partnership","llp","society","other"].includes(entity)||
  name.length<3||name.length>200||number.length<4||number.length>80||
  address.length<8||address.length>700||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
  go("Complete all legal company fields and the authority declaration");
 const sql=neonDatabase();
 const normalized=number.toUpperCase().replace(/[^A-Z0-9]/g,"");
 const existing=await sql.query("SELECT 1 FROM mariz_core.company_profiles WHERE country_code=$1 AND registrar=$2 AND registration_normalized=$3 LIMIT 1",["MY","SSM",normalized]);
 if(existing.length)go("This company has already been registered; request access to the existing profile");
 const slug="mariz-"+randomUUID().replace(/-/g,"").slice(0,20);
 const result=await getNeonAuth().organization.create({name,slug});
 if(result.error || !result.data?.id)go("Unable to provision the organization identity");
 const orgId=String(result.data.id);
 if(!isUuid(orgId))go("Invalid organization identity; contact support");
 try{
  await sql.query("SELECT mariz_core.register_company_profile($1::uuid,$2::uuid,$3,$4,$5,$6,$7)",[user.id,orgId,name,entity,number,address,email]);
  await sql.query("SELECT mariz_core.start_kyb($1::uuid,$2::uuid)",[user.id,orgId]);
 }catch{
  // Cross-service registration cannot be atomic; retain the unverified auth organization
  // for controlled support cleanup; never grant access or retry with bypassed KYB.
  go("Company profile could not be completed. Please contact MARIZ support before retrying.");
 }
 redirect("/co/workspace?message=Company%20profile%20created%20for%20verification");
}
export async function startKyb(form:FormData){
 const user=await actor(),id=String(form.get("organization_id")||"");
 if(!isUuid(id))go("Invalid organization identifier");
 const sql=neonDatabase();
 try{await sql.query("SELECT mariz_core.start_kyb($1::uuid,$2::uuid)",[user.id,id]);}
 catch{go("KYB application could not be opened");}
 redirect("/co/workspace?message=KYB%20application%20draft%20ready");
}
export async function uploadKybDocument(_form:FormData){
 // Private Neon object storage needs presigned, verified, malware-scanned ingestion;
 // NEVER accept an unsigned direct upload or fake successful document registration.
 go("KYB document upload is not enabled until secure private-storage checks are complete");
}
export async function submitKyb(form:FormData){
 const user=await actor(),id=String(form.get("application_id")||"");
 if(!isUuid(id)||form.get("declaration")!=="yes")go("Valid application and declaration required");
 const sql=neonDatabase();
 try{await sql.query("SELECT mariz_core.submit_kyb($1::uuid,$2::uuid)",[user.id,id]);}
 catch{go("KYB submission requires a verified official business registration document");}
 redirect("/co/workspace?message=KYB%20submitted%20to%20MARIZ%20review");
}
