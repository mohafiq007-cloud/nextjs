// Pure validation only. Connection factories importing this module remain server-only.
const roles = Object.freeze({
  company: "mariz_runtime_restricted",
  billing: "mariz_billing_runtime_limited",
});
const message = "Invalid isolated MARIZ database connection configuration";

export function validateMarizDatabaseUrl(raw, purpose, expectedHost) {
  if (!Object.hasOwn(roles, purpose) || typeof raw !== "string" ||
      typeof expectedHost !== "string" ||
      !/^[a-z0-9-]+(?:-pooler)?[.]c-[0-9]+[.]ap-southeast-1[.]aws[.]neon[.]tech$/.test(expectedHost)) {
    throw new Error(message);
  }
  let url;
  try { url = new URL(raw); } catch { throw new Error(message); }
  const params = url.searchParams;
  if (!["postgres:", "postgresql:"].includes(url.protocol) ||
      url.hostname !== expectedHost || (url.port && url.port !== "5432") ||
      url.pathname !== "/marizhq_v2" || url.username !== roles[purpose] ||
      !url.password || url.hash ||
      params.getAll("sslmode").length !== 1 ||
      !["require", "verify-full"].includes(params.get("sslmode")) ||
      params.getAll("channel_binding").length !== 1 ||
      params.get("channel_binding") !== "require" ||
      [...params.keys()].some(key => !["sslmode", "channel_binding", "application_name"].includes(key))) {
    throw new Error(message);
  }
  return raw;
}
