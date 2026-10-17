import "server-only";

/**
 * MARIZ HQ Billplz sandbox adapter.
 * No public payment-creation route, prices, schedules, or entitlement changes.
 * No production credentials are accepted by this version.
 */
export type BillplzBill = {
  id: string;
  collection_id: string;
  amount: number;
  paid: boolean;
  state: string;
  url: string;
};

export function billplzSandboxConfigured() {
  return (
    process.env.MARIZ_BILLPLZ_ENABLED === "true" &&
    process.env.BILLPLZ_ENV === "sandbox" &&
    Boolean(
      process.env.BILLPLZ_SECRET_KEY &&
      process.env.BILLPLZ_COLLECTION_ID &&
      process.env.BILLPLZ_X_SIGNATURE_KEY &&
      process.env.BILLPLZ_PUBLIC_BASE_URL
    )
  );
}

export function billplzCallbackUrl() {
  if (!billplzSandboxConfigured()) throw new Error("Billplz sandbox integration is disabled");
  const url = new URL("/api/payments/billplz/callback", process.env.BILLPLZ_PUBLIC_BASE_URL!);
  const expected = new URL(process.env.BILLPLZ_PUBLIC_BASE_URL!);
  if (expected.protocol !== "https:" || url.origin !== expected.origin) {
    throw new Error("Billplz public base URL must be HTTPS");
  }
  return url.toString();
}

export async function createBillplzSandboxBill(input: {
  amountMinor: number;
  customerName: string;
  customerEmail: string;
  description: string;
}): Promise<BillplzBill> {
  if (!billplzSandboxConfigured()) throw new Error("Billplz sandbox integration is disabled");
  if (
    !Number.isSafeInteger(input.amountMinor) ||
    input.amountMinor < 100 ||
    input.amountMinor > 2_147_483_647 ||
    input.customerName.trim().length < 2 ||
    input.customerName.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.customerEmail) ||
    !input.description.trim() ||
    input.description.length > 200
  ) throw new Error("Invalid sandbox Billplz bill details");

  const callbackUrl = billplzCallbackUrl();
  const form = new URLSearchParams({
    collection_id: process.env.BILLPLZ_COLLECTION_ID!,
    name: input.customerName.trim(),
    email: input.customerEmail.trim(),
    amount: String(input.amountMinor),
    description: input.description.trim(),
    callback_url: callbackUrl,
  });
  const response = await fetch("https://www.billplz-sandbox.com/api/v3/bills", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(process.env.BILLPLZ_SECRET_KEY! + ":").toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: form.toString(),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Billplz sandbox create bill request failed: HTTP " + response.status);
  const data: unknown = await response.json();
  if (typeof data !== "object" || !data) throw new Error("Invalid Billplz response");
  const bill = data as Partial<BillplzBill>;
  if (
    typeof bill.id !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(bill.id) ||
    bill.collection_id !== process.env.BILLPLZ_COLLECTION_ID ||
    bill.amount !== input.amountMinor ||
    typeof bill.url !== "string"
  ) throw new Error("Unexpected Billplz bill response");
  const paymentUrl = new URL(bill.url);
  if (paymentUrl.protocol !== "https:" || paymentUrl.hostname !== "www.billplz-sandbox.com") {
    throw new Error("Unexpected Billplz sandbox checkout destination");
  }
  return bill as BillplzBill;
}
