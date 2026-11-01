import 'server-only';
import {currentVerifiedUser,myCompanies,coRpc} from './neon-server';
export type ClientCompanyContext={companyId:string;contact:{registeredAddress:string;businessEmail:string;country:string};members:Array<{name:string|null;role:string}>;hasMoreMembers:boolean};
export async function clientCompanyContext():Promise<ClientCompanyContext>{
 if(!['preview','production'].includes(process.env.VERCEL_ENV||''))throw Error('Company details are not connected in this environment.');
 const user=await currentVerifiedUser();if(!user)throw Error('Sign-in required.');
 const companies=await myCompanies(user.id);
 if(companies.length!==1||!['owner','admin'].includes(companies[0].member_role))throw Error('Company administrator access required.');
 const result=await coRpc<ClientCompanyContext>('api_client_workspace');
 if(result?.companyId!==companies[0].organization_id||!result.contact||!Array.isArray(result.members)||typeof result.hasMoreMembers!=='boolean')throw Error('Company details could not be confirmed.');
 return result;
}
