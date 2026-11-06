'use server';
import {headers} from 'next/headers';import {redirect} from 'next/navigation';import {randomUUID} from 'node:crypto';
import {commercialActor,commercialService,commercialWorkspace,deliverCommercial} from '../../../lib/mariz/pos-commercial-server.mjs';
const uuid=(raw:FormDataEntryValue|null)=>typeof raw==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(raw)?raw:null;
async function sameOrigin(){const h=await headers();const origin=process.env.MARIZ_POS_PILOT_ORIGIN;if(!origin||h.get('origin')!==origin)throw Error('Refresh this Preview before submitting');}
export async function createCommercialQuote(form:FormData){
 await sameOrigin();const actor=await commercialActor(),outlet=uuid(form.get('outletId'));if(!outlet)throw Error('Select your outlet');
 await commercialService().quote(actor.id,outlet,randomUUID());redirect('/co/workspace?section=billing');
}
export async function acceptCommercialQuote(form:FormData){
 await sameOrigin();const actor=await commercialActor(),outlet=uuid(form.get('outletId')),quote=uuid(form.get('quoteId')),digest=form.get('acceptanceDigest');
 if(!outlet||!quote||form.get('accept')!=='on'||typeof digest!=='string'||!/^[a-f0-9]{64}$/.test(digest))throw Error('Review and accept the quotation first');
 const invoice=await commercialService().accept(actor.id,outlet,quote,digest,{name:actor.name,email:actor.email});
 if(invoice.issuance_state!=='registered'||typeof invoice.payment_url!=='string')redirect('/co/workspace?section=billing');
 const url=new URL(invoice.payment_url);if(url.origin!=='https://www.billplz-sandbox.com'||!/^\/bills\/[A-Za-z0-9_-]+$/.test(url.pathname)||url.search||url.hash)throw Error('Sandbox checkout unavailable');
 redirect(url.toString());
}
export async function refreshCommercialPayment(form:FormData){
 await sameOrigin();const workspace=await commercialWorkspace(),outlet=uuid(form.get('outletId')),bill=form.get('billId');
 if(!outlet||typeof bill!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(bill))throw Error('Select an existing payment');
 await commercialService().reconcile(workspace.actor.id,outlet,bill);await deliverCommercial(workspace.actor.company);
 redirect('/co/workspace?section=billing');
}
