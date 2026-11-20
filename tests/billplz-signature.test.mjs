import test from "node:test";
import assert from "node:assert/strict";
import { billplzSignaturePayload, billplzSignatureHex, verifyBillplzSignature } from "../lib/mariz/billing/billplz-signature.mjs";

test("Billplz signature sorts fields case-insensitively and excludes signature", () => {
  const data = { paid: "true", id: "abc123", amount: "100", x_signature: "ignored" };
  assert.equal(billplzSignaturePayload(data), "amount100|idabc123|paidtrue");
});

test("Billplz signature accepts a signed callback but rejects tampering", () => {
  const payload = { id: "ABC123", paid: "true", state: "paid", amount: "100" };
  const x_signature = billplzSignatureHex(payload, "sandbox-test-secret");
  assert.equal(verifyBillplzSignature({ ...payload, x_signature }, "sandbox-test-secret"), true);
  assert.equal(verifyBillplzSignature({ ...payload, amount: "999", x_signature }, "sandbox-test-secret"), false);
  assert.equal(verifyBillplzSignature({ ...payload, x_signature: "000" }, "sandbox-test-secret"), false);
});

test("Billplz signature is insensitive to inbound key order", () => {
  const a = { amount: "100", paid: "true", id: "ABC123" };
  const b = { id: "ABC123", amount: "100", paid: "true" };
  assert.equal(billplzSignatureHex(a, "test"), billplzSignatureHex(b, "test"));
});

test("official callback source-string ordering puts paid_amount before paidtrue",()=>{
 assert.equal(billplzSignaturePayload({paid:"true",paid_amount:"100",amount:"100",state:"paid"}),"amount100|paid_amount100|paidtrue|statepaid");
});
