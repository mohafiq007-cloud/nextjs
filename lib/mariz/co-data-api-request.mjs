// Pure, unit-testable boundary for the isolated MARIZ CO Neon Data API.
// Never pass an opaque Better Auth session token or privileged database credential.
const expectedHosts = new Set([
 "ep-twilight-lake-aomjxn05.apirest.c-2.ap-southeast-1.aws.neon.tech",
 // Dedicated CO onboarding staging branch, verified through Neon on 21 October.
 "ep-misty-mouse-aoq558cc.apirest.c-2.ap-southeast-1.aws.neon.tech",
]);
const rpcNames = new Set(["api_my_companies", "api_register_company", "api_start_kyb", "api_kyb_state", "api_add_kyb_document", "api_submit_kyb", "api_kyb_reviewer_status", "api_kyb_review_queue", "api_kyb_document_access", "api_accept_kyb_document", "api_record_kyb_check", "api_decide_kyb_step_up"]);
const errorMessage = "MARIZ CO secure company service unavailable";

export function validateNeonDataApiUrl(raw) {
  if (typeof raw !== "string") throw new Error(errorMessage);
  let url;
  try { url = new URL(raw); } catch { throw new Error(errorMessage); }
  if (url.protocol !== "https:" || !expectedHosts.has(url.hostname) ||
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
  if (!response.ok) {
    const body=await response.json().catch(()=>null);
    const dbCode=typeof body?.code==='string'&&/^[A-Z0-9_]{2,40}$/.test(body.code)?body.code:'UNKNOWN';
    throw Object.assign(new Error(errorMessage),{code:'CO_RPC_HTTP_'+response.status,dbCode});
  }
  return response.json();
}
