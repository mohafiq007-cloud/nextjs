import "server-only";
import {neon} from "@neondatabase/serverless";
import {neonBackendConfigured} from "./neon-auth-server";
export function neonDatabase(){
 if(!neonBackendConfigured())throw new Error("MARIZ V2 Neon database unavailable");
 const url=process.env.MARIZ_NEON_DATABASE_URL!;
 if(!new URL(url).pathname.endsWith("/marizhq_v2"))throw new Error("Wrong database; expected isolated MARIZ V2");
 if(new URL(url).username!=="mariz_v2_runtime")throw new Error("Runtime database must use a least-privilege role");
 return neon(url);
}
export function isUuid(value:string){return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);}
