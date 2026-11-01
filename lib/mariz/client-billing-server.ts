import 'server-only';import {neon} from '@neondatabase/serverless';
import {currentVerifiedUser,myCompanies} from './neon-server';
export type ClientInvoice={id:string;amountMinor:number;currency:string;description:string;status:string;issuanceState:string;paymentUrl:string|null;createdAt:string;paidAt:string|null};
export type ClientSubscription={plan:string;outletId:string;startsAt:string;endsAt:string;period:string;status:string};
export type ClientBilling={state:'verification_required'|'not_connected'|'connected';invoices:ClientInvoice[];subscriptions:ClientSubscription[];hasOlderInvoices:boolean};
export async function clientBilling():Promise<ClientBilling>{
 if(process.env.VERCEL_ENV!=='preview')throw Error('Client billing is not enabled in this environment.');
 const user=await currentVerifiedUser();if(!user)throw Error('Sign-in required.');const companies=await myCompanies(user.id),company=companies[0];
 if(companies.length!==1||!['owner','admin'].includes(company.member_role))throw Error('Company administrator access required.');
 if(company.verification_status!=='verified')return {state:'verification_required',invoices:[],subscriptions:[],hasOlderInvoices:false};
 const raw=process.env.MARIZ_CLIENT_BILLING_DATABASE_URL||'',url=new URL(raw);
 if(!['postgres:','postgresql:'].includes(url.protocol)||url.hostname!=='ep-curly-boat-aor4kgoz.c-2.ap-southeast-1.aws.neon.tech'||url.username!=='mariz_co_billing_preview_reader'||!url.password||url.pathname!=='/marizhq_v2'||url.port||url.hash||url.searchParams.get('sslmode')!=='require'||url.searchParams.get('channel_binding')!=='require'||[...url.searchParams.keys()].some(k=>!['sslmode','channel_binding'].includes(k)))throw Error('Client billing is not connected.');
 const rows=await neon(raw).query('SELECT mariz_billing_live.client_workspace($1,$2) AS workspace',[company.organization_id,'br-jolly-frost-aoz9yzhn']) as Array<{workspace:ClientBilling}>;
 const workspace=rows[0]?.workspace;if(!workspace||!['not_connected','connected'].includes(workspace.state)||!Array.isArray(workspace.invoices)||!Array.isArray(workspace.subscriptions))throw Error('Client billing response unavailable.');
 return workspace;
}
