import { NextResponse } from "next/server";
import { marizBackendConfigured, marizServerClient } from "../../../../lib/mariz/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!marizBackendConfigured()) return NextResponse.json({ authorized:false, reason:"backend_not_configured" },{status:503});
  const sb=await marizServerClient();
  const {data:{user},error:authError}=await sb.auth.getUser();
  if(authError||!user) return NextResponse.json({ authorized:false,reason:"sign_in_required" },{status:401,headers:{"Cache-Control":"no-store"}});
  const {data:memberships,error}=await sb.from("mariz_memberships")
    .select("organization_id").eq("user_id",user.id).eq("membership_status","active");
  if(error || !memberships?.length) return NextResponse.json({authorized:false,reason:"company_required"},{status:403,headers:{"Cache-Control":"no-store"}});
  const orgIds=memberships.map(x=>x.organization_id);
  const {data:companies}=await sb.from("mariz_organizations").select("id").in("id",orgIds)
    .eq("verification_status","verified").limit(1);
  if(!companies?.length)return NextResponse.json({authorized:false,reason:"company_not_verified"},{status:403,headers:{"Cache-Control":"no-store"}});
  return NextResponse.json({authorized:true},{headers:{"Cache-Control":"private, no-store"}});
}
