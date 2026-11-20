export type CoRpcName = "api_my_companies" | "api_register_company" | "api_start_kyb";
export function validateNeonDataApiUrl(raw: unknown): string;
export function callVerifiedRpc<T>(args: {
  url: unknown;
  token: unknown;
  name: CoRpcName;
  params?: Record<string, string>;
  fetcher?: typeof fetch;
}): Promise<T>;
