import "server-only";
import {billingRuntimeSql} from "../neon-runtime-server";
import {createBillplzSandboxBill,getBillplzSandboxBill} from "./billplz";
export function sandboxBillingDependencies(){
 return {sql:billingRuntimeSql(),provider:{create:createBillplzSandboxBill,get:getBillplzSandboxBill},collection:process.env.BILLPLZ_COLLECTION_ID!};
}
