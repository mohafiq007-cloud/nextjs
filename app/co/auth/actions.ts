"use server";
import { redirect } from "next/navigation";
import { marizServerClient, marizBackendConfigured } from "../../../lib/mariz/supabase-server";

function go(message: string): never {
  redirect("/co/auth?message=" + encodeURIComponent(message));
}
export async function signUp(form: FormData) {
  if (!marizBackendConfigured()) go("Registration is not yet enabled in this preview");
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || password.length > 128) {
    go("Enter a valid email and a password of at least 12 characters.");
  }
  const supabase = await marizServerClient();
  const result = await supabase.auth.signUp({ email, password, options: {
    emailRedirectTo: process.env.NEXT_PUBLIC_MARIZ_APP_URL
      ? process.env.NEXT_PUBLIC_MARIZ_APP_URL + "/co/auth/confirm"
      : undefined,
  }});
  if (result.error) go("Registration could not be completed. Review the information and retry.");
  go("If the email is eligible, a verification message has been sent. Confirm it before signing in.");
}
export async function signIn(form: FormData) {
  if (!marizBackendConfigured()) go("Sign-in is not yet enabled in this preview");
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const supabase = await marizServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) go("Unable to sign in. Check your credentials and verify your email.");
  redirect("/co/workspace");
}
export async function signOut() {
  if (!marizBackendConfigured()) redirect("/");
  const supabase = await marizServerClient();
  await supabase.auth.signOut();
  redirect("/co/auth");
}
