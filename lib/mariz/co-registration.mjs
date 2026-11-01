import {createHash} from "node:crypto";

export function registrationSlug(actorId, registrationNo) {
  const normalized = registrationNo.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!actorId || normalized.length < 4 || normalized.length > 80) throw new Error("Invalid registration");
  return "mariz-" + createHash("sha256").update(actorId + "\0" + normalized).digest("hex").slice(0, 40);
}

// Dependencies are server-owned. Never accept an organization ID from the form.
// Stable slug + Auth's unique slug constraint arbitrate concurrent requests.
export async function registerCompanyRecoverably({actorId, profile, auth, rpc}) {
  const slug = registrationSlug(actorId, profile.p_registration_no);
  async function find() {
    const {data, error} = await auth.organization.list();
    if (error || !Array.isArray(data)) throw new Error("Organization lookup unavailable");
    return data.find(org => org.slug === slug);
  }
  let org = await find();
  if (!org) {
    try {
      const result = await auth.organization.create({name: profile.p_legal_name, slug});
      if (!result.error && result.data?.id) org = result.data;
    } catch { /* An ambiguous timeout may still have created the organization. */ }
    if (!org) org = await find();
  }
  if (!org?.id) throw new Error("Organization creation unavailable");
  // A failed or timed-out profile write retains the same recoverable organization.
  // RPC migration 007 makes repeated identical writes return the existing profile.
  return rpc("api_register_company", {...profile, p_organization: org.id});
}
