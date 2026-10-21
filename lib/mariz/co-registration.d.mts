export function registrationSlug(actorId:string, registrationNo:string):string;
export function registerCompanyRecoverably(args:{
 actorId:string;
 profile:Record<string,string>;
 auth:{organization:{list:()=>Promise<{data:unknown;error:unknown}>;create:(input:{name:string;slug:string})=>Promise<{data:{id:string}|null;error:unknown}>}};
 rpc:(name:"api_register_company",params:Record<string,string>)=>Promise<unknown>;
}):Promise<unknown>;
