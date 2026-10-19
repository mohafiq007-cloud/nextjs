"use client";
import {useRef,useState,type FormEvent} from "react";
type Invoice={id:string;status:string;payment_url:string|null;issuance_state:string};
export default function SandboxInvoiceForm(){
 const key=useRef<string|null>(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[invoice,setInvoice]=useState<Invoice|null>(null),[recoveryId,setRecoveryId]=useState(""),[uncertain,setUncertain]=useState(false);
 async function send(route:string,body:object){
  const response=await fetch("/api/payments/billplz/"+route,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify(body)});
  const data=await response.json();if(!response.ok){if(typeof data.requestId==="string"){setRecoveryId(data.requestId);setUncertain(true);}throw new Error(data.error==="invoice_requires_reconciliation"?"Issuance is uncertain. Reconcile this invoice before issuing again.":response.status===403?"Operator or company access was denied.":"The sandbox could not complete this request. Check configuration and try reconciliation if a bill may exist.");}return data.invoice as Invoice;
 }
 async function issue(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy||uncertain)return;const form=new FormData(event.currentTarget);setBusy(true);setNotice("");
  try{key.current??=crypto.randomUUID();const next=await send("invoices",{organizationId:form.get("organizationId"),idempotencyKey:key.current,amountMinor:Number(form.get("amountMinor")),customerName:form.get("customerName"),customerEmail:form.get("customerEmail"),description:form.get("description")});setInvoice(next);setRecoveryId(next.id);setNotice("Sandbox bill registered. You can open hosted checkout.");}
  catch(e){setNotice(e instanceof Error?e.message:"Request failed");}finally{setBusy(false);}
 }
 async function reconcile(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;const form=new FormData(event.currentTarget);setBusy(true);setNotice("");
  try{const providerBillId=String(form.get("providerBillId")||"").trim();const next=await send("reconcile",{requestId:recoveryId,...(providerBillId?{providerBillId}:{})});setInvoice(next);setUncertain(false);setNotice("Provider status reconciled: "+next.status+". Product access is unchanged.");}
  catch(e){setNotice(e instanceof Error?e.message:"Reconciliation failed");}finally{setBusy(false);}
 }
 return <>
  <section className="content-panel"><h2>Create a sandbox invoice</h2><form method="post" action="/api/payments/billplz/invoices" onSubmit={issue} className="form-grid">
   <label>Approved test company UUID<input name="organizationId" required/></label><label>Amount in MYR cents<input name="amountMinor" type="number" min="100" max="2147483647" step="1" required/></label>
   <label>Test recipient name<input name="customerName" minLength={2} maxLength={255} required/></label><label>Test recipient email<input name="customerEmail" type="email" maxLength={254} required/></label>
   <label className="full">Invoice description<input name="description" maxLength={200} required/></label><button className="button button-primary" disabled={busy||uncertain||Boolean(invoice)}>Create sandbox bill</button>
  </form></section>
  <p role="status" aria-live="polite">{notice}</p>
  {invoice&&<section className="content-panel"><h2>Invoice {invoice.status}</h2><p>Reference: {invoice.id}</p>{invoice.status!=="void"&&invoice.payment_url&&/^https:\/\/www\.billplz-sandbox\.com\/bills\/[a-zA-Z0-9_-]+$/.test(invoice.payment_url)&&<a className="button button-primary" href={invoice.payment_url} target="_blank" rel="noopener noreferrer">Open sandbox hosted checkout</a>}{!uncertain&&<button className="button button-outline" disabled={busy} onClick={()=>{key.current=null;setInvoice(null);setRecoveryId("");setNotice("");}}>Start another test invoice</button>}</section>}
  <section className="content-panel"><h2>Reconcile a sandbox invoice</h2><p>For an uncertain creation, find the existing bill in the sandbox dashboard. Do not create another bill to retry it.</p><form method="post" action="/api/payments/billplz/reconcile" onSubmit={reconcile} className="form-grid">
   <label>MARIZ invoice UUID<input value={recoveryId} onChange={e=>setRecoveryId(e.target.value)} required/></label><label>Existing Billplz bill ID (only if not registered)<input name="providerBillId" maxLength={64}/></label><button className="button button-outline" disabled={busy}>Reconcile provider status</button>
  </form></section>
 </>;
}
