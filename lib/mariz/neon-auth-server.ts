import "server-only";
import {companyRuntimeConfigured} from "./neon-runtime-server";
import {createNeonAuth} from "@neondatabase/auth/next/server";
export function neonBackendConfigured(){return process.env.NEON_V2_ENABLED==="true"&&Boolean(process.env.NEON_AUTH_BASE_URL&&process.env.NEON_AUTH_COOKIE_SECRET&&process.env.NEON_AUTH_COOKIE_SECRET.length>=32&&companyRuntimeConfigured());}
export function neonPublicSignupsEnabled(){return neonBackendConfigured()&&process.env.MARIZ_CO_PUBLIC_SIGNUP_ENABLED==="true"&&process.env.MARIZ_EMAIL_VERIFICATION_ENFORCED==="true";}
export function getNeonAuth(){
 if(!neonBackendConfigured())throw new Error("MARIZ V2 Neon backend unavailable");
 return createNeonAuth({baseUrl:process.env.NEON_AUTH_BASE_URL!,cookies:{secret:process.env.NEON_AUTH_COOKIE_SECRET!,sessionDataTtl:120}});
}
export async function getVerifiedNeonUser(){
 const {data,error}=await getNeonAuth().getSession();
 if(error||!data?.user||data.user.emailVerified!==true)return null;
 return {id:data.user.id,email:data.user.email,name:data.user.name};
}
