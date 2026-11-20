import "server-only";
import {neon} from "@neondatabase/serverless";
import {validateMarizDatabaseUrl} from "./neon-runtime-policy.mjs";

export function companyRuntimeConfigured() {
  try {
    validateMarizDatabaseUrl(process.env.MARIZ_NEON_DATABASE_URL, "company", process.env.MARIZ_NEON_DATABASE_HOST);
    return true;
  } catch { return false; }
}

export function companyRuntimeSql() {
  return neon(validateMarizDatabaseUrl(
    process.env.MARIZ_NEON_DATABASE_URL,
    "company",
    process.env.MARIZ_NEON_DATABASE_HOST
  ));
}

export function billingRuntimeConfigured() {
  try {
    validateMarizDatabaseUrl(
      process.env.MARIZ_BILLING_DATABASE_URL,
      "billing",
      process.env.MARIZ_NEON_DATABASE_HOST
    );
    return true;
  } catch { return false; }
}

export function billingRuntimeSql() {
  // Deliberately no fallback to the broader company connection.
  return neon(validateMarizDatabaseUrl(
    process.env.MARIZ_BILLING_DATABASE_URL,
    "billing",
    process.env.MARIZ_NEON_DATABASE_HOST
  ));
}
