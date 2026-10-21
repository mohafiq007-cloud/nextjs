// Pure, unit-testable boundary for the isolated MARIZ CO Neon Data API.
// Never pass an opaque Better Auth session token or privileged database credential.
const expectedHost = "ep-twilight-lake-aomjxn05.apirest.c-2.ap-southeast-1.aws.neon.tech";
const rpcNames = new Set(["api_my_companies", "api_register_company", "api_start_kyb"]);
const errorMessage = "MARIZ CO secure company service unavailable";

export function validateNeonDataApiUrl(raw) {
  if (typeof raw !== "string") throw new Error(errorMessage);
  let url;
  try { url = new URL(raw); } catch { throw new Error(errorMessage); }
  if (url.protocol !== "https:" || url.hostname !== expectedHost ||
      url.port || url.pathname !== "/marizhq_v2/rest/v1" ||
      url.search || url.hash || url.username || url.password) {
    throw new Error(errorMessage);
  }
  return url.toString().replace(/\/$/, "");
}

export async function callVerifiedRpc({url, token, name, params = {}, fetcher = fetch}) {
  const base = validateNeonDataApiUrl(url);
  if (!rpcNames.has(name) || typeof token !== "string" ||
      !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token) ||
      params === null || typeof params !== "object" || Array.isArray(params) ||
      Object.values(params).some(value => typeof value !== "string")) {
    throw new Error(errorMessage);
  }
  const response = await fetcher(base + "/rpc/" + name, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      "Content-Profile": "mariz_core",
      "Accept-Profile": "mariz_core",
      Accept: "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(params),
    cache: "no-store",
    redirect: "error",
  });
  // Do not leak database/identity-provider errors, PII or the bearer token into the UI.
  if (!response.ok) throw new Error(errorMessage);
  return response.json();
}
