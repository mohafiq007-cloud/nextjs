export class BillingHttpError extends Error {
  constructor(code,status=400,requestId){super(code);this.code=code;this.status=status;this.requestId=requestId;}
}
export async function readBillingBody(request,max=8192){
  const length=request.headers.get('content-length');
  if(length&&(!/^\d+$/.test(length)||Number(length)>max))throw new BillingHttpError('body_too_large',413);
  // Real Fetch requests stream; the fallback supports the existing small test request objects.
  if(!request.body?.getReader){const text=await request.text();if(new TextEncoder().encode(text).length>max)throw new BillingHttpError('body_too_large',413);return text;}
  const reader=request.body.getReader(),parts=[];let size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw new BillingHttpError('body_too_large',413);}parts.push(value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length;}return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
