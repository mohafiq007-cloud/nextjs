// Production cosmetic fix only. Legacy navigation, authentication and review workflow stay intact.
import {handle as legacyHandle} from './worker.mjs';
import {logo} from './native-assets.mjs';
export async function handleBrand(request,env,fetcher=fetch,rewriter=globalThis.HTMLRewriter){
 const url=new URL(request.url);
 if(url.hostname==='admin.marizhq.com'&&url.pathname==='/assets/mariz-logo.png'){
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(logo),c=>c.charCodeAt(0)),{headers:{'content-type':'image/png','cache-control':'private, max-age=3600','x-content-type-options':'nosniff'}});
 }
 return legacyHandle(request,env,fetcher,rewriter);
}
export default {fetch(request,env){return handleBrand(request,env);}};
