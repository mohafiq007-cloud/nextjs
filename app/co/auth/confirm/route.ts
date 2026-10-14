import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { marizServerClient, marizBackendConfigured } from "../../../../lib/mariz/supabase-server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  if (!marizBackendConfigured()) return NextResponse.redirect(new URL("/co/auth?message=Not%20configured", url.origin));
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const code = url.searchParams.get("code");
  const supabase = await marizServerClient();
  let success = false;
  if (tokenHash && (type === "email" || type === "signup" || type === "recovery")) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType });
    success = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    success = !error;
  }
  // Never follow a caller-supplied redirect target.
  return NextResponse.redirect(new URL(success ? "/co/workspace" : "/co/auth?message=Verification%20failed", url.origin));
}
