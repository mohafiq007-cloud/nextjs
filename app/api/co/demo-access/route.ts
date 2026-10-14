import {NextResponse} from "next/server";
import {getVerifiedNeonUser,neonBackendConfigured} from "../../../../lib/mariz/neon-auth-server";
import {neonDatabase} from "../../../../lib/mariz/neon-db";
export const dynamic="force-dynamic";
export async function GET(){
 const headers={"Cache-Control":"private, no-store"};
 if(!neonBackendConfigured())return NextResponse.json({authorized:false,reason:"backend_unavailable"},{status:503,headers});
 const user=await getVerifiedNeonUser();
 if(!user)return NextResponse.json({authorized:false,reason:"verified_sign_in_required"},{status:401,headers});
 const sql=neonDatabase();
 const rows=await sql.query('SELECT c.organization_id FROM mariz_core.company_profiles c JOIN neon_auth.member m ON m."organizationId"=c.organization_id WHERE m."userId"=$1::uuid AND c.verification_status=$2 LIMIT 1',[user.id,"verified"]);
 return rows.length?NextResponse.json({authorized:true},{headers}):NextResponse.json({authorized:false,reason:"company_kyb_required"},{status:403,headers});
}
