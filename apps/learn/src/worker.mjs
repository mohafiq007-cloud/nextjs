import { publicCatalog } from "./learning.mjs";

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin"
  }
});

function bearerHeader(request) {
  const value = request.headers.get("authorization") ?? "";
  return /^Bearer [A-Za-z0-9._~+/-]+=*$/.test(value) && value.length <= 12000 ? value : null;
}

// Read the actual streamed body size, not just the caller-controlled Content-Length.
async function limitedJsonBody(request, maxBytes) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return { status: 415, error: "JSON content type required" };
  }
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > maxBytes) return { status: 413, error: "Response is too large" };
  if (!request.body) return { status: 400, error: "Expected JSON" };
  const reader = request.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        return { status: 413, error: "Response is too large" };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let position = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, position);
      position += chunk.byteLength;
    }
    return { data: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) };
  } catch {
    return { status: 400, error: "Expected valid UTF-8 JSON" };
  } finally {
    reader.releaseLock();
  }
}

async function neonRpc(env, bearer, method, payload) {
  const endpoint = env.NEON_DATA_API_URL;
  if (!endpoint || !endpoint.startsWith("https://")) {
    return json({ error: "Data service not configured" }, 503);
  }
  const url = new URL(endpoint.replace(/\/+$/, "") + "/rpc/" + method);
  // This Worker only permits the configured Neon REST host.
  if (!url.hostname.endsWith(".neon.tech") || url.username || url.password) {
    return json({ error: "Invalid data service configuration" }, 503);
  }
  let response;
  try {
    response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: bearer,
      "content-type": "application/json",
      "content-profile": "mariz_learn",
      "accept-profile": "mariz_learn",
      accept: "application/json"
    },
    body: JSON.stringify(payload),
    redirect: "error"
    });
  } catch {
    return json({ error: "Learning service temporarily unavailable" }, 502);
  }
  if (response.status === 401 || response.status === 403) {
    return json({ error: "Access denied or membership unavailable" }, response.status);
  }
  if (!response.ok) return json({ error: "Learning service temporarily unavailable" }, 502);
  let data;
  try { data = await response.json(); } catch { return json({ error: "Invalid service response" }, 502); }
  return json(data);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({ service: "mariz-learn", preview: true, memberApi: env.LEARN_API_ENABLED === "true" });
    }
    if (url.pathname === "/api/catalog" && request.method === "GET") {
      return json(publicCatalog());
    }
    if (url.pathname.startsWith("/api/")) {
      if (env.LEARN_API_ENABLED !== "true") return json({ error: "Member service is not yet activated" }, 503);
      const auth = bearerHeader(request);
      if (!auth) return json({ error: "Verified member session required" }, 401);
      if (url.pathname === "/api/state" && request.method === "GET") {
        return neonRpc(env, auth, "api_learn_state", {});
      }
      if (url.pathname === "/api/attempt" && request.method === "POST") {
        const parsed = await limitedJsonBody(request, 10000);
        if (parsed.status) return json({ error: parsed.error }, parsed.status);
        const body = parsed.data;
        if (!body || typeof body.scenarioId !== "string" || typeof body.response !== "string") {
          return json({ error: "Missing scenario or response" }, 400);
        }
        if (body.response.trim().length < 1 || body.response.length > 2000 || body.scenarioId.length > 120) {
          return json({ error: "Response must be 1–2000 characters" }, 422);
        }
        return neonRpc(env, auth, "api_record_attempt", {
          p_scenario_id: body.scenarioId,
          p_response: body.response.trim()
        });
      }
      return json({ error: "Not found" }, 404);
    }
    if (request.method !== "GET" && request.method !== "HEAD") return json({ error: "Method not allowed" }, 405);
    const asset = await env.ASSETS.fetch(request);
    const headers = new Headers(asset.headers);
    headers.set("x-content-type-options", "nosniff");
    headers.set("referrer-policy", "strict-origin-when-cross-origin");
    headers.set("x-frame-options", "DENY");
    headers.set("content-security-policy", "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    return new Response(asset.body, { status: asset.status, statusText: asset.statusText, headers });
  }
};
