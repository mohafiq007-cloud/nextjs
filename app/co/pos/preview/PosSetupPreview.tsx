"use client";
import { useState } from "react";
type Role = "cashier" | "manager" | "kitchen";
type Staff = { name:string;role:Role };
const starter:Staff[]=[{name:"Demo Cashier",role:"cashier"},{name:"Demo Manager",role:"manager"}];

export default function PosSetupPreview() {
 const [view,setView]=useState<"backoffice"|"terminal">("backoffice");
 const [outletName,setOutletName]=useState("Sample Café — TTDI");
 const [outletSaved,setOutletSaved]=useState(true);
 const [staff,setStaff]=useState<Staff[]>(starter);
 const [newStaff,setNewStaff]=useState("");
 const [newRole,setNewRole]=useState<Role>("cashier");
 const [terminalName,setTerminalName]=useState("Counter 01");
 const [terminalReady,setTerminalReady]=useState(false);
 const [selectedStaff,setSelectedStaff]=useState("Demo Cashier");
 const [signedIn,setSignedIn]=useState(false);
 const [showGuidance,setShowGuidance]=useState(false);
 const [message,setMessage]=useState("");
 const done=[outletSaved,staff.length>0,terminalReady];
 function reset(){
   setView("backoffice");setOutletName("Sample Café — TTDI");setOutletSaved(true);
   setStaff(starter);setNewStaff("");setTerminalName("Counter 01");
   setTerminalReady(false);setSelectedStaff("Demo Cashier");setSignedIn(false);setMessage("");setShowGuidance(false);
 }
 return <div className="pos-v2-app">
  <div className="pos-v2-banner"><strong>MARIZ POS · V2 INTERFACE PROTOTYPE</strong><span>Sample records only · No company registration, PIN verification, payments or real device pairing</span></div>
  <div className="pos-v2-switch" role="tablist" aria-label="POS interface">
   <button role="tab" aria-selected={view==="backoffice"} className={view==="backoffice"?"on":""} onClick={()=>setView("backoffice")}>Back Office</button>
   <button role="tab" aria-selected={view==="terminal"} className={view==="terminal"?"on":""} onClick={()=>setView("terminal")}>Store Terminal</button>
   <button className="reset" onClick={reset}>↻ Reset sample</button>
  </div>
  {view==="backoffice"?<div className="pos-v2-two">
   <aside className="pos-v2-sidebar">
    <div className="eyebrow">BUSINESS DEMONSTRATION</div>
    <h2>POS Back Office</h2>
    <p>Outlets, authorized staff and device provisioning are managed here—under the company registered through MARIZ CO.</p>
    <div className="pos-v2-progress">
     {["Outlet profile","Staff access","Terminal registration"].map((s,i)=><div key={s} className="progress-item"><span className={done[i]?"ready":""}>{done[i]?"✓":i+1}</span><strong>{s}</strong></div>)}
    </div>
    <div className="pos-v2-note">Live activation is separate from the permanent free demo. A real outlet will only be provisioned after company verification and paid-plan authorization.</div>
   </aside>
   <div className="pos-v2-settings">
    <section className="pos-v2-panel"><div className="pos-v2-section-head"><div><span className="eyebrow">01 / OUTLET</span><h3>Outlet profile</h3></div><span className={outletSaved?"pos-v2-status ready":"pos-v2-status"}>{outletSaved?"Demo configured":"Unconfirmed"}</span></div>
     <div className="pos-v2-inline"><label>Outlet name<input value={outletName} maxLength={100} onChange={e=>{setOutletName(e.target.value);setOutletSaved(false)}}/></label><button className="button button-primary" disabled={outletName.trim().length<2} onClick={()=>{setOutletSaved(true);setMessage("Demo outlet saved in browser memory only.")}}>Save demo outlet</button></div>
     <small>Country: Malaysia · Currency: MYR · Time zone: Asia/Kuala_Lumpur</small>
    </section>
    <section className="pos-v2-panel"><div className="pos-v2-section-head"><div><span className="eyebrow">02 / STAFF</span><h3>Staff & permissions</h3></div><span className="pos-v2-status ready">{staff.length} sample users</span></div>
     <div className="pos-v2-staff">{staff.map((person,i)=><div className="pos-v2-person" key={i}><span className="pos-v2-avatar">{person.name[0]}</span><strong>{person.name}</strong><small>{person.role}</small></div>)}</div>
     <div className="pos-v2-inline"><label>Demo staff name<input value={newStaff} maxLength={70} placeholder="Staff member" onChange={e=>setNewStaff(e.target.value)} /></label><label>Role<select value={newRole} onChange={e=>setNewRole(e.target.value as Role)}><option value="cashier">Cashier</option><option value="manager">Manager</option><option value="kitchen">Kitchen</option></select></label><button className="button button-outline" disabled={newStaff.trim().length<2} onClick={()=>{if(staff.some(x=>x.name.toLowerCase()===newStaff.trim().toLowerCase())){setMessage("Demo staff name already exists.");return;}setStaff(v=>[...v,{name:newStaff.trim(),role:newRole}]);setNewStaff("");setMessage("Sample staff created. No account or PIN was issued.")}}>Add demo staff</button></div>
    </section>
    <section className="pos-v2-panel"><div className="pos-v2-section-head"><div><span className="eyebrow">03 / DEVICE</span><h3>Register store terminal</h3></div><span className={terminalReady?"pos-v2-status ready":"pos-v2-status"}>{terminalReady?"Demo paired":"Unpaired"}</span></div>
     <div className="pos-v2-inline"><label>Terminal label<input value={terminalName} maxLength={60} onChange={e=>{setTerminalName(e.target.value);setTerminalReady(false)}}/></label><button className="button button-primary" disabled={!outletSaved || terminalName.trim().length<2} onClick={()=>{setTerminalReady(true);setSignedIn(false);setMessage("Demo terminal paired to the sample outlet. No actual hardware was bound.")}}>Simulate device registration</button></div>
     <p>Real terminals will require a one-time pairing challenge, an approved outlet and revocable device credentials—never a public POS signup page.</p>
     <button className="button button-outline" onClick={()=>setView("terminal")}>View staff-login terminal →</button>
    </section>
    {message&&<p className="pos-v2-feedback" role="status">{message}</p>}
   </div>
  </div>:<div className="pos-v2-terminal-layout">
   <aside className="pos-v2-sidebar">
    <span className="eyebrow">STORE TERMINAL / DEVICE PREVIEW</span>
    <h2>{terminalName || "Counter Terminal"}</h2>
    <p>{outletName}</p>
    <span className={terminalReady?"pos-v2-status ready":"pos-v2-status"}>{terminalReady?"Sample device paired":"No device enrollment"}</span>
    <p>The device belongs to an outlet. Staff PIN login follows provisioning; company registration never happens on a cashier screen.</p>
    <button className="button button-outline" onClick={()=>setView("backoffice")}>← Back Office setup</button>
   </aside>
   <div className="pos-v2-login-card">
    <div className="eyebrow">MARIZ · POINT OF SALE</div>
    <h2>{signedIn?"Sample shift opened":"Staff login"}</h2>
    {signedIn?<div><p className="pos-v2-feedback">Welcome, {selectedStaff}. This is a simulated session only; no real authentication, shift or transaction was created.</p><button className="button button-outline" onClick={()=>setSignedIn(false)}>End demo shift</button></div>:<>
    <label>Staff member<select value={selectedStaff} onChange={e=>setSelectedStaff(e.target.value)}>{staff.map((x,i)=><option key={i} value={x.name}>{x.name} — {x.role}</option>)}</select></label>
    <label>Staff PIN<input type="password" disabled value="" placeholder="6–8 digit PIN · Live authentication unavailable" aria-label="Staff PIN currently disabled" /></label>
    <p className="pos-v2-warning">Live PIN verification is disabled until device enrollment, rate limiting and server-side session controls pass security testing.</p>
    <button className="button button-primary" disabled={!terminalReady} onClick={()=>{setSignedIn(true);setMessage("Demo login shown. No PIN verified.")}}>Preview sample staff session →</button>
    <button className="pos-v2-textlink" onClick={()=>setShowGuidance(x=>!x)}>{showGuidance?"Hide":"Show"} how live login will work</button>
    {showGuidance&&<p className="pos-v2-help">After authenticated company setup, a manager enrolls each device using a single-use pairing code. On that registered device only, an approved staff member enters a hashed, rate-limited PIN to begin a shift. PINs and device secrets are never stored in browser code.</p>}
    </>}
   </div>
  </div>}
  <div className="pos-v2-foot">DEMO ONLY · NO REAL OUTLET OR STAFF CREDENTIALS · SHAHIRA AND EXISTING POS OPERATIONS UNCHANGED</div>
 </div>;
}
