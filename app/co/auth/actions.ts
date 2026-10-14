"use server";
import {redirect} from "next/navigation";
import {neonAuth,neonEnabled,neonRegistrationEnabled} from "../../../lib/mariz/neon-server";

function msg(value:string):never{redirect("/co/auth?message="+encodeURIComponent(value));}
export async function signUp(form:FormData) {
 if(!neonRegistrationEnabled())msg("MARIZ CO account registration is not open yet");
 const name=String(form.get("name")||"").trim();
 const email=String(form.get("email")||"").trim().toLowerCase();
 const password=String(form.get("password")||"");
 if(name.length<2||name.length>120||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||password.length<12||password.length>128)
  msg("Enter your name, a valid email and a password of at least 12 characters");
 const {error}=await neonAuth().signUp.email({name,email,password});
 if(error)msg("Registration could not be completed. Review the details and retry.");
 msg("Account requested. Complete email verification before accessing MARIZ CO.");
}
export async function signIn(form:FormData) {
 if(!neonEnabled())msg("Secure sign-in is not enabled yet");
 const email=String(form.get("email")||"").trim().toLowerCase();
 const password=String(form.get("password")||"");
 if(!email||!password)msg("Enter an email and password");
 const {error}=await neonAuth().signIn.email({email,password});
 if(error)msg("Sign-in failed. Check your credentials and verify your email.");
 redirect("/co/workspace");
}
export async function signOut() {
 if(neonEnabled())await neonAuth().signOut();
 redirect("/co/auth");
}
