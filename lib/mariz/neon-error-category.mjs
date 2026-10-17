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
    return categories.get(error?.code) ?? "database_request_failed";
  } catch {
    return "database_request_failed";
  }
}
