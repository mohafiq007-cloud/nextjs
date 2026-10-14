"use server";
import { createHash, randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { marizServerClient } from "../../../lib/mariz/supabase-server";

function goError(message: string): never { redirect("/co/workspace?message=" + encodeURIComponent(message)); }
function safeUUID(value: FormDataEntryValue | null): string {
  const s = String(value || "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) goError("Invalid company or application identifier");
  return s;
}
async function requireUser() {
  const supabase = await marizServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || !user.email_confirmed_at) redirect("/co/auth?message=Please%20verify%20your%20account");
  return { supabase, user };
}
export async function createCompany(form: FormData) {
  const { supabase } = await requireUser();
  const country = String(form.get("country") || "MY").trim().toUpperCase();
  const entity = String(form.get("entity_type") || "");
  const legal = String(form.get("legal_name") || "").trim();
  const reg = String(form.get("registration_no") || "").trim();
  const address = String(form.get("address") || "").trim();
  const email = String(form.get("business_email") || "").trim();
  if (country !== "MY" || !["company","sole_proprietor","partnership","llp","society","other"].includes(entity)
      || legal.length < 3 || reg.length < 4 || address.length < 8
      || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
      || form.get("authority_confirmation") !== "yes") goError("Complete all legal fields and authority confirmation");
  const { error } = await supabase.rpc("mariz_register_company", {
    p_legal_name: legal, p_entity_type: entity, p_registration_no: reg,
    p_registered_address: address, p_business_email: email, p_country: country, p_registrar: "SSM"
  });
  if (error) goError("Company could not be created. Check for duplicate registration details or contact support.");
  redirect("/co/workspace?message=Company%20draft%20created");
}
export async function startKyb(form: FormData) {
  const { supabase } = await requireUser();
  const id = safeUUID(form.get("organization_id"));
  const { error } = await supabase.rpc("mariz_start_kyb", { p_org: id });
  if (error) goError("Unable to start KYB application. Verify your company permissions.");
  redirect("/co/workspace?message=KYB%20application%20created");
}
export async function uploadKybDocument(form: FormData) {
  const { supabase, user } = await requireUser();
  const org = safeUUID(form.get("organization_id"));
  const application = safeUUID(form.get("application_id"));
  const documentType = String(form.get("document_type") || "");
  if (!["registration_profile","authority_letter","registration_certificate","other"].includes(documentType))
    goError("Invalid document category");
  const file = form.get("document");
  if (!(file instanceof File) || file.size < 16 || file.size > 10*1024*1024) goError("Upload a document between 16 bytes and 10 MB");
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = bytes.subarray(0,4).toString("hex") === "25504446" ? "application/pdf"
    : bytes.subarray(0,8).toString("hex") === "89504e470d0a1a0a" ? "image/png"
    : bytes.subarray(0,3).toString("hex") === "ffd8ff" ? "image/jpeg" : null;
  if (!mime) goError("Only PDF, PNG and JPEG documents are accepted");
  const ext = mime==="application/pdf"?"pdf":mime==="image/png"?"png":"jpg";
  const storagePath = org+"/"+application+"/"+randomUUID()+"."+ext;
  // RLS verifies this actor owns an active KYB application and that the path matches.
  const { error: storageError } = await supabase.storage.from("mariz-kyb-private")
    .upload(storagePath,bytes,{contentType:mime,upsert:false,cacheControl:"0"});
  if (storageError) goError("Document upload was denied or failed");
  const sha256=createHash("sha256").update(bytes).digest("hex");
  const { error: metadataError } = await supabase.from("mariz_kyb_documents").insert({
    application_id:application,uploaded_by:user.id,document_type:documentType,storage_path:storagePath,file_sha256:sha256
  });
  if (metadataError) goError("File was uploaded but could not be attached. Please contact support; do not assume submission succeeded.");
  redirect("/co/workspace?message=Document%20uploaded%20securely");
}
export async function submitKyb(form: FormData) {
  const { supabase } = await requireUser();
  const id = safeUUID(form.get("application_id"));
  if (form.get("declaration") !== "yes") goError("Authority and accuracy declaration required");
  const { error } = await supabase.rpc("mariz_submit_kyb", { p_application:id });
  if (error) goError("Unable to submit KYB. Ensure an official registration profile has been uploaded.");
  redirect("/co/workspace?message=KYB%20submitted%20for%20manual%20review");
}
