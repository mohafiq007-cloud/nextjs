"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { marizBackendConfigured, marizServerClient } from "../../../../../lib/mariz/supabase-server";

function parsedId(value: FormDataEntryValue | null) {
  const id=String(value || "").trim();
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    throw new Error("Invalid ID");
  return id;
}
function route(orgId:string,message:string):never{
  redirect("/co/pos/"+encodeURIComponent(orgId)+"/backoffice?notice="+encodeURIComponent(message));
}
async function account(orgId:string) {
  if(!marizBackendConfigured())route(orgId,"V2 database is not configured");
  const supabase=await marizServerClient();
  const {data:{user},error}=await supabase.auth.getUser();
  if(error||!user)redirect("/co/auth");
  // Data actions are checked again by secure definer SQL RPCs. Never bypass via service-role.
  const {data:member,error:memberError}=await supabase.from("mariz_memberships")
    .select("member_role,membership_status").eq("organization_id",orgId)
    .eq("user_id",user.id).maybeSingle();
  if(memberError||!member||member.membership_status!=="active"||!["owner","admin"].includes(member.member_role))
    redirect("/co/workspace");
  return supabase;
}
export async function createPosOutlet(form:FormData) {
  const orgId=parsedId(form.get("organization_id"));
  const sb=await account(orgId);
  const name=String(form.get("name")||"").trim();
  if(name.length<2||name.length>140)route(orgId,"Enter a valid outlet name");
  const {error}=await sb.rpc("mariz_pos_admin_create_outlet",{p_organization:orgId,p_name:name});
  if(error)route(orgId,"Outlet creation was denied; check verification, subscription and limits");
  revalidatePath("/co/pos/"+orgId+"/backoffice");
  route(orgId,"Outlet created");
}
export async function createPosStaff(form:FormData){
  const orgId=parsedId(form.get("organization_id"));
  const sb=await account(orgId);
  const name=String(form.get("name")||"").trim();
  const role=String(form.get("role")||"");
  if(name.length<2||name.length>140||!["cashier","manager","kitchen"].includes(role))
    route(orgId,"Enter a valid staff name and role");
  const {error}=await sb.rpc("mariz_pos_admin_create_staff",{p_organization:orgId,p_name:name,p_role:role});
  if(error)route(orgId,"Staff creation was denied");
  revalidatePath("/co/pos/"+orgId+"/backoffice");
  route(orgId,"Staff record created; secure PIN enrollment is a later release");
}
export async function createPosItem(form:FormData){
  const orgId=parsedId(form.get("organization_id"));
  const sb=await account(orgId);
  const name=String(form.get("name")||"").trim();
  const price=String(form.get("price")||"").trim();
  // No floating-point money input: parse decimal manually into integer minor units.
  if(name.length<2||name.length>140||!/^(0|[1-9][0-9]{0,6})(\.[0-9]{1,2})?$/.test(price))
    route(orgId,"Enter a valid item and price in MYR");
  const [whole,fraction=""]=price.split(".");
  const minor=Number(whole)*100+Number((fraction+"00").slice(0,2));
  if(!Number.isSafeInteger(minor)||minor>100000000)route(orgId,"Price exceeds the permitted range");
  const {error}=await sb.rpc("mariz_pos_admin_create_item",
    {p_organization:orgId,p_name:name,p_price_minor:minor});
  if(error)route(orgId,"Product creation was denied");
  revalidatePath("/co/pos/"+orgId+"/backoffice");
  route(orgId,"Menu item created");
}
export async function createPosPendingDevice(form:FormData){
  const orgId=parsedId(form.get("organization_id"));
  const outletId=parsedId(form.get("outlet_id"));
  const sb=await account(orgId);
  const name=String(form.get("name")||"").trim();
  if(name.length<2||name.length>80)route(orgId,"Enter a valid terminal name");
  const {error}=await sb.rpc("mariz_pos_admin_register_pending_device",
    {p_organization:orgId,p_outlet:outletId,p_name:name});
  if(error)route(orgId,"Unable to register terminal; check company, outlet and limits");
  revalidatePath("/co/pos/"+orgId+"/backoffice");
  route(orgId,"Pending terminal registered; pairing will be enabled after secure device credentials are implemented");
}
