"use server";
import {redirect} from "next/navigation";
import {getNeonAuth,neonBackendConfigured,neonPublicSignupsEnabled} from "../../../lib/mariz/neon-auth-server";
function go(message:string):never{redirect("/co/auth?message="+encodeURIComponent(message));}
export async function signUp(form:FormData){
 if(!neonPublicSignupsEnabled())go("Registration is paused pending required Neon email-verification settings");
 const name=String(form.get("name")||"").trim(),email=String(form.get("email")||"").trim().toLowerCase(),password=String(form.get("password")||"");
 if(name.length<3||name.length>120||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||password.length<12||password.length>128)go("Enter your full name, email and a password of at least 12 characters");
 const {error}=await getNeonAuth().signUp.email({name,email,password});
 if(error)go("Account registration could not be completed");
 go("Check your email for verification instructions before continuing");
}
export async function signIn(form:FormData){
 if(!neonBackendConfigured())go("Company login is not yet enabled");
 const email=String(form.get("email")||"").trim().toLowerCase(),password=String(form.get("password")||"");
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||!password)go("Enter valid login credentials");
 const {error}=await getNeonAuth().signIn.email({email,password});
 if(error)go("Unable to sign in. Check your credentials and verify your email.");
 redirect("/co/workspace");
}
export async function signOut(){
 if(neonBackendConfigured())await getNeonAuth().signOut();
 redirect("/co/auth");
}
