import 'server-only';
import {neon} from '@neondatabase/serverless';
import {billplzSandboxConfigured,billplzCallbackUrl} from './billing/billplz';

// Read-only deployment prerequisite check. Never reserves, issues or pays a bill.
export async function commercialReadiness(){
 if(process.env.VERCEL_ENV!=='preview'||process.env.MARIZ_POS_PILOT_BRANCH!=='br-noisy-smoke-aordwffm'||process.env.NEON_AUTH_BASE_URL!=='https://ep-little-cake-aockipdm.neonauth.c-2.ap-southeast-1.aws.neon.tech/marizhq_v2/auth'||!billplzSandboxConfigured())throw Error('preview_configuration_required');
 const raw=process.env.MARIZ_POS_PILOT_DATABASE_URL||'',u=new URL(raw);
 if(u.protocol!=='postgresql:'||u.hostname!=='ep-little-cake-aockipdm.c-2.ap-southeast-1.aws.neon.tech'||u.username!=='mariz_pos_commercial_preview_runtime'||u.pathname!=='/marizhq_v2'||!u.password||u.port||u.hash||u.searchParams.get('sslmode')!=='require'||[...u.searchParams.keys()].some(k=>!['sslmode','channel_binding'].includes(k)))throw Error('restricted_preview_connection_required');
 const callback=new URL(billplzCallbackUrl(true));
 if(callback.origin!==process.env.MARIZ_POS_PILOT_ORIGIN||callback.pathname!=='/api/payments/pos-pilot/callback'||!callback.searchParams.has('x-vercel-protection-bypass'))throw Error('protected_callback_required');
 const rows=await neon(raw).query("SELECT current_user='mariz_pos_commercial_preview_runtime' AS restricted_role,NOT has_table_privilege(current_user,'mariz_billing_live.payment_requests','SELECT') AS no_table_read,has_function_privilege(current_user,'mariz_billing_live.accept_pos_pilot_quote_scoped(uuid,uuid,uuid,uuid,text,text,text,text)','EXECUTE') AS scoped_acceptance,NOT has_function_privilege(current_user,'mariz_billing_live.accept_pos_pilot_quote(uuid,uuid,uuid,text,text,text,text)','EXECUTE') AS no_unscoped_acceptance",[]);
 const row=rows[0];if(!row||Object.values(row).some(v=>v!==true))throw Error('restricted_permissions_required');
 const collection=process.env.BILLPLZ_COLLECTION_ID;
 if(typeof collection!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(collection))throw Error('sandbox_collection_required');
 const response=await fetch('https://www.billplz-sandbox.com/api/v3/collections/'+encodeURIComponent(collection),{headers:{Authorization:'Basic '+Buffer.from(process.env.BILLPLZ_SECRET_KEY+':').toString('base64'),Accept:'application/json'},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('sandbox_provider_authentication_failed');
 const data=await response.json();if(data.id!==collection||data.status!=='active')throw Error('active_sandbox_collection_required');
 return {previewPinned:true,databaseConnected:true,restrictedPermissions:true,sandboxProviderAuthenticated:true,activeSandboxCollection:true,callbackConfigured:true,checkoutEnabled:process.env.MARIZ_POS_PILOT_ENABLED==='true'};
}
