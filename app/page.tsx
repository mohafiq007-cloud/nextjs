"use client";

import { useState } from "react";

type Section = "home" | "company" | "demo";
type Demo = "pos" | "events" | "co";
type CartItem = { name: string; price: number; qty: number };
const menu = [
  { name: "Grilled Chicken Sandwich", price: 16.9, group: "Food" },
  { name: "Classic Cheese Toastie", price: 12.5, group: "Food" },
  { name: "Iced Latte", price: 11, group: "Drinks" },
  { name: "Peach Tea", price: 8.5, group: "Drinks" },
];
const products = [
  { id: "pos", code: "01", name: "MARIZ POS", kind: "Restaurant & retail", description: "Run your outlet with a practical terminal, staff controls, and a connected back office." },
  { id: "events", code: "02", name: "MARIZ Events", kind: "Event operations", description: "Manage registration, tickets, attendees, check-in and event operations." },
  { id: "co", code: "03", name: "MARIZ CO", kind: "Company workspace", description: "Your home for company identity, products, team access, and business administration." },
];
const fmt = (n: number) => "RM " + n.toFixed(2);
const seedPeople = ["Nadia Hassan", "Adrian Lim", "Priya Nair", "Daniel Wong", "Farah Ahmad"];

export default function Home() {
  const [section, setSection] = useState<Section>("home");
  const [demo, setDemo] = useState<Demo>("pos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState(12);
  const [revenue, setRevenue] = useState(487.5);
  const [paid, setPaid] = useState(false);
  const [checked, setChecked] = useState<string[]>(["Nadia Hassan"]);
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState<"terminal" | "backoffice">("terminal");
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  function openDemo(choice: Demo) { setDemo(choice); setSection("demo"); }
  function addItem(name: string, price: number) {
    setPaid(false);
    setCart(current => {
      const found = current.find(x => x.name === name);
      return found ? current.map(x => x.name === name ? { ...x, qty: x.qty + 1 } : x) : [...current, { name, price, qty: 1 }];
    });
  }
  function simulatePayment() {
    if (!cart.length) return;
    setOrders(v => v + 1);
    setRevenue(v => v + total);
    setCart([]);
    setPaid(true);
  }
  function resetDemo() {
    setCart([]); setOrders(12); setRevenue(487.5); setPaid(false);
    setChecked(["Nadia Hassan"]); setActiveTab("terminal");
  }

  return (
    <div className="shell">
      <div className="preview-ribbon"><span className="status-dot" /> MARIZ HQ V2 · PRIVATE BUILD PREVIEW · SIMULATED DATA ONLY</div>
      <header className="site-header">
        <button className="brand" onClick={() => setSection("home")} aria-label="MARIZ home"><span className="brand-emblem">M</span><span>MARIZ<span className="brand-sub">BUSINESS ECOSYSTEM</span></span></button>
        <nav className="nav-links" aria-label="Primary navigation">
          <button className={section === "home" ? "nav-active" : ""} onClick={() => setSection("home")}>Overview</button>
          <button className={section === "demo" ? "nav-active" : ""} onClick={() => setSection("demo")}>Explore products</button>
          <button className={section === "company" ? "nav-active" : ""} onClick={() => setSection("company")}>MARIZ CO</button>
        </nav>
        <button className="button button-primary header-cta" onClick={() => setSection("company")}>Company access <span>↗</span></button>
      </header>

      {section === "home" && <main>
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow"><span className="status-dot" /> THE OPERATING LAYER FOR MODERN BUSINESS</span>
            <h1>One company.<br/><em>A world of</em><br/>possibilities.</h1>
            <p>MARIZ brings specialized business software together in one connected ecosystem. Register your company once, explore ready-made product demonstrations, and activate only what you need.</p>
            <div className="hero-actions"><button className="button button-primary" onClick={() => setSection("company")}>Explore MARIZ CO <span>↗</span></button><button className="button button-outline" onClick={() => openDemo("pos")}>Try the product demos <span>→</span></button></div>
            <div className="proof"><span>01 / REGISTER A COMPANY</span><span>02 / EXPLORE FREE DEMOS</span><span>03 / ACTIVATE WHEN READY</span></div>
          </div>
          <div className="hero-visual" aria-label="MARIZ ecosystem preview">
            <div className="visual-orb orb-one"></div><div className="visual-orb orb-two"></div>
            <div className="window main-window">
              <div className="window-header"><span className="window-dots"><i></i><i></i><i></i></span><span>MARIZ CO / COMPANY WORKSPACE</span><span>● VERIFIED</span></div>
              <div className="window-body">
                <div className="workspace-top"><div><small>GOOD AFTERNOON</small><strong>Welcome to your workspace.</strong></div><span className="avatar">AC</span></div>
                <div className="workspace-label">YOUR PRODUCTS</div>
                <div className="mini-product"><span className="mini-icon">▣</span><div><strong>MARIZ POS</strong><small>Demo ready to explore</small></div><span>↗</span></div>
                <div className="mini-product"><span className="mini-icon violet">◈</span><div><strong>MARIZ Events</strong><small>Demo ready to explore</small></div><span>↗</span></div>
                <div className="workspace-foot"><span>Company registration</span><strong>FREE FOREVER</strong></div>
              </div>
            </div>
            <div className="floating-card"><span>✦</span><div><strong>Your business. Your choice.</strong><small>Products activate only when you decide.</small></div></div>
          </div>
        </section>
        <section className="section product-section" id="products"><div className="section-heading"><div><span className="eyebrow">PURPOSE-BUILT SOFTWARE</span><h2>Find your next advantage.</h2></div><p>Start with one product. Add more as your business grows. Every solution belongs to the same company account.</p></div>
          <div className="product-grid">{products.map(p => <article className="product-card" key={p.id}><div className="product-top"><span className="product-code">{p.code} / SOLUTIONS</span><span className="product-symbol">{p.id === "pos" ? "▣" : p.id === "events" ? "◈" : "◎"}</span></div><div className="product-kind">{p.kind}</div><h3>{p.name}</h3><p>{p.description}</p><button className="product-action" onClick={() => openDemo(p.id as Demo)}>Explore demo <span>↗</span></button></article>)}</div>
        </section>
        <section className="section access-section"><div><span className="eyebrow">BUILT AROUND YOUR COMPANY</span><h2>No trial clocks.<br/>No guessing.</h2><p>Register with proper company documentation at no charge. Once verified, explore our prepared, safe, interactive demos without setting anything up. Subscribe only when you are ready to run real operations.</p></div><button className="button button-light" onClick={() => setSection("company")}>See registration flow →</button></section>
      </main>}

      {section === "company" && <main className="interior"><div className="interior-head"><span className="eyebrow">MARIZ CO / COMPANY ONBOARDING</span><h1>Your company starts here.</h1><p>One verified company profile unlocks the MARIZ product ecosystem. Company registration is free. Product subscriptions are separate.</p></div>
      <div className="two-col">
        <aside className="aside-panel"><span className="aside-title">REGISTRATION JOURNEY</span>{[{n:1,t:"Account & contact",d:"Verified company representative"},{n:2,t:"Company profile",d:"Registered entity and business details"},{n:3,t:"KYB documentation",d:"Official business registration evidence"},{n:4,t:"MARIZ review",d:"Approval before company activation"}].map(x=><button key={x.n} onClick={()=>setStep(x.n)} className={"stage "+(step===x.n?"selected":"")}><span>{x.n}</span><span><strong>{x.t}</strong><small>{x.d}</small></span></button>)}<div className="aside-note"><strong>RM 0 registration</strong><p>No payment method required. No free trials. No demo setup.</p></div></aside>
        <div className="content-panel"><div className="panel-top"><div><span className="eyebrow">STEP 0{step} OF 04</span><h2>{["Account & contact verification","Company registration details","Company document verification","Company approval process"][step-1]}</h2></div><span className="tag amber">Preview only</span></div>
          {step===1 && <div className="form-grid"><label>Representative full name<input disabled placeholder="As shown on official records"/></label><label>Business email<input disabled placeholder="name@company.com"/></label><label>Contact number<input disabled placeholder="+60"/></label><label>Position / designation<input disabled placeholder="Director / Owner / Authorized representative"/></label></div>}
          {step===2 && <div className="form-grid"><label>Entity type<select disabled defaultValue="company"><option value="company">Sdn Bhd / Berhad</option></select></label><label>Jurisdiction<input disabled value="Malaysia" readOnly /></label><label>Legal registered name<input disabled placeholder="Registered business name"/></label><label>Registration number<input disabled placeholder="SSM registration number"/></label><label className="full">Registered address<input disabled placeholder="Address as per registration records"/></label></div>}
          {step===3 && <div className="document-steps">{["Current SSM company/business profile","Evidence of representative authority (when required)","Registered company details match the official evidence"].map((x,i)=><div className="document-row" key={x}><span className="doc-number">0{i+1}</span><strong>{x}</strong><span className="tag">Required / conditional</span></div>)}<p className="footnote">Actual document upload is intentionally disabled until private storage, access controls and review workflows are connected to a new V2 database.</p></div>}
          {step===4 && <div className="approval-steps">{["Submit complete company application","Check authenticity, duplicates and applicant authority","MARIZ reviewer approves, requests corrections or rejects","Verified company accesses product demo center"].map((x,i)=><div className="approval-row" key={x}><span>{i+1}</span>{x}</div>)}</div>}
          <div className="panel-footer"><span>🔒 No personal information is collected in this preview.</span><button className="button button-primary" onClick={()=>setStep(step===4?1:step+1)}>{step===4?"Review from start":"Next step"} →</button></div>
        </div>
      </div>
      </main>}

      {section==="demo" && <main className="interior demo-section"><div className="interior-head"><span className="eyebrow">MARIZ CO / PRODUCT DEMO CENTER</span><h1>Get hands-on. At no cost.</h1><p>Prepared sample workspaces with no setup, no payment and no trial expiry. This preview uses simulated, session-only data and does not connect to production.</p></div>
       <div className="demo-controls"><div className="segmented">{products.map(p=><button key={p.id} className={demo===p.id?"on":""} onClick={()=>setDemo(p.id as Demo)}>{p.name}</button>)}</div><button className="button button-outline reset" onClick={resetDemo}>↻ Reset sample data</button></div>
       {demo==="pos" && <div className="demo-layout"><aside className="demo-sidebar"><span className="aside-title">MARIZ POS</span><div className="demo-location"><strong>Simply Sample Café</strong><small>Demo Outlet · Terminal 01</small></div><button className={activeTab==="terminal"?"sidebar-active":""} onClick={()=>setActiveTab("terminal")}>▣ &nbsp; POS Terminal</button><button className={activeTab==="backoffice"?"sidebar-active":""} onClick={()=>setActiveTab("backoffice")}>▤ &nbsp; Back Office</button><div className="sandbox-note">SIMULATION MODE<br/><small>No charges. No real receipts or payments.</small></div></aside>
         {activeTab==="terminal"?<div className="demo-main"><div className="demo-title-row"><div><span className="eyebrow">COUNTER SERVICE</span><h2>New order</h2></div><span className="tag green">Terminal online · Demo</span></div><div className="menu-grid">{menu.map(item=><button className="menu-item" key={item.name} onClick={()=>addItem(item.name,item.price)}><span className="menu-icon">{item.group==="Food"?"◫":"◉"}</span><strong>{item.name}</strong><small>{item.group}</small><b>{fmt(item.price)} &nbsp; +</b></button>)}</div>{paid&&<div className="notice">✓ Sample payment completed. This was a simulation only.</div>}</div>:<div className="demo-main"><div className="demo-title-row"><div><span className="eyebrow">OPERATIONS OVERVIEW</span><h2>Back Office</h2></div><span className="tag green">Demo data</span></div><div className="metrics"><div><small>DEMO ORDERS</small><strong>{orders}</strong></div><div><small>DEMO SALES</small><strong>{fmt(revenue)}</strong></div><div><small>MENU PRODUCTS</small><strong>04</strong></div></div><div className="report"><span className="eyebrow">TODAY'S SAMPLE ACTIVITY</span><div className="chart-bars">{[38,66,44,89,70,100,62].map((v,i)=><span key={i} style={{height:String(v)+"%"}}/>)}</div><small>Simulated figures. No reporting data is stored.</small></div></div>}
         <aside className="cart-panel"><div className="cart-heading"><strong>Current order</strong><span>{cart.reduce((n,x)=>n+x.qty,0)} items</span></div><div className="cart-list">{cart.length===0?<div className="cart-empty"><span>▧</span><strong>No items yet</strong><small>Choose an item to experience the terminal.</small></div>:cart.map(item=><div className="cart-row" key={item.name}><div><strong>{item.name}</strong><small>{item.qty} × {fmt(item.price)}</small></div><b>{fmt(item.qty*item.price)}</b></div>)}</div><div className="cart-footer"><div><span>Total</span><strong>{fmt(total)}</strong></div><button className="button button-primary" disabled={!cart.length} onClick={simulatePayment}>Simulate payment →</button></div></aside>
       </div>}
       {demo==="events" && <div className="events-workspace"><div className="demo-title-row"><div><span className="eyebrow">MARIZ EVENTS / SAMPLE EVENT</span><h2>MARIZ Adventure Weekend</h2><p>Saturday · Sample event · Registration and check-in simulation</p></div><span className="tag green">Demo event</span></div><div className="metrics"><div><small>REGISTERED</small><strong>05</strong></div><div><small>CHECKED IN</small><strong>{checked.length.toString().padStart(2,"0")}</strong></div><div><small>WAITING</small><strong>{(5-checked.length).toString().padStart(2,"0")}</strong></div></div><div className="attendees"><div className="attendee-header">PARTICIPANTS <span>Toggle to simulate check-in</span></div>{seedPeople.map(p=><button key={p} className="attendee" onClick={()=>setChecked(s=>s.includes(p)?s.filter(x=>x!==p):[...s,p])}><span className="person-icon">{p.split(" ").map(n=>n[0]).join("")}</span><strong>{p}</strong><span className={"tag "+(checked.includes(p)?"green":"")}>{checked.includes(p)?"✓ Checked in":"Check in →"}</span></button>)}</div></div>}
       {demo==="co" && <div className="co-workspace"><span className="eyebrow">COMPANY WORKSPACE · PREPARED DEMO</span><h2>A single company, connected products.</h2><div className="metrics"><div><small>COMPANY STATUS</small><strong>Verified</strong></div><div><small>PRODUCT DEMOS</small><strong>03</strong></div><div><small>REGISTRATION FEE</small><strong>RM 0</strong></div></div><div className="co-cards">{products.map(p=><button className="co-card" key={p.id} onClick={()=>openDemo(p.id as Demo)}><span>{p.code}</span><strong>{p.name}</strong><small>Prepared demo · No subscription required</small><b>Explore →</b></button>)}</div><p className="footnote">Real companies and invitations become available after secure V2 authentication, verification, and authorization are released.</p></div>}
      <div className="demo-legal"><span>● SAFE DEMO ENVIRONMENT</span> All financial activity, attendance and reporting shown here are simulated. Live product purchase and company registration remain disabled in this build.</div>
      </main>}
      <footer className="footer"><div className="footer-brand"><span className="brand-emblem">M</span><div><strong>MARIZ</strong><small>Connected business solutions</small></div></div><p>Build preview · Architecture V2 · No live registrations or payments</p><button onClick={()=>{setSection("home");window.scrollTo(0,0)}}>Back to top ↑</button></footer>
    </div>
  );
}