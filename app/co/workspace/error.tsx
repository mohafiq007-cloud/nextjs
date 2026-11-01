'use client';
import Link from 'next/link';import s from './workspace-v3.module.css';
export default function WorkspaceError({reset}:{reset:()=>void}){return <main className={s.content}><h1>We couldn’t open this section.</h1><p role="alert">Your records have not been changed. Please try again, or use your existing MARIZ support contact if the problem continues.</p><div className={s.actions}><button className={s.primary} onClick={()=>reset()}>Try again</button><Link className={s.secondary} href="/co/auth">Company access</Link></div></main>;}
