// Log only fixed categories. Driver messages and connection details can contain secrets.
const categories = new Map([
  ["28P01", "database_authentication_failed"],
  ["28000", "database_authentication_rejected"],
  ["42501", "database_permission_denied"],
  ["42883", "database_function_missing"],
  ["3F000", "database_schema_missing"],
  ["42P01", "database_relation_missing"],
  ["22P02", "database_invalid_identifier"],
  ["P0001", "database_authorization_rejected"],
]);

export function neonErrorCategory(error) {
  try {
    const sqlCategory = categories.get(error?.code);
    if (sqlCategory) return sqlCategory;
    // Neon HTTP errors can omit SQLSTATE. Inspect locally, emit fixed labels only.
    const message = typeof error?.message === "string" ? error.message : "";
    if (/password authentication failed/i.test(message)) return "database_authentication_failed";
    const httpStatus = /^Server error \(HTTP status ([0-9]{3})\):/.exec(message)?.[1];
    const httpCategories = new Map([
      ["401", "database_http_unauthorized"],
      ["403", "database_http_forbidden"],
      ["404", "database_http_not_found"],
      ["421", "database_http_misdirected"],
      ["429", "database_http_rate_limited"],
      ["500", "database_http_internal_error"],
      ["502", "database_http_bad_gateway"],
      ["503", "database_http_unavailable"],
      ["504", "database_http_gateway_timeout"],
    ]);
    if (httpStatus) return httpCategories.get(httpStatus) ?? "database_http_error";
    const networkCategories = new Map([
      ["ENOTFOUND", "database_dns_failed"],
      ["EAI_AGAIN", "database_dns_failed"],
      ["ECONNREFUSED", "database_connection_refused"],
      ["ECONNRESET", "database_connection_reset"],
      ["ETIMEDOUT", "database_connection_timeout"],
      ["UND_ERR_CONNECT_TIMEOUT", "database_connection_timeout"],
      ["CERT_HAS_EXPIRED", "database_tls_failed"],
      ["UNABLE_TO_VERIFY_LEAF_SIGNATURE", "database_tls_failed"],
    ]);
    const source = error?.sourceError;
    const networkCategory = networkCategories.get(error?.code) ??
      networkCategories.get(source?.code) ?? networkCategories.get(source?.cause?.code);
    if (networkCategory) return networkCategory;
    if (source) return "database_transport_failed";
    if (typeof error?.code === "string" && /^[0-9A-Z]{5}$/.test(error.code)) return "database_sql_error";
    return "database_request_failed";
  } catch {
    return "database_request_failed";
  }
}
