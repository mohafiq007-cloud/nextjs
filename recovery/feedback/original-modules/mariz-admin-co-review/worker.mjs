const reviewPath='/console/company-reviews';
export const navigation='<a href="/console/company-reviews">Company reviews</a>';
export const workspaceLink='<a class="btn outline" href="/console/company-reviews">Company reviews</a>';
export function wrapper(view="companies"){return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Company reviews — MARIZ Admin</title><link rel="icon" type="image/png" href="/assets/mariz-logo.png?v=20261022"><link rel="stylesheet" href="/assets/mariz.css"><style>*{box-sizing:border-box}.identity img{width:64px;height:64px;object-fit:contain;background:#21180f;border-radius:8px}.header{background:#21180f}.header .identity,.header .nav a{color:#ead4a7}body{margin:0;background:#faf7f1;color:#34281d;font:14px system-ui}header{padding:16px 20px;border-bottom:1px solid #d9cdbb;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}h1{font-size:20px;margin:0}p{margin:6px 0 0;color:#675d50;font-size:13px}a{color:#6d471f}nav{display:flex;gap:16px;flex-wrap:wrap}iframe{display:block;width:100%;height:calc(100dvh - 96px);min-height:650px;border:0}</style></head><body><header class="header"><div class="header-in"><a class="identity" href="https://marizhq.com/"><img src="/assets/mariz-logo.png?v=20261022" alt="MARIZ HQ"><span>MARIZ ADMIN<small>MARIZ HQ ECOSYSTEM</small></span></a><nav class="nav" aria-label="Main navigation"><a href="/console/">Console</a><a href="/console/company-reviews" aria-current="page">Company reviews</a></nav></div></header><header><div><h1>Company reviews</h1><p>Manage companies, review work, invoices and service records using your authorized MARIZ account.</p></div><nav aria-label="Admin navigation"><a href="/console/">← Admin terminal</a></nav></header><iframe src="https://marizhq.com/co/admin/${view}" title="MARIZ CO company review queue" sandbox="allow-scripts allow-same-origin allow-forms allow-downloads"></iframe></body></html>`;}
export async function handle(request,env,fetcher=fetch,rewriter=globalThis.HTMLRewriter){
 const url=new URL(request.url);
 if(url.hostname!=='admin.marizhq.com')return new Response('Not found',{status:404});
 if(url.pathname==='/assets/mariz-logo.png'){
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  const image=await fetcher('https://marizhq.com/co/branding/mariz-hq-approved-gold.png',{method:request.method,redirect:'error'});
  if(!image.ok||!image.headers.get('content-type')?.toLowerCase().startsWith('image/png'))return new Response('Brand asset unavailable',{status:503});
  return new Response(request.method==='HEAD'?null:image.body,{headers:{'content-type':'image/png','cache-control':'private, max-age=3600','x-content-type-options':'nosniff'}});
 }
 if(url.pathname===reviewPath||url.pathname===reviewPath+'/'){
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  return new Response(request.method==='HEAD'?null:wrapper(url.searchParams.get('view')==='kyb'?'kyb':'companies'),{headers:{'content-type':'text/html; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','content-security-policy':"default-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; frame-src https://marizhq.com; frame-ancestors 'self'; base-uri 'none'; form-action 'none'"}});
 }
 const response=await fetcher(request);
 // Preserve APIs, assets, auth challenges, redirects and non-HTML responses byte-for-byte.
 if(request.method!=='GET'||response.status!==200||!response.headers.get('content-type')?.toLowerCase().includes('text/html')||!(url.pathname==='/'||url.pathname==='/console'||url.pathname.startsWith('/console/')))return response;
 if(!rewriter)throw Error('HTML rewriter unavailable');
 const output=new rewriter().on('nav[aria-label="Main navigation"]',{element(element){element.append(navigation,{html:true});}}).on('[role="tablist"][aria-label="Admin workspaces"]',{element(element){element.append(workspaceLink,{html:true});}}).on('img[src="/assets/mariz-logo.png"]',{element(element){element.setAttribute('src','/assets/mariz-logo.png?v=20261022');element.setAttribute('alt','MARIZ HQ');element.setAttribute('style','background:#21180f;object-fit:contain;border-radius:8px');}}).transform(response);
 const headers=new Headers(output.headers);headers.set('cache-control','private, no-store');headers.delete('content-length');headers.delete('etag');
 return new Response(output.body,{status:output.status,statusText:output.statusText,headers});
}
export default {fetch(request,env){return handle(request,env);}};
