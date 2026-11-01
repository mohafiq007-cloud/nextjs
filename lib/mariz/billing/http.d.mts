export class BillingHttpError extends Error {code:string;status:number;requestId?:string;constructor(code:string,status?:number,requestId?:string);}
export function readBillingBody(request:Request,max?:number):Promise<string>;
