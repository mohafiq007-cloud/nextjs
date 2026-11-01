// Shared Feedback Centre extension. No credentials or payment/POS operations.
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const PRODUCTION='https://ep-snowy-smoke-aolnip5w.apirest.c-2.ap-southeast-1.aws.neon.tech/marizhq_v2/rest/v1';
const CATEGORIES=new Set(['issue','suggestion','complaint','general']),PRODUCTS=new Set(['mariz-co','mariz-pos']);
const PUBLIC_COLUMNS='id,reference,product,client_category,title,description,status,created_at,updated_at';
export const json=(value,status=200)=>Response.json(value,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
class Failure extends Error{constructor(status,message){super(message);this.status=status;}}
const fail=(status,message)=>{throw new Failure(status,message)};
const publicStatus=raw=>raw==='new'?'Received':raw==='waiting_for_client'?'Waiting for you':['closed','released'].includes(raw)?'Resolved':'In review';
const ticketDTO=x=>({id:x.id,reference:x.reference,product:x.product,category:x.client_category,subject:x.title,description:x.description,status:publicStatus(x.status),createdAt:x.created_at,updatedAt:x.updated_at});
async function body(request,allowed){
 if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')fail(415,'JSON required.');
 if(Number(request.headers.get('content-length')||0)>14000)fail(413,'Message is too long.');
 const raw=await request.text();if(new TextEncoder().encode(raw).length>14000)fail(413,'Message is too long.');
 let data;try{data=JSON.parse(raw)}catch{fail(400,'Invalid request.');}
 if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).some(k=>!allowed.includes(k)))fail(400,'Invalid request.');
 return data;
}
const text=(v,min,max)=>typeof v==='string'&&v.trim().length>=min&&v.trim().length<=max?v.trim():null;
async function digest(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function context(request,env,fetcher){
 if(env.MARIZ_CO_FEEDBACK_ENV!=='production'||env.CO_DATA_API_URL!==PRODUCTION||!env.FEEDBACK_DB)fail(503,'Feedback is temporarily unavailable.');
 const token=request.headers.get('authorization')||'';
 if(token.length>12000||!/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token))fail(401,'Sign in to send feedback.');
 // Workers does not implement redirect:error. Manual mode rejects 3xx below without forwarding the JWT.
 let response;try{response=await fetcher(PRODUCTION+'/rpc/api_client_context',{method:'POST',headers:{authorization:token,'content-type':'application/json','content-profile':'mariz_core','accept-profile':'mariz_core','cache-control':'no-store'},body:'{}',redirect:'manual',signal:AbortSignal.timeout(10000)})}catch{fail(503,'Company access could not be verified.');}
 if(!response.ok)fail(response.status>=500?503:403,'Company access could not be verified.');
 let c;try{c=await response.json()}catch{fail(503,'Company access could not be verified.');}
 if(!c||!UUID.test(c.actor_id)||!UUID.test(c.company_id)||!['owner','admin','member'].includes(c.role)||typeof c.approved!=='boolean')fail(403,'Company access could not be verified.');
 return {actor:c.actor_id,company:c.company_id,admin:['owner','admin'].includes(c.role)};
}
async function ownTicket(db,c,id){
 if(!UUID.test(id))fail(404,'Case not found.');
 const row=await db.prepare('SELECT '+PUBLIC_COLUMNS+' FROM feedback_company_tickets WHERE id=? AND company_id=?'+(c.admin?'':' AND author_id=?')).bind(id,c.company,...(c.admin?[]:[c.actor])).first();
 if(!row)fail(404,'Case not found.');return row;
}
async function existingMessage(db,id,c,key,sender='client'){
 return db.prepare('SELECT body,requested_status FROM feedback_company_messages WHERE ticket_id=? AND sender=? AND author_id=? AND request_key=?').bind(id,sender,c,key).first();
}
export async function handleClient(request,env,{fetcher=fetch}={}){
 try{
  const c=await context(request,env,fetcher),db=env.FEEDBACK_DB;
  const suffix=new URL(request.url).pathname.split('/api/co-feedback')[1]||'';
  const parts=suffix.split('/').filter(Boolean);if(parts.length>2)fail(404,'Case not found.');
  if(request.method==='GET'&&!parts.length){
   const result=await db.prepare('SELECT '+PUBLIC_COLUMNS+' FROM feedback_company_tickets WHERE company_id=?'+(c.admin?'':' AND author_id=?')+' ORDER BY created_at DESC,id DESC LIMIT 100').bind(c.company,...(c.admin?[]:[c.actor])).all();
   return json({cases:(result.results||[]).map(ticketDTO)});
  }
  if(request.method==='GET'&&parts.length===1){
   const row=await ownTicket(db,c,parts[0]);const messages=await db.prepare('SELECT sender,body,created_at FROM feedback_company_messages WHERE ticket_id=? ORDER BY sequence DESC LIMIT 101').bind(row.id).all();
   return json({case:ticketDTO(row),hasOlderMessages:(messages.results||[]).length>100,messages:(messages.results||[]).slice(0,100).reverse().map(x=>({sender:x.sender==='admin'?'MARIZ Support':'Client',body:x.body,createdAt:x.created_at}))});
  }
  if(request.method==='POST'&&!parts.length){
   const data=await body(request,['category','product','subject','description','requestKey']);
   const subject=text(data.subject,5,120),description=text(data.description,15,4000);
   if(!subject||!description||!CATEGORIES.has(data.category)||!PRODUCTS.has(data.product)||!UUID.test(data.requestKey||''))fail(400,'Check the category, subject and description.');
   const hash=await digest(JSON.stringify([data.category,data.product,subject,description]));
   const previous=await db.prepare('SELECT id,client_request_hash FROM feedback_company_tickets WHERE author_id=? AND client_request_key=?').bind(c.actor,data.requestKey).first();
   if(previous){if(previous.client_request_hash!==hash)fail(409,'This request was already used for different feedback.');await ownTicket(db,c,previous.id);return json({id:previous.id,replayed:true});}
   const rate=await db.prepare("SELECT count(*) AS total FROM feedback_company_tickets WHERE company_id=? AND author_id=? AND created_at>=strftime('%Y-%m-%dT%H:%M:%fZ','now','-1 hour')").bind(c.company,c.actor).first();
   if(Number(rate?.total||0)>=10)fail(429,'Too many messages. Please try again later.');
   const id=crypto.randomUUID(),reference='CO-'+id.slice(0,8).toUpperCase(),kind={issue:'bug',suggestion:'feature',complaint:'general',general:'general'}[data.category];
   try{await db.batch([
    db.prepare("INSERT INTO feedback_company_tickets(id,reference,product,kind,title,description,source_hash,status,company_id,author_id,client_category,client_request_key,client_request_hash) VALUES(?,?,?,?,?,?,?,'new',?,?,?,?,?)").bind(id,reference,data.product,kind,subject,description,'account:'+c.actor,c.company,c.actor,data.category,data.requestKey,hash),
    db.prepare("INSERT INTO feedback_company_messages(id,ticket_id,sender,author_id,body,request_key) VALUES(?,?,'client',?,?,?)").bind(crypto.randomUUID(),id,c.actor,description,data.requestKey)
   ])}catch{
    const duplicate=await db.prepare('SELECT id,client_request_hash FROM feedback_company_tickets WHERE author_id=? AND client_request_key=?').bind(c.actor,data.requestKey).first();
    if(duplicate&&duplicate.client_request_hash===hash){await ownTicket(db,c,duplicate.id);return json({id:duplicate.id,replayed:true});}throw Error('Persistence failed');
   }
   return json({id,reference},201);
  }
  if(request.method==='POST'&&parts.length===2&&parts[1]==='messages'){
   const row=await ownTicket(db,c,parts[0]),data=await body(request,['message','requestKey']),message=text(data.message,5,4000);
   if(!message||!UUID.test(data.requestKey||''))fail(400,'Enter a reply of 5–4,000 characters.');
   const old=await existingMessage(db,row.id,c.actor,data.requestKey);if(old){if(old.body!==message)fail(409,'This request was already used for another reply.');return json({saved:true,replayed:true});}
   const rate=await db.prepare("SELECT count(*) AS total FROM feedback_company_messages WHERE sender='client' AND author_id=? AND created_at>=strftime('%Y-%m-%dT%H:%M:%fZ','now','-1 hour')").bind(c.actor).first();if(Number(rate?.total||0)>=30)fail(429,'Too many replies. Please try again later.');
   await db.batch([db.prepare("INSERT INTO feedback_company_messages(id,ticket_id,sender,author_id,body,request_key) VALUES(?,?,'client',?,?,?)").bind(crypto.randomUUID(),row.id,c.actor,message,data.requestKey),db.prepare("UPDATE feedback_company_tickets SET status='triaged',updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND company_id=?").bind(row.id,c.company)]);
   return json({saved:true},201);
  }
  return json({error:'Method not allowed.'},405);
 }catch(error){return json({error:error instanceof Failure?error.message:'Feedback is temporarily unavailable. Please retry the same request.'},error instanceof Failure?error.status:503);}
}
export async function handleAdminReply(request,env,{authorizeAdmin}){
 try{
  if(env.MARIZ_CO_FEEDBACK_ENV!=='production'||!env.FEEDBACK_DB)fail(503,'Feedback is temporarily unavailable.');
  const admin=await authorizeAdmin(request,env);if(admin.error)return json({error:admin.error},admin.status);
  if(request.method==='GET'){
   const result=await env.FEEDBACK_DB.prepare('SELECT '+PUBLIC_COLUMNS+' FROM feedback_company_tickets WHERE company_id IS NOT NULL ORDER BY created_at DESC,id DESC LIMIT 100').all();
   return json({cases:(result.results||[]).map(ticketDTO)});
  }
  if(request.method!=='POST')return json({error:'Method not allowed.'},405);
  if(request.headers.get('origin')!==new URL(request.url).origin)fail(403,'Invalid origin.');
  const data=await body(request,['caseId','message','requestKey','status']),message=text(data.message,5,4000);
  if(!message||!UUID.test(data.caseId||'')||!UUID.test(data.requestKey||'')||!['triaged','waiting_for_client','closed'].includes(data.status))fail(400,'Invalid public reply.');
  const db=env.FEEDBACK_DB,row=await db.prepare('SELECT id FROM feedback_company_tickets WHERE id=? AND company_id IS NOT NULL').bind(data.caseId).first();if(!row)fail(404,'Case not found.');
  const old=await existingMessage(db,row.id,admin.email,data.requestKey,'admin');if(old){if(old.body!==message||old.requested_status!==data.status)fail(409,'This request was already used for another reply.');return json({saved:true,replayed:true});}
  await db.batch([db.prepare("INSERT INTO feedback_company_messages(id,ticket_id,sender,author_id,body,request_key,requested_status) VALUES(?,?,'admin',?,?,?,?)").bind(crypto.randomUUID(),row.id,admin.email,message,data.requestKey,data.status),db.prepare("UPDATE feedback_company_tickets SET status=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(data.status,row.id)]);
  return json({saved:true},201);
 }catch(error){return json({error:error instanceof Failure?error.message:'Public reply could not be saved.'},error instanceof Failure?error.status:503);}
}
