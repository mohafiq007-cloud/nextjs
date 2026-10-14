import {redirect} from "next/navigation";
import PosV2Demo from "../../../pos-v2/pos-v2-demo";
import {getVerifiedNeonUser,neonBackendConfigured} from "../../../../lib/mariz/neon-auth-server";
import {neonDatabase} from "../../../../lib/mariz/neon-db";
export const dynamic="force-dynamic";
export const metadata={title:"MARIZ POS V2 — Prepared Demo",robots:{index:false,follow:false}};
export default async function POSPreview(){
 // Inside protected, internal Vercel preview mode the demo is available even when
 // live company registration is disabled. When the Neon backend is enabled,
 // company verification is mandatory and no trial/subscription is required.
 if(neonBackendConfigured()){
  const user=await getVerifiedNeonUser();
  if(!user)redirect("/co/auth");
  const sql=neonDatabase();
  const rows=await sql.query('SELECT 1 FROM mariz_core.company_profiles c JOIN neon_auth.member m ON m."organizationId"=c.organization_id WHERE m."userId"=$1::uuid AND c.verification_status=$2 LIMIT 1',[user.id,"verified"]);
  if(!rows.length)redirect("/co/workspace");
 }
 return <PosV2Demo/>;
}
