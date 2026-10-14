import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";
import { neon } from "@neondatabase/serverless";

export const neonConfigured = () => Boolean(
  process.env.NEON_AUTH_BASE_URL &&
  process.env.NEON_AUTH_COOKIE_SECRET &&
  process.env.NEON_AUTH_COOKIE_SECRET.length >= 32 &&
  process.env.MARIZ_NEON_DATABASE_URL
);
export const neonEnabled = () => neonConfigured() && process.env.NEON_V2_ENABLED === "true";
export const neonRegistrationEnabled = () => neonEnabled() && process.env.MARIZ_CO_PUBLIC_SIGNUP_ENABLED === "true" && process.env.MARIZ_EMAIL_VERIFICATION_ENFORCED === "true";

export function neonAuth() {
  if (!neonEnabled()) throw new Error("MARIZ CO V2 Neon Auth is not active");
  return createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL!,
    cookies: {secret: process.env.NEON_AUTH_COOKIE_SECRET!, sessionDataTtl: 60},
  });
}
export function marizSql() {
  if (!neonEnabled()) throw new Error("MARIZ HQ V2 database is not enabled");
  const url=process.env.MARIZ_NEON_DATABASE_URL!;
  const parsed=new URL(url);
  if(parsed.pathname!=="/marizhq_v2"||parsed.username!=="mariz_v2_runtime"){
    throw new Error("Only the isolated Neon marizhq_v2 database and limited runtime role are allowed");
  }
  return neon(url);
}
export type MarizCompany = {
  organization_id:string;legal_name:string;registration_no:string;entity_type:string;
  verification_status:string;kyb_status:string|null;pos_status:string|null;member_role:string;
};
export async function currentVerifiedUser() {
  const {data,error}=await neonAuth().getSession();
  const user=data?.user;
  if(error||!user||!user.emailVerified)return null;
  return user;
}
export async function myCompanies(userId:string):Promise<MarizCompany[]> {
  const sql=marizSql();
  const rows=await sql.query(
    'SELECT c.organization_id,c.legal_name,c.registration_no,c.entity_type,c.verification_status, m.role AS member_role, '+
    '(SELECT k.status FROM mariz_core.kyb_applications k WHERE k.organization_id=c.organization_id ORDER BY k.created_at DESC LIMIT 1) AS kyb_status, '+
    '(SELECT e.status FROM mariz_core.product_entitlements e WHERE e.organization_id=c.organization_id AND e.product_code=$2 LIMIT 1) AS pos_status '+
    'FROM mariz_core.company_profiles c JOIN neon_auth.member m ON m."organizationId"=c.organization_id '+
    'JOIN neon_auth."user" u ON u.id=m."userId" WHERE m."userId"=$1::uuid AND u."emailVerified"=true '+
    'ORDER BY c.created_at DESC LIMIT 50',
    [userId,"pos"]
  );
  return rows as MarizCompany[];
}
export async function isVerifiedCompanyMember(userId:string) {
  return (await myCompanies(userId)).some(c=>c.verification_status==="verified");
}
