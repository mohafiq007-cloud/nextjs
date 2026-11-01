import Link from 'next/link';import {redirect} from 'next/navigation';
import {startKyb} from './actions';import {signOut} from '../auth/actions';
import {currentVerifiedUser,myCompanies,neonEnabled} from '../../../lib/mariz/neon-server';
import {neonErrorCategory} from '../../../lib/mariz/neon-error-category.mjs';
import KybPanel from './kyb-panel';import ClientWorkspace from './client-workspace';
import FeedbackWorkspace from './feedback-workspace';
import BillingWorkspace from './billing-workspace';
import CompanyContext from './company-context';
import s from './registration-ui.module.css';
export const dynamic='force-dynamic';
export const metadata={title:'Your company | MARIZ CO',description:'Your company profile, MARIZ services, billing and feedback workspace.'};
export default async function Workspace({searchParams}:{searchParams:Promise<{notice?:string;company?:string;view?:string;section?:string;case?:string}>}){
 if(!neonEnabled())return <main className={s.page}><h1>Company workspace temporarily unavailable</h1><p>Please try again later.</p><Link href="/co/auth">Company access</Link></main>;
 const user=await currentVerifiedUser();if(!user)redirect('/co/auth?message='+encodeURIComponent('Email verification is required'));
 let companies;try{companies=await myCompanies(user.id);}catch(error){console.error('MARIZ_CO_COMPANY_LOOKUP_FAILED',neonErrorCategory(error));return <main className={s.page}><h1>We couldn’t open your company securely.</h1><p>Try again or contact MARIZ to check the company linked to your account.</p><Link href="/co/auth">Back to company access</Link></main>;}
 const query=await searchParams;
 if(!companies.length)return <main className={s.page}><div className={s.top}><span className={s.eyebrow}>MARIZ CO</span><form action={signOut}><button className={s.secondary}>Sign out</button></form></div>{query.notice&&<p role="status" className={s.notice}>{query.notice.slice(0,240)}</p>}<h1 className={s.title}>Register your company.</h1><p className={s.subtitle}>This account is for one company. Start with your business details, upload your SSM business profile, then send your application for review. IC is optional.</p><Link className={s.primary} href="/co/company/new">Start company registration →</Link></main>;
 const company=companies[0];
 const canAdmin=['owner','admin'].includes(company.member_role);
 const panel=!canAdmin?null:company.kyb_status?<KybPanel organizationId={company.organization_id}/>:<section className={s.status}><h2>Company details saved.</h2><p>Next, upload your SSM business profile. IC is optional. Nothing is sent for review until you choose Send for review.</p><form action={startKyb}><input type="hidden" name="organization_id" value={company.organization_id}/><button className={s.primary}>Continue to document upload →</button></form></section>;
 const notice=query.company&&query.company!==company.organization_id?'This account opens only its registered company.':query.notice;
 const section=query.section||(['application','documents'].includes(query.view||'')?'company':company.verification_status==='verified'?'home':'company');
 return <ClientWorkspace company={company} application={panel} companyContext={canAdmin&&section==='company'?<CompanyContext/>:undefined} notice={notice} section={section} view={query.view} account={{name:user.name,email:user.email}} billing={canAdmin&&section==='billing'?<BillingWorkspace/>:undefined} feedback={section==='feedback'?<FeedbackWorkspace companyName={company.legal_name} caseId={query.case}/>:undefined}/>;
}
