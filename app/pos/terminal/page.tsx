import Link from "next/link";
export const metadata={title:"MARIZ POS — Store Terminal",robots:{index:false,follow:false}};
export default function StoreTerminal(){
 return <main className="pos-unpaired"><div className="pos-unpaired-card">
  <span className="eyebrow">MARIZ · POINT OF SALE</span><h1>Terminal enrollment required</h1>
  <p>Store terminals are registered from an authorized MARIZ POS Back Office workspace. Once a device is securely paired to an outlet, approved staff can use their own PIN to sign in.</p>
  <p className="pos-v2-warning">No universal staff password, demonstration PIN or public terminal signup is available. This V2 endpoint does not access existing Shahira data.</p>
  <div className="pos-unpaired-actions"><Link href="/co/pos/backoffice" className="button button-primary">Open company Back Office →</Link><Link href="/co/pos/preview" className="button button-outline">See terminal-login preview</Link></div>
 </div></main>;
}
