"use server";
import {registerCompanyRecoverably} from "../../../lib/mariz/co-registration.mjs";
import {redirect} from "next/navigation";
import {currentVerifiedUser, myCompanies, coRpc, neonAuth, neonEnabled} from "../../../lib/mariz/neon-server";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function notice(value:string,target:"/co/workspace"|"/co/company/new"="/co/workspace",organizationId=''):never{const query=new URLSearchParams({notice:value});if(uuid.test(organizationId))query.set('company',organizationId);redirect(target+'?'+query.toString());}
async function verifiedUser(){
 if(!neonEnabled())notice("MARIZ CO integration is not active");
 const user=await currentVerifiedUser();
 if(!user)redirect("/co/auth?message="+encodeURIComponent("Verify your email and sign in first"));
 return user;
}
export async function createCompany(form:FormData){
 const user=await verifiedUser();
 let existing;try{existing=await myCompanies(user.id);}catch{notice('We could not securely check the company linked to this account. Please try again or contact MARIZ.');}
 if(existing.length)notice('This account already has a registered company. Open your company workspace to continue.');
 const legal=String(form.get("legal_name")||"").trim();
 const reg=String(form.get("registration_no")||"").trim();
 const type=String(form.get("entity_type")||"");
 const address=String(form.get("address")||"").trim();
 const email=String(form.get("business_email")||"").trim().toLowerCase();
 if(form.get("authority")!=="yes"||legal.length<3||legal.length>200||reg.length<4||reg.length>80||address.length<8||address.length>700||
 !["company","sole_proprietor","partnership","llp","society","other"].includes(type)||
 !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
  notice("Complete all official company details and your authority declaration","/co/company/new");
 let organizationId='';try{
  const result=await registerCompanyRecoverably({actorId:user.id,auth:neonAuth(),rpc:coRpc,profile:{
    p_legal_name:legal,
    p_entity_type:type,
    p_registration_no:reg,
    p_registered_address:address,
    p_business_email:email,
  }});if(typeof result==='string'&&uuid.test(result))organizationId=result;
 }catch{
  notice("Company registration is incomplete. Retry with the same SSM number and details to resume safely. Contact support if this persists.","/co/company/new");
 }
 notice("Company profile saved. Continue to document upload to add your SSM business profile.",'/co/workspace',organizationId);
}
export async function startKyb(form:FormData){
 await verifiedUser();
 const org=String(form.get("organization_id")||"");
 if(!uuid.test(org))notice("Invalid company");
 try{
  await coRpc<string>("api_start_kyb",{p_organization:org});
 }catch{notice("Unable to start verification for this company. Please try again.",'/co/workspace',org);}
 notice("Add your SSM business profile below. IC is optional. Your application is not sent until you choose Send for review.",'/co/workspace',org);
}
