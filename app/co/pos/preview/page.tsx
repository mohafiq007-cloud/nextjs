import { redirect } from "next/navigation";
import PosV2Demo from "../../../pos-v2/pos-v2-demo";
import { marizBackendConfigured, marizServerClient } from "../../../../lib/mariz/supabase-server";

export const dynamic="force-dynamic";
export const metadata={title:"MARIZ POS V2 — Back Office & Store Terminal",robots:{index:false,follow:false}};

export default async function POSPreview() {
  // The preview is simulated only. If a dedicated V2 Supabase backend is connected,
  // restrict this link to members of an approved MARIZ CO company.
  if(marizBackendConfigured()){
    const client=await marizServerClient();
    const {data:{user},error}=await client.auth.getUser();
    if(error||!user)redirect("/co/auth");
    const {data:members}=await client.from("mariz_memberships")
      .select("organization_id").eq("user_id",user.id).eq("membership_status","active");
    const ids=(members||[]).map(x=>x.organization_id);
    if(!ids.length)redirect("/co/workspace");
    const {data:approved}=await client.from("mariz_organizations")
      .select("id").in("id",ids).eq("verification_status","verified").limit(1);
    if(!approved?.length)redirect("/co/workspace");
  }
  return <PosV2Demo/>;
}
