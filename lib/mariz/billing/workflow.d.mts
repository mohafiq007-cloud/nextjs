export type SandboxInvoice={id:string;organization_id:string;amount_minor:number;collection_id:string;provider_bill_id:string|null;payment_url:string|null;status:string;issuance_state:string};
type Bill={id:string;collection_id:string;amount:number;paid:boolean;state:string;url:string;reference_1?:string;reference_2?:string};
type Deps={sql:{query:(text:string,params:unknown[])=>Promise<unknown[]>};provider:{create:(input:{amountMinor:number;customerName:string;customerEmail:string;description:string;organizationId:string;requestId:string})=>Promise<Bill>;get:(id:string)=>Promise<Bill>};collection:string};
export function issueSandboxInvoice(deps:Deps,actor:string,input:{organizationId:string;idempotencyKey:string;amountMinor:number;customerName:string;customerEmail:string;description:string}):Promise<SandboxInvoice>;
export function reconcileSandboxInvoice(deps:Deps,actor:string,input:{requestId:string;providerBillId?:string}):Promise<SandboxInvoice>;
