"use server";
import { redirect } from "next/navigation";
import { marizServerClient } from "../../../lib/mariz/supabase-server";

function err(message:string):never { redirect("/admin/kyb?notice="+encodeURIComponent(message)); }
function uuid(v: FormDataEntryValue|null) {
 const s=String(v||"");
 if(!/^[0-9a-f-]{36}$/i.test(s)) err("Invalid application identifier");
 return s;
}
async function authorized(){
 const sb=await marizServerClient();
 const {data:{user}}=await sb.auth.getUser();
 if(!user)err("Sign in required");
 const {data,error}=await sb.rpc("mariz_my_reviewer_status");
 if(error || data!==true) err("Access denied");
 return sb;
}
export async function recordCheck(form:FormData){
 const sb=await authorized();
 const application=uuid(form.get("application"));
 const code=String(form.get("check_code")||"");
 const result=String(form.get("result")||"");
 const notes=String(form.get("notes")||"").slice(0,2000);
 if(!["registry","identity","authority","documents","duplicate","contact"].includes(code) ||
 !["pass","fail","needs_review"].includes(result))err("Invalid check");
 const {error}=await sb.rpc("mariz_record_kyb_check",{
 p_application:application,p_check_code:code,p_result:result,p_notes:notes
 });
 if(error)err("Check could not be recorded.");
 redirect("/admin/kyb?notice=Verification%20check%20recorded");
}
export async function decideKyb(form:FormData){
 const sb=await authorized();
 const application=uuid(form.get("application"));
 const decision=String(form.get("decision")||"");
 const reason=String(form.get("reason")||"").trim().slice(0,2000);
 if(!["approved","rejected","needs_information"].includes(decision)||reason.length<4)err("A valid decision and reason are required.");
 const {error}=await sb.rpc("mariz_review_kyb",{p_application:application,p_decision:decision,p_reason:reason});
 if(error)err("Decision denied. For approval, verify all six checks have passed and supporting documents exist.");
 redirect("/admin/kyb?notice=KYB%20decision%20recorded");
}
