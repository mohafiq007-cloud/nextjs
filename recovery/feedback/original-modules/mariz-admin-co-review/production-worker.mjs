import staging from './staging-worker.mjs';
import {handleNative} from './native-worker.mjs';

// Release candidate only. Separate production bindings keep the existing preview
// identity and staging database configuration out of normal review requests.
export function handleProduction(request,env,native=handleNative,previous=staging.fetch){
 const path=new URL(request.url).pathname;
 if(path==='/console/company-reviews'||path==='/console/company-reviews/'||path.startsWith('/console/api/company-reviews/')){
  return native(request,{
   NATIVE_REVIEW_ENABLED:env.NATIVE_REVIEW_PRODUCTION_ENABLED,
   NATIVE_REVIEW_UPSTREAM:env.NATIVE_REVIEW_PRODUCTION_UPSTREAM,
  });
 }
 return previous(request,env);
}
export default {fetch(request,env){return handleProduction(request,env);}};
