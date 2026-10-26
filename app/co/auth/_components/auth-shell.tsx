
import Link from "next/link";
import type {ReactNode} from "react";
import styles from "../auth-flow.module.css";
export {styles};
export function AuthShell({eyebrow,title,description,children,step}:{eyebrow:string;title:string;description:string;children:ReactNode;step?:1|2|3}){
 return <main className={styles.shell}>
  <header className={styles.header}><Link className={styles.brand} href="/">MARIZ / CO</Link><Link className={styles.smallLink} href="/co/auth">Company gateway</Link></header>
  <div className={styles.eyebrow}>{eyebrow}</div><h1 className={styles.title}>{title}</h1><p className={styles.description}>{description}</p>
  {step&&<ol className={styles.steps} aria-label="Company onboarding progress">{(["Account","Email verification","Company profile"] as const).map((label,i)=><li key={label} className={styles.step+" "+(i+1===step?styles.activeStep:"")} aria-current={i+1===step?"step":undefined}>{i+1}. {label}</li>)}</ol>}
  {children}
 </main>
}
export function AuthNotice({message}:{message?:string}){return message?<p className={styles.notice} role="status">{message.slice(0,240)}</p>:null}
