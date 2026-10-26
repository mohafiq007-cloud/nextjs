import "server-only";
import {createNeonAuth} from "@neondatabase/auth/next/server";
import {companyRuntimeConfigured, companyRuntimeSql} from "./neon-runtime-server";
import {coDataApiConfigured, invokeCoRpc} from "./co-data-api";
import type {CoRpcName} from "./co-data-api-request.mjs";
import {setTimeout as delay} from 'node:timers/promises';

// Public CO company access uses JWT-scoped Neon Data API RPCs only.
// Legacy billing/POS server-side SQL credentials are NOT required to sign up.
export const neonConfigured = () => Boolean(
  process.env.NEON_AUTH_BASE_URL &&
  process.env.NEON_AUTH_COOKIE_SECRET &&
  process.env.NEON_AUTH_COOKIE_SECRET.length >= 32 &&
  coDataApiConfigured()
);
export const neonEnabled = () => neonConfigured() && process.env.NEON_V2_ENABLED === "true";
export const neonRegistrationEnabled = () =>
  neonEnabled() &&
  process.env.NEON_PUBLIC_REGISTRATION_ENABLED === "true" &&
  process.env.MARIZ_CO_PUBLIC_SIGNUP_ENABLED === "true" &&
  process.env.MARIZ_EMAIL_VERIFICATION_ENFORCED === "true";

export function neonAuth() {
  if (!neonEnabled()) throw new Error("MARIZ CO V2 Neon Auth is not active");
  return createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL!,
    cookies: {secret: process.env.NEON_AUTH_COOKIE_SECRET!, sessionDataTtl: 60},
  });
}

// Use signed JWT from Neon Auth, NOT the opaque getSession().session.token.
export async function coRpc<T>(name: CoRpcName, params: Record<string,string> = {}) {
  const {data,error} = await neonAuth().token();
  if (error || !data?.token) throw Object.assign(new Error("MARIZ CO user token unavailable"),{code:'CO_AUTH_TOKEN_UNAVAILABLE'});
  return invokeCoRpc<T>(data.token, name, params);
}

// Reserved for legacy POS/billing routes still awaiting a separate migration.
// Never fall back to an elevated Neon owner role.
export function marizSql() {
  if (!neonEnabled() || !companyRuntimeConfigured()) {
    throw new Error("MARIZ restricted SQL runtime is not configured");
  }
  return companyRuntimeSql();
}
export type MarizCompany = {
  organization_id:string;legal_name:string;registration_no:string;entity_type:string;
  verification_status:string;kyb_status:string|null;pos_status:string|null;member_role:string;
};
export async function currentVerifiedUser() {
  const {data,error}=await neonAuth().getSession();
  const user=data?.user;
  if(error||!user||user.emailVerified !== true)return null;
  return user;
}
export async function myCompanies(_userId:string):Promise<MarizCompany[]> {
  // The database derives identity from auth.user_id() in the verified JWT.
  // Do not transmit a caller-supplied actor UUID to SECURITY DEFINER functions.
  // Auth updates can become visible to the data endpoint just after sign-in.
  // Retry this read only; every attempt still requires the database's verified-user check.
  let rows:unknown;
  for(let attempt=0;;attempt++){
    try{rows=await coRpc<unknown>('api_my_companies');break;}
    catch(error){
      const e=error as {code?:string;dbCode?:string};
      if(attempt>=2||e.code!=='CO_RPC_HTTP_400'||e.dbCode!=='P0001')throw error;
      await delay(attempt===0?250:750);
    }
  }
  if(!Array.isArray(rows))throw new Error("MARIZ CO company response invalid");
  return rows as MarizCompany[];
}
export async function isVerifiedCompanyMember(userId:string) {
  return (await myCompanies(userId)).some(c=>c.verification_status==="verified");
}
