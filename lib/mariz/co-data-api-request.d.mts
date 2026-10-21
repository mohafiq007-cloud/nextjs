export type CoRpcName = "api_my_companies" | "api_register_company" | "api_start_kyb" | "api_kyb_state" | "api_add_kyb_document" | "api_submit_kyb" | "api_kyb_reviewer_status" | "api_kyb_review_queue" | "api_kyb_document_access" | "api_accept_kyb_document" | "api_record_kyb_check" | "api_decide_kyb_step_up";
export function validateNeonDataApiUrl(raw: unknown): string;
export function callVerifiedRpc<T>(args: {
  url: unknown;
  token: unknown;
  name: CoRpcName;
  params?: Record<string, string>;
  fetcher?: typeof fetch;
}): Promise<T>;
