import {NextResponse} from "next/server";
import {neonEnabled,currentVerifiedUser,isVerifiedCompanyMember} from "../../../../lib/mariz/neon-server";
export const dynamic="force-dynamic";
export async function GET(){
 const headers={"Cache-Control":"private, no-store"};
 if(!neonEnabled())return NextResponse.json({authorized:false,reason:"backend_unavailable"},{status:503,headers});
 const user=await currentVerifiedUser();
 if(!user)return NextResponse.json({authorized:false,reason:"verified_sign_in_required"},{status:401,headers});
 const approved=await isVerifiedCompanyMember(user.id);
 return approved?NextResponse.json({authorized:true},{headers}):
 NextResponse.json({authorized:false,reason:"company_kyb_required"},{status:403,headers});
}
