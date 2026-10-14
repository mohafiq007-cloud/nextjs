import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createHash, createHmac, randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";

export const DEVICE_COOKIE="mariz_v2_pos_device";
export const STAFF_COOKIE="mariz_v2_pos_staff";

export function terminalBackendEnabled(){
 return process.env.MARIZ_POS_LIVE_TERMINALS_ENABLED==="true" &&
 Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
 Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
 Boolean(process.env.MARIZ_POS_PIN_PEPPER && process.env.MARIZ_POS_PIN_PEPPER.length>=32);
}
export function requireTerminalBackend(){
 if(!terminalBackendEnabled()) throw new Error("POS terminal backend disabled");
 return createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}
 );
}
export const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const digest=(secret:string)=>createHash("sha256").update(secret).digest("hex");
export const mintSecret=()=>randomBytes(32).toString("base64url");
export function pinHmac(staffId:string,pin:string){
 if(!uuidPattern.test(staffId)||!/^[0-9]{6,8}$/.test(pin))throw new Error("Invalid PIN format");
 const pepper=process.env.MARIZ_POS_PIN_PEPPER;
 if(!pepper||pepper.length<32)throw new Error("PIN pepper unavailable");
 return createHmac("sha256",pepper).update(staffId+":"+pin).digest("hex");
}
export function parseDeviceCookie(raw:string|undefined){
 if(!raw)return null;
 const [device,secret,extra]=raw.split(".");
 if(extra!==undefined||!uuidPattern.test(device)||!secret||!/^[a-zA-Z0-9_-]{40,60}$/.test(secret))
  return null;
 return {device,tokenSha256:digest(secret)};
}
export function verifySameOrigin(request:NextRequest){
 const origin=request.headers.get("origin");
 const expected=new URL(request.url).origin;
 return Boolean(origin&&origin===expected);
}
export async function readJsonObject(request:NextRequest,maxBytes=1200):Promise<Record<string,unknown>|null>{
 const declared=Number(request.headers.get("content-length")||0);
 if(declared>maxBytes)return null;
 try{
  const data=await request.text();
  if(Buffer.byteLength(data,"utf8")>maxBytes)return null;
  const parsed:unknown=JSON.parse(data);
  if(!parsed||Array.isArray(parsed)||typeof parsed!=="object")return null;
  return parsed as Record<string,unknown>;
 }catch{return null;}
}
