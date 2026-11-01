import previous from '../private/worker-baseline-mariz-co-gateway/worker.mjs';
import {handleClient} from './functions/_co-feedback.mjs';
export default {fetch(request,env,ctx){
 const u=new URL(request.url),prefix='/co/api/co-feedback';
 if(u.hostname==='marizhq.com'&&(u.pathname===prefix||u.pathname.startsWith(prefix+'/')))return handleClient(request,env);
 return previous.fetch(request,env,ctx);
}};
