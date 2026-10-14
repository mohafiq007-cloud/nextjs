"use client";
import { useActionState } from "react";
import { issuePairingCode } from "./terminal-security-actions";
const initial={error:"",challenge_id:"",device_id:"",pairing_code:""};
export default function PairingAdminForm({orgId,deviceId}:{orgId:string;deviceId:string}){
 const [state,action,pending]=useActionState(issuePairingCode,initial);
 const terminalUrl="/pos/terminal?device="+encodeURIComponent(deviceId)+"&challenge="+encodeURIComponent(state.challenge_id);
 return <div className="posv2-admin-pair">
  <form action={action}>
   <input type="hidden" name="organization_id" value={orgId}/>
   <input type="hidden" name="device_id" value={deviceId}/>
   <button type="submit" disabled={pending} className="posv2-primary">
    {pending?"Issuing…":"Issue 5-minute pairing code"}
   </button>
  </form>
  {state.error&&<p role="alert" className="posv2-error">{state.error}</p>}
  {state.pairing_code&&<div className="posv2-code">
   <small>ONE-TIME DEVICE PAIRING CODE · EXPIRES IN 5 MINUTES</small>
   <strong>{state.pairing_code}</strong>
   <p>Open the terminal link on the device you want to pair. Enter this code there. Never send it to customers or put it into a public URL.</p>
   <a href={terminalUrl} target="_blank" rel="noreferrer">Open secure terminal pairing screen →</a>
  </div>}
 </div>;
}
