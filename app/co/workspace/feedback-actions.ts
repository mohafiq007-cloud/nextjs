'use server';
import {redirect} from 'next/navigation';import {revalidatePath} from 'next/cache';
import {createFeedback,replyFeedback,FeedbackError} from '../../../lib/mariz/client-feedback-server';
import type {FeedbackFormState} from './feedback-types';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const value=(form:FormData,key:string)=>String(form.get(key)||'').trim();
export async function submitFeedback(_state:FeedbackFormState,form:FormData):Promise<FeedbackFormState>{
 const category=value(form,'category'),product=value(form,'product'),subject=value(form,'subject'),description=value(form,'description'),requestKey=value(form,'requestKey');
 const errors:Record<string,string>={};if(!['issue','suggestion','complaint','general'].includes(category))errors.category='Choose a feedback category.';if(!['mariz-co','mariz-pos'].includes(product))errors.product='Choose MARIZ CO or MARIZ POS.';if(subject.length<5||subject.length>120)errors.subject='Use 5–120 characters for the subject.';if(description.length<15||description.length>4000)errors.description='Use 15–4,000 characters for the description.';if(!UUID.test(requestKey))errors.form='Refresh this page before sending feedback.';
 const values={category,product,subject,description};if(Object.keys(errors).length)return {errors,values};
 let id:string;try{const result=await createFeedback({category,product,subject,description,requestKey});if(!UUID.test(result.id))throw Error('Invalid response');id=result.id;}catch(e){return {errors:{form:e instanceof FeedbackError?e.message:'Your feedback could not be confirmed. Retry using this form.'},values};}
 revalidatePath('/co/workspace');redirect('/co/workspace?section=feedback&case='+id);
}
export async function submitFeedbackReply(_state:FeedbackFormState,form:FormData):Promise<FeedbackFormState>{
 const id=value(form,'caseId'),message=value(form,'message'),requestKey=value(form,'requestKey');const errors:Record<string,string>={};if(message.length<5||message.length>4000)errors.message='Use 5–4,000 characters for the reply.';if(!UUID.test(id)||!UUID.test(requestKey))errors.form='Refresh this case before replying.';if(Object.keys(errors).length)return {errors,values:{message}};
 try{const result=await replyFeedback(id,{message,requestKey});if(result.saved!==true)throw Error('Save unconfirmed');}catch(e){return {errors:{form:e instanceof FeedbackError?e.message:'Your reply could not be confirmed. Retry using this form.'},values:{message}};}
 revalidatePath('/co/workspace');redirect('/co/workspace?section=feedback&case='+id);
}
