import {notFound} from "next/navigation";
import {neonEnabled} from "../../../../lib/mariz/neon-server";
import TestAccountSetup from "./test-account-setup";

export const dynamic="force-dynamic";
export default function TestSetupPage(){
 if(process.env.VERCEL_ENV!=="preview"||process.env.VERCEL_GIT_COMMIT_REF!=="feature/billplz-sandbox-adapter"||!neonEnabled())notFound();
 return <main className="interior"><div className="interior-head">
  <span className="eyebrow">MARIZ CO / PRIVATE SANDBOX TEST</span>
  <h1>Set up your test login.</h1>
  <p>For an existing account created on the isolated test branch. Verify your email, then set your password using a separate recovery code. This does not register a company or activate billing.</p>
 </div><TestAccountSetup/></main>;
}
