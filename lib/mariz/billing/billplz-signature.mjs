import { createHmac, timingSafeEqual } from "node:crypto";

/** Billplz callback X Signature: build key+value source strings, sort, pipe join. */
export function billplzSignaturePayload(fields) {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) throw new Error("Invalid callback fields");
  return Object.entries(fields)
    .filter(([key]) => key.toLowerCase() !== "x_signature")
    .map(([key, value]) => key + String(value ?? ""))
    .sort((a, b) => {
      const left = a.toLowerCase();
      const right = b.toLowerCase();
      return left < right ? -1 : left > right ? 1 : 0;
    })
    .join("|");
}

export function billplzSignatureHex(fields, secret) {
  if (typeof secret !== "string" || !secret) throw new Error("Billplz signature secret not configured");
  return createHmac("sha256", secret).update(billplzSignaturePayload(fields)).digest("hex");
}

export function verifyBillplzSignature(fields, secret) {
  if (!fields || typeof fields.x_signature !== "string" || !/^[a-f0-9]{64}$/i.test(fields.x_signature)) return false;
  const expected = Buffer.from(billplzSignatureHex(fields, secret), "hex");
  const provided = Buffer.from(fields.x_signature, "hex");
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}
