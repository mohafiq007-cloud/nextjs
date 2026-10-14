"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import "../pos-v2/pos-v2.css";

type Staff={id:string;staff_name:string;role:string};
type Session={state:string;device_id?:string;outlet_id?:string;staff?:Staff[];operator?:{id:string;name:string;role:string}|null};
export default function SecureStoreTerminal({deviceId,challengeId}:{deviceId:string;challengeId:string}){
 const [session,setSession]=useState<Session>({state:"loading"});
 const [staff,setStaff]=useState("");
 const [pin,setPin]=useState("");
 const [pairCode,setPairCode]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function refresh(){
  try{
   const r=await fetch("/api/pos/terminal/session",{cache:"no-store",credentials:"same-origin"});
   const data=await r.json() as Session;
   setSession(data);
  }catch{setSession({state:"unavailable"});}
 }
 useEffect(()=>{void refresh()},[]);
 async function pair(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;setBusy(true);setError("");
  try{
   const r=await fetch("/api/pos/terminal/pair",{method:"POST",credentials:"same-origin",
    headers:{"content-type":"application/json"},body:JSON.stringify({
      device_id:deviceId,challenge_id:challengeId,pairing_code:pairCode
    })});
   const data=await r.json();
   if(!r.ok)throw new Error(data.error||"Unable to pair");
   setPairCode("");await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to pair device");}
  finally{setBusy(false);}
 }
 async function login(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;setBusy(true);setError("");
  try{
   const r=await fetch("/api/pos/terminal/login",{method:"POST",credentials:"same-origin",
    headers:{"content-type":"application/json"},body:JSON.stringify({staff_id:staff,pin})});
   const data=await r.json();
   if(!r.ok)throw new Error(data.error||"Staff login failed");
   setPin("");await refresh();
  }catch(e){setPin("");setError(e instanceof Error?e.message:"Invalid credentials");}
  finally{setBusy(false);}
 }
 async function logout(){
  if(busy)return;setBusy(true);setError("");
  try{await fetch("/api/pos/terminal/logout",{method:"POST",credentials:"same-origin"});await refresh();}
  catch{setError("Unable to end the staff session");}
  finally{setBusy(false);}
 }
 return <main className="posv2">
  <div className="posv2-warning">MARIZ POS V2 · DEVICE-BOUND STAFF LOGIN · FINANCIAL OPERATIONS DISABLED</div>
  <header className="posv2-header"><div className="posv2-brand"><img src="/mariz-original-logo.png" alt="MARIZ"/><span><strong>MARIZ POS</strong><small>Secure Store Terminal</small></span></div><div className="posv2-head-actions"><Link href="/">MARIZ HQ</Link></div></header>
  <div className="posv2-terminal"><section className="posv2-gate">
   {session.state==="loading"&&<><h1>Checking terminal status</h1><p>Verifying device authorization.</p></>}
   {session.state==="disabled"&&<><h1>Terminal activation pending</h1><p>The secure terminal backend is intentionally disabled until a dedicated MARIZ V2 database and security tests are complete.</p><Link href="/co/pos/preview">Use prepared demo instead →</Link></>}
   {session.state==="unavailable"&&<><h1>Service temporarily unavailable</h1><p>No device credentials or sales have been changed.</p><button className="posv2-primary" onClick={()=>void refresh()}>Retry</button></>}
   {session.state==="unpaired"&&<>
    <span className="posv2-gate-icon">▣</span><h1>Pair this terminal</h1>
    <p>A MARIZ POS Back Office administrator must register this device and issue a five-minute pairing code. The pairing request itself does not create a company account.</p>
    {!deviceId||!challengeId?<p>Open the pairing link supplied by your company administrator. It contains the device and challenge identifiers but never the pairing code.</p>:
    <form className="posv2-form" onSubmit={pair}>
      <input type="password" autoComplete="off" inputMode="numeric" required pattern="[0-9]{6}" maxLength={6}
       value={pairCode} onChange={e=>setPairCode(e.target.value)} aria-label="One-time pairing code" placeholder="Six-digit pairing code"/>
      <button className="posv2-primary" disabled={busy}>{busy?"Pairing…":"Pair secure device"}</button>
    </form>}
   </>}
   {session.state==="paired"&&<>
    <span className="posv2-gate-icon">◎</span><h1>Staff PIN login</h1>
    <p>This device is securely paired. Choose your assigned staff account and enter your six-to-eight digit PIN.</p>
    <form onSubmit={login} className="posv2-form">
     <label>Staff member<select value={staff} required onChange={e=>setStaff(e.target.value)}>
       <option value="">Choose staff</option>{(session.staff||[]).map(u=><option value={u.id} key={u.id}>{u.staff_name} ({u.role})</option>)}
     </select></label>
     <label>PIN<input type="password" inputMode="numeric" autoComplete="off" required pattern="[0-9]{6,8}" minLength={6} maxLength={8} value={pin} onChange={e=>setPin(e.target.value)}/></label>
     <button className="posv2-primary" disabled={busy||!staff}>{busy?"Checking…":"Staff sign in →"}</button>
    </form>
    <p>Five failed attempts lock the staff PIN temporarily. Managers can rotate staff PINs in Back Office.</p>
   </>}
   {session.state==="signed_in"&&<>
     <span className="posv2-gate-icon">✓</span><h1>Welcome, {session.operator?.name}</h1>
     <p>Terminal and staff sessions are verified. Opening shifts, collecting payments, printing and sales posting remain disabled until transaction-level acceptance testing is complete.</p>
     <button className="posv2-primary" onClick={logout} disabled={busy}>Sign out of this shift terminal</button>
   </>}
   {error&&<p role="alert" className="posv2-error">{error}</p>}
   <p style={{marginTop:25,fontSize:11}}>MARIZ POS security foundation · No simulation is permitted on this operational route.</p>
  </section></div>
 </main>;
}
