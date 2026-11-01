export function routeAllowed(path){return path==='/co'||path.startsWith('/co/')||path.startsWith('/_next/static/')||path.startsWith('/api/auth/')||path.startsWith('/api/payments/billplz/live/');}
export async function handle(request,env,fetcher=fetch){
 const incoming=new URL(request.url);if(incoming.hostname!=='marizhq.com'||!routeAllowed(incoming.pathname))return new Response('Not found',{status:404});
 if(!['GET','HEAD','POST','OPTIONS'].includes(request.method))return new Response('Method not allowed',{status:405});
 if((incoming.pathname==='/co'||incoming.pathname==='/co/')&&['GET','HEAD'].includes(request.method))return Response.redirect('https://marizhq.com/co/auth',302);
 let target;try{target=new URL(env.UPSTREAM_ORIGIN);if(target.protocol!=='https:'||target.hostname!=='mariz-hq-v2-preview.vercel.app'||target.port||target.username||target.password||target.pathname!=='/'||target.search||target.hash)throw Error('Invalid upstream');}catch{return new Response('Company access temporarily unavailable',{status:503});}
 target.pathname=incoming.pathname;target.search=incoming.search;
 const headers=new Headers(request.headers);headers.set('host',target.host);headers.set('x-forwarded-host','marizhq.com');headers.set('x-forwarded-proto','https');headers.delete('x-vercel-protection-bypass');headers.delete('x-vercel-trusted-oidc-idp-token');
 try{
  const response=await fetcher(new Request(target,{method:request.method,headers,...(!['GET','HEAD'].includes(request.method)?{body:request.body,duplex:'half'}:{}),redirect:'manual',signal:AbortSignal.timeout(30000)}));
  const outgoing=new Headers(response.headers);const location=outgoing.get('location');if(location){const url=new URL(location,target);if(url.origin===target.origin){url.host='marizhq.com';outgoing.set('location',url.href);}}
  if(!incoming.pathname.startsWith('/_next/static/'))outgoing.set('cache-control','private, no-store');outgoing.set('x-content-type-options','nosniff');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers:outgoing});
 }catch{return new Response('Company access temporarily unavailable. Please retry shortly.',{status:503,headers:{'cache-control':'no-store'}});}
}
export default {fetch(request,env){return handle(request,env);}};
