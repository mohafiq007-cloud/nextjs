import previous from '../private/worker-baseline-mariz-admin-co-review/production-worker.mjs';
import {handleAdminReply,json} from './functions/_co-feedback.mjs';
import {authorizeAdmin} from './functions/_admin-feedback-auth.mjs';
import {page,script} from './staff-assets.mjs';
const statuses=new Set(['new','triaged','planned','in_development','testing','released','closed','waiting_for_client']);
const priorities=new Set(['unassigned','low','medium','high','critical']);
export default {async fetch(request,env,ctx){
 const u=new URL(request.url);
 if(u.hostname!=='admin.marizhq.com')return previous.fetch(request,env,ctx);
 const staff=u.pathname==='/console/co-feedback'||u.pathname==='/console/co-feedback.js';
 if(staff||u.pathname==='/console/api/co-feedback'||u.pathname==='/api/feedback'){
  const admin=await authorizeAdmin(request,env);if(admin.error)return json({error:admin.error},admin.status);
  if(staff){if(request.method!=='GET')return json({error:'Method not allowed'},405);return new Response(u.pathname.endsWith('.js')?script:page,{headers:{'content-type':u.pathname.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8','cache-control':'private, no-store','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",'x-content-type-options':'nosniff'}});}
  if(u.pathname==='/console/api/co-feedback')return handleAdminReply(request,env,{authorizeAdmin:async()=>admin});
  if(request.method==='GET'){
   const original=await previous.fetch(request,env,ctx);if(!original.ok||!original.headers.get('content-type')?.includes('application/json'))return original;
   const data=await original.json();if(!Array.isArray(data.tickets))return json({error:'Inbox response unavailable'},503);
   const rows=await env.FEEDBACK_DB.prepare('SELECT id,reference,kind,title,description,contact,status,priority,assignee,internal_notes,created_at,updated_at FROM feedback_company_tickets ORDER BY created_at DESC LIMIT 100').all();
   return json({tickets:[...data.tickets,...(rows.results||[])].sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).slice(0,100)});
  }
  if(request.method==='PATCH'){
   if(request.headers.get('origin')!=='https://admin.marizhq.com'||request.headers.get('content-type')?.split(';')[0]!=='application/json')return json({error:'Same-origin JSON required'},403);
   const raw=await request.clone().text();if(raw.length>5000)return json({error:'Request too long'},413);let d;try{d=JSON.parse(raw)}catch{return json({error:'Invalid request'},400)};
   if(typeof d.id!=='string'||!/^[a-f0-9-]{36}$/i.test(d.id))return json({error:'Invalid case'},400);
   const row=await env.FEEDBACK_DB.prepare('SELECT id FROM feedback_company_tickets WHERE id=?').bind(d.id).first();
   if(row){if(!statuses.has(d.status)||!priorities.has(d.priority)||typeof d.assignee!=='string'||d.assignee.length>120||typeof d.internal_notes!=='string'||d.internal_notes.length>3000)return json({error:'Invalid ticket update'},400);
    await env.FEEDBACK_DB.prepare("UPDATE feedback_company_tickets SET status=?,priority=?,assignee=?,internal_notes=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(d.status,d.priority,d.assignee,d.internal_notes,d.id).run();return json({updated:true});}
  }
 }
 const response=await previous.fetch(request,env,ctx);
 if(request.method==='GET'&&u.pathname.startsWith('/console')&&response.status===200&&response.headers.get('content-type')?.includes('text/html'))return new HTMLRewriter().on('body',{element(e){e.append('<p style="padding:1rem"><a class="btn outline" href="/console/co-feedback">Company feedback conversations →</a></p>',{html:true});}}).transform(response);
 return response;
}};
