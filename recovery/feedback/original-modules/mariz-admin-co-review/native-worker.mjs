import {html,css,js,logo} from './native-assets.mjs';
const defaultPrefix='/console/api/company-reviews/';
const paths=new Set(['identity','session','queue','detail','document','evidence','check','decision','code','notify']);
const upstreams=new Set(['https://mariz-hq-v2-preview.vercel.app','https://mariz-hq-v2-preview-hh0w8lqon-mohafiq007-1535s-projects.vercel.app']);
const security={'cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
function reply(body,status=200,type='text/plain; charset=utf-8'){return new Response(body,{status,headers:{...security,'content-type':type}});}
export async function handleNative(request,env,fetcher=fetch,Rewriter=globalThis.HTMLRewriter){
 const url=new URL(request.url);
 const staging=env.NATIVE_REVIEW_STAGE==='true';
 const prefix=staging?'/console/api/company-reviews-preview/':defaultPrefix;
 if(url.hostname!=='admin.marizhq.com')return reply('Not found',404);
 if(url.pathname==='/assets/mariz-logo.png'){
  if(!['GET','HEAD'].includes(request.method))return reply('Method not allowed',405);
  return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(logo),c=>c.charCodeAt(0)),{headers:{'content-type':'image/png','cache-control':'private, max-age=3600','x-content-type-options':'nosniff'}});
 }
 if(url.pathname===prefix+'native.js'||url.pathname===prefix+'native.css'){
  if(!['GET','HEAD'].includes(request.method))return reply('Method not allowed',405);
  const isScript=url.pathname.endsWith('.js');return reply(request.method==='HEAD'?null:isScript?js.replaceAll(defaultPrefix,prefix):css,200,isScript?'text/javascript; charset=utf-8':'text/css; charset=utf-8');
 }
 if(url.pathname.startsWith(prefix)){
  const action=url.pathname.slice(prefix.length),read=['identity','session','queue','detail','document'].includes(action);
  if(!paths.has(action))return reply('Not found',404);
  if(request.method!==(read?'GET':'POST'))return reply('Method not allowed',405);
  const fail=reason=>reply(JSON.stringify({error:'Native reviews are awaiting secure configuration.',...(staging?{diagnostic:reason,previewIdentityPresent:typeof env.NATIVE_REVIEW_PREVIEW_OIDC==='string'&&env.NATIVE_REVIEW_PREVIEW_OIDC.length>100}:{})}),503,'application/json');
  if(env.NATIVE_REVIEW_ENABLED!=='true'||!upstreams.has(env.NATIVE_REVIEW_UPSTREAM))return fail('staging_configuration_not_matched');
  const assertion=request.headers.get('cf-access-jwt-assertion');if(!assertion||assertion.length>12000)return reply(JSON.stringify({error:'Administrator session required'}),403,'application/json');
  if(!read&&(request.headers.get('origin')!=='https://admin.marizhq.com'||request.headers.get('content-type')?.split(';')[0]!=='application/json'))return reply('Same-origin JSON required',403);
  const headers=new Headers({'cf-access-jwt-assertion':assertion});let body;
  if(staging&&env.NATIVE_REVIEW_PREVIEW_OIDC)headers.set('x-vercel-trusted-oidc-idp-token',env.NATIVE_REVIEW_PREVIEW_OIDC);
  if(!read){body=await request.text();if(new TextEncoder().encode(body).length>12000)return reply('Request too large',413);headers.set('content-type','application/json');headers.set('origin','https://admin.marizhq.com');}
  try{
   const response=await fetcher(env.NATIVE_REVIEW_UPSTREAM+'/api/internal/admin-console/'+action+url.search,{method:request.method,headers,body,redirect:'manual'});
   const content=response.headers.get('content-type')||'';
   if(!content.startsWith('application/json')&&!(action==='document'&&['application/pdf','image/png','image/jpeg'].some(t=>content.startsWith(t)))){
    let target='';try{target=new URL(response.headers.get('location')).hostname;}catch{}
    return fail('upstream_non_api_response_'+response.status+(target?'_'+target:''));
   }
   const clean=new Headers(security);for(const key of ['content-type','content-disposition','content-security-policy']){const v=response.headers.get(key);if(v)clean.set(key,v);}
   // Chrome's built-in PDF viewer cannot run in a document sandbox. This only
   // applies to an authenticated, integrity-checked PDF stream from our fixed API.
   // MIME and nosniff prevent interpreting uploaded bytes as HTML; framing stays same-origin.
   if(action==='document'&&response.status===200&&content.split(';')[0]==='application/pdf')clean.set('content-security-policy',"default-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'");
   // Never forward provider cookies, authentication tokens, CORS or arbitrary redirects.
   return new Response(response.body,{status:response.status,headers:clean});
  }catch(error){
   const message=String(error?.message||''),category=/redirect/i.test(message)?'redirect':/header/i.test(message)?'header':/invocation/i.test(message)?'invocation':/url/i.test(message)?'url':/network|fetch|connect/i.test(message)?'transport':'other';
   return fail('upstream_fetch_unavailable_'+category);
  }
 }
 const reviewPath=staging?'/console/company-reviews-preview':'/console/company-reviews';
 const review=url.pathname===reviewPath||url.pathname===reviewPath+'/';
 if(review&&!['GET','HEAD'].includes(request.method))return reply('Method not allowed',405);
 const original=review?new Request(new URL('/console/',url),request):request;
 const response=await fetcher(original);
 if(request.method==='HEAD'||response.status!==200||!response.headers.get('content-type')?.includes('text/html'))return response;
 if(!(url.pathname==='/'||url.pathname==='/console'||url.pathname.startsWith('/console/')))return response;
 let rewrite=new Rewriter().on('nav[aria-label="Main navigation"]',{element(e){e.append('<a href="'+reviewPath+'"'+(review?' aria-current="page"':'')+'>Companies</a>',{html:true});}})
 .on('img[src="/assets/mariz-logo.png"]',{element(e){e.setAttribute('src','/assets/mariz-logo.png?v=20261023');e.setAttribute('alt','MARIZ HQ');e.setAttribute('style','background:#21180f;object-fit:contain;border-radius:8px');}});
 if(review)rewrite=rewrite.on('main',{element(e){e.setInnerContent(staging?html.replaceAll('/console/company-reviews',reviewPath).replace('<h1>Company reviews</h1>','<h1>Company reviews · Staging</h1><p class="notice">Protected staging workspace. Synthetic companies only; production approvals and payments are unavailable.</p>'):html,{html:true});}}).on('script',{element(e){e.remove();}}).on('title',{element(e){e.setInnerContent('Company reviews — MARIZ Admin');}}).on('head',{element(e){e.append('<link rel="icon" href="/assets/mariz-logo.png?v=20261023" type="image/png"><link rel="stylesheet" href="'+prefix+'native.css"><script defer src="'+prefix+'native.js"></script>',{html:true});}});
 else rewrite=rewrite.on('[role="tablist"][aria-label="Admin workspaces"]',{element(e){e.append('<a class="btn outline" href="/console/company-reviews">Companies / Reviews</a>',{html:true});}});
 const result=rewrite.transform(response),headers=new Headers(result.headers);for(const [k,v] of Object.entries(security))headers.set(k,v);headers.delete('content-length');headers.delete('etag');
 if(review)headers.set('content-security-policy',"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'self'");
 return new Response(result.body,{status:result.status,headers});
}
export default {fetch(request,env){return handleNative(request,env);}};
