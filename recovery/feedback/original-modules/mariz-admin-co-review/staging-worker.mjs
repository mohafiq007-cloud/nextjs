import {handleBrand} from './brand-only-worker.mjs';
import {handleNative} from './native-worker.mjs';
export default {fetch(request,env){
 const path=new URL(request.url).pathname;
 if(path==='/console/company-reviews-preview'||path==='/console/company-reviews-preview/'||path.startsWith('/console/api/company-reviews-preview/'))return handleNative(request,{...env,NATIVE_REVIEW_STAGE:'true'});
 return handleBrand(request,env);
}};
