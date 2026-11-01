import s from './workspace-v3.module.css';
export default function Loading(){return <main className={s.content} aria-busy="true"><h1>Opening your company workspace…</h1><p role="status" aria-live="polite">Checking your company access and retrieving your information securely.</p></main>;}
