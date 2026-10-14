import Link from "next/link";
import PosSetupPreview from "./PosSetupPreview";
export const metadata={title:"MARIZ POS — Back Office & Terminal Preview",robots:{index:false,follow:false}};
export default function PosPreviewPage(){
 return <main className="interior pos-preview-page"><header className="pos-v2-page-head"><div><div className="eyebrow">MARIZ HQ V2 / MARIZ POS</div><h1>Back Office & Terminal</h1><p>Preview the company-linked POS onboarding workflow. All interactions are simulated and isolated from live restaurants.</p></div><Link href="/" className="button button-outline">← MARIZ website</Link></header><PosSetupPreview/></main>
}
