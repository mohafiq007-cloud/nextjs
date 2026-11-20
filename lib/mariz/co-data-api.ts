import "server-only";
import {
  callVerifiedRpc,
  validateNeonDataApiUrl,
  type CoRpcName,
} from "./co-data-api-request.mjs";

export function coDataApiConfigured() {
  try {
    validateNeonDataApiUrl(process.env.NEON_DATA_API_URL);
    return true;
  } catch {
    return false;
  }
}

export function invokeCoRpc<T>(token: string, name: CoRpcName, params: Record<string,string> = {}) {
  return callVerifiedRpc<T>({
    url: process.env.NEON_DATA_API_URL,
    token,
    name,
    params,
  });
}
