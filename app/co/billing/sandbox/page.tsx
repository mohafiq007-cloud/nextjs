import Link from "next/link";
import {redirect} from "next/navigation";
import {neonEnabled,currentVerifiedUser} from "../../../../lib/mariz/neon-server";
import {billplzSandboxConfigured} from "../../../../lib/mariz/billing/billplz";
import {sandboxOperatorAllowed} from "../../../../lib/mariz/billing/operator";
import {billingRuntimeConfigured} from "../../../../lib/mariz/neon-runtime-server";
import SandboxInvoiceForm from "./sandbox-invoice-form";
export const dynamic="force-dynamic";
export default async function SandboxBilling(){
 if(!neonEnabled()||!billplzSandboxConfigured()||!billingRuntimeConfigured())return <main className="interior"><h1>Billplz sandbox</h1><p>Sandbox billing is disabled while configuration and payment verification are completed.</p><p>No live payments or subscriptions are active.</p><Link href="/co/workspace">Return to workspace</Link></main>;
 const user=await currentVerifiedUser();if(!user)redirect("/co/auth");
 if(!sandboxOperatorAllowed(user.id))return <main className="interior"><h1>Operator access required</h1><p>This sandbox is restricted to approved test operators.</p></main>;
 return <main className="interior"><span className="eyebrow">MARIZ HQ V2 / SANDBOX ONLY</span><h1>Test invoice desk.</h1><p>Use an approved test company you administer. Enter a one-off amount explicitly. Payments do not activate products or subscriptions.</p><SandboxInvoiceForm/><p><Link href="/co/workspace">Return to workspace</Link></p></main>;
}
