"use server";
import {randomUUID} from "node:crypto";
import {redirect} from "next/navigation";
import {currentVerifiedUser,marizSql,neonAuth,neonEnabled} from "../../../lib/mariz/neon-server";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function notice(value:string):never{redirect("/co/workspace?notice="+encodeURIComponent(value));}
async function verifiedUser(){
 if(!neonEnabled())notice("MARIZ CO integration is not active");
 const user=await currentVerifiedUser();
 if(!user)redirect("/co/auth?message="+encodeURIComponent("Verify your email and sign in first"));
 return user;
}
export async function createCompany(form:FormData){
 const user=await verifiedUser();
 const legal=String(form.get("legal_name")||"").trim();
 const reg=String(form.get("registration_no")||"").trim();
 const type=String(form.get("entity_type")||"");
 const address=String(form.get("address")||"").trim();
 const email=String(form.get("business_email")||"").trim().toLowerCase();
 if(form.get("authority")!=="yes"||legal.length<3||legal.length>200||reg.length<4||reg.length>80||address.length<8||
 !["company","sole_proprietor","partnership","llp","society","other"].includes(type)||
 !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
  notice("Complete all official company details and your authority declaration");
 // Registered Neon Auth organization owns its user membership. Legal company
 // details remain separately reviewed before any product activation.
 const slug="mariz-"+reg.toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,26)+"-"+randomUUID().slice(0,8);
 const {data:org,error:orgError}=await neonAuth().organization.create({name:legal,slug});
 if(orgError||!org?.id)notice("Could not create organization. Review your information and retry.");
 try{
  const sql=marizSql();
  await sql.query("SELECT mariz_core.register_company_profile($1::uuid,$2::uuid,$3,$4,$5,$6,$7)",
    [user.id,org.id,legal,type,reg,address,email]);
 }catch{
  // Organization remains in Auth if SQL enrollment fails; operator reconciles.
  notice("Organization created, but company profile needs support reconciliation. Avoid registering a duplicate.");
 }
 notice("Free company profile created. Start KYB verification next.");
}
export async function startKyb(form:FormData){
 const user=await verifiedUser();
 const org=String(form.get("organization_id")||"");
 if(!uuid.test(org))notice("Invalid company");
 try{
  const sql=marizSql();
  await sql.query("SELECT mariz_core.start_kyb($1::uuid,$2::uuid)",[user.id,org]);
 }catch{notice("Unable to start KYB for this company");}
 notice("KYB application draft created. Secure document uploads are not open yet.");
}
