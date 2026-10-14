import { redirect } from "next/navigation";
import PosV2Demo from "./pos-v2-demo";
import { marizBackendConfigured, marizServerClient } from "../../lib/mariz/supabase-server";

export const dynamic = "force-dynamic";

export default async function POSV2Page() {
 // V2's isolated preview shows simulated data only. Once a real backend is configured,
 // access is restricted to members of a verified company.
 if (marizBackendConfigured()) {
   const sb = await marizServerClient();
   const { data: { user }, error } = await sb.auth.getUser();
   if (error || !user) redirect("/co/auth");
   const { data: members } = await sb.from("mariz_memberships")
     .select("organization_id").eq("user_id", user.id).eq("membership_status", "active");
   const ids = (members || []).map(m => m.organization_id);
   if (!ids.length) redirect("/co/workspace");
   const { data: company } = await sb.from("mariz_organizations")
     .select("id").in("id", ids).eq("verification_status", "verified").limit(1);
   if (!company?.length) redirect("/co/workspace");
 }
 return <PosV2Demo />;
}
