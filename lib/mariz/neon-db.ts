import "server-only";
import {companyRuntimeSql} from "./neon-runtime-server";
import {neonBackendConfigured} from "./neon-auth-server";
export function neonDatabase(){
 if(!neonBackendConfigured())throw new Error("MARIZ V2 Neon database unavailable");
 return companyRuntimeSql();
}
export function isUuid(value:string){return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);}
