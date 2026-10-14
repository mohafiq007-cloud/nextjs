"use client";

import { useState } from "react";

type Section = "home" | "company" | "demo" | "custom";
type Demo = "pos";
type CartItem = { name: string; price: number; qty: number };
const menu = [
  { name: "Grilled Chicken Sandwich", price: 16.9, group: "Food" },
  { name: "Classic Cheese Toastie", price: 12.5, group: "Food" },
  { name: "Iced Latte", price: 11, group: "Drinks" },
  { name: "Peach Tea", price: 8.5, group: "Drinks" },
];
const products = [
  { id: "pos", code: "01", name: "MARIZ POS", kind: "Restaurant & retail operations", description: "A practical point-of-sale platform with a store terminal and connected back office." },
  { id: "custom", code: "02", name: "Custom Web Software", kind: "Bespoke business applications", description: "Custom-built hosted systems designed around your organization's workflows and operating requirements." },
];
const fmt = (n: number) => "RM " + n.toFixed(2);

export default function Home() {
  const [section, setSection] = useState<Section>("home");
  const [demo, setDemo] = useState<Demo>("pos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState(12);
  const [revenue, setRevenue] = useState(487.5);
  const [paid, setPaid] = useState(false);
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState<"terminal" | "backoffice">("terminal");
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  async function openDemo(choice: Demo) {
    // Preview has no V2 backend; its sandboxed sample data is intentionally public only
    // inside the access-protected preview deployment.
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const response = await fetch("/api/co/demo-access", { cache: "no-store", credentials: "same-origin" });
        if (!response.ok) {
          window.location.href = response.status === 401 ? "/co/auth" : "/co/workspace";
          return;
        }
      } catch {
        window.location.href = "/co/workspace";
        return;
      }
    }
    setDemo(choice);
    setSection("demo");
  }
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
    setActiveTab("terminal");
  }

  return (
    <div className="shell">
      <div className="preview-ribbon"><span className="status-dot" /> MARIZ HQ V2 · PRIVATE BUILD PREVIEW · SIMULATED DATA ONLY</div>
      <header className="site-header">
        <button className="brand" onClick={() => setSection("home")} aria-label="MARIZ home"><img className="brand-logo" src="/mariz-luxury-mark.svg" alt="" /><span>MARIZ<span className="brand-sub">BUSINESS SOLUTIONS</span></span></button>
        <nav className="nav-links" aria-label="Primary navigation">
          <button className={section === "home" ? "nav-active" : ""} onClick={() => setSection("home")}>Overview</button>
          <details className={"products-menu " + ((section === "demo" || section === "custom") ? "nav-active" : "")}>
            <summary>Products <span aria-hidden="true">⌄</span></summary>
            <div className="products-menu-panel" role="group" aria-label="MARIZ offerings">
              <button onClick={e => { e.currentTarget.closest("details")?.removeAttribute("open"); openDemo("pos"); }}>
                <strong>MARIZ POS</strong><small>Available product · Prepared demo</small>
              </button>
              <button onClick={e => { e.currentTarget.closest("details")?.removeAttribute("open"); setSection("custom"); }}>
                <strong>Custom Web Software</strong><small>Tailored software · Quotation based</small>
              </button>
            </div>
          </details>
          <button className={section === "company" ? "nav-active" : ""} onClick={() => setSection("company")}>MARIZ CO</button>
        </nav>
        <button className="button button-primary header-cta" onClick={() => { window.location.href = "/co/auth"; }}>Register / Log in <span>↗</span></button>
      </header>

      {section === "home" && <main>
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow"><span className="status-dot" /> PRACTICAL BUSINESS SOFTWARE</span>
            <h1>One company.<br/><em>A world of</em><br/>possibilities.</h1>
            <p>MARIZ provides point-of-sale software and custom web applications for real business operations. MARIZ CO is your company registration gateway: verify your organization, explore the prepared POS demo and activate a product when you are ready.</p>
            <div className="hero-actions"><button className="button button-primary" onClick={() => openDemo("pos")}>Explore MARIZ POS <span>↗</span></button><button className="button button-outline" onClick={() => setSection("company")}>MARIZ CO registration <span>→</span></button></div>
            <div className="proof"><span>01 / REGISTER A COMPANY</span><span>02 / TRY THE POS DEMO</span><span>03 / CHOOSE YOUR SOLUTION</span></div>
          </div>
          <div className="hero-visual" aria-label="MARIZ ecosystem preview">
            <div className="visual-orb orb-one"></div><div className="visual-orb orb-two"></div>
            <div className="window main-window">
              <div className="window-header"><span className="window-dots"><i></i><i></i><i></i></span><span>MARIZ CO / COMPANY PROFILE</span><span>● VERIFIED</span></div>
              <div className="window-body">
                <div className="workspace-top"><div><small>GOOD AFTERNOON</small><strong>Welcome to your workspace.</strong></div><span className="avatar">AC</span></div>
                <div className="workspace-label">AVAILABLE SOLUTIONS</div>
                <div className="mini-product"><span className="mini-icon">▣</span><div><strong>MARIZ POS</strong><small>Demo ready to explore</small></div><span>↗</span></div>
                <div className="mini-product"><span className="mini-icon violet">▤</span><div><strong>Custom Web Software</strong><small>Scope and quote on request</small></div><span>↗</span></div>
                <div className="workspace-foot"><span>Company registration</span><strong>FREE FOREVER</strong></div>
              </div>
            </div>
            <div className="floating-card"><span>✦</span><div><strong>MARIZ CO · Free registration</strong><small>One company profile, access to MARIZ products.</small></div></div>
          </div>
        </section>
        <section className="section product-section" id="products"><div className="section-heading"><div><span className="eyebrow">PURPOSE-BUILT SOFTWARE</span><h2>Software built for work.</h2></div><p>Explore the POS platform or a bespoke hosted application. MARIZ CO is the free organization gateway, not a separate software product.</p></div>
          <div className="product-grid">{products.map(p => <article className="product-card" key={p.id}><div className="product-top"><span className="product-code">{p.code} / SOLUTIONS</span><span className="product-symbol">{p.id === "pos" ? "▣" : "▤"}</span></div><div className="product-kind">{p.kind}</div><h3>{p.name}</h3><p>{p.description}</p><button className="product-action" onClick={() => p.id === "pos" ? openDemo("pos") : setSection("custom")}>{p.id === "pos" ? "Try prepared POS demo" : "Learn about custom software"} <span>↗</span></button></article>)}</div>
        </section>
        <section className="section access-section"><div><span className="eyebrow">BUILT AROUND YOUR COMPANY</span><h2>No trial clocks.<br/>No guessing.</h2><p>Register with proper company documentation at no charge. Once verified, explore our prepared POS demo without setting anything up. Paid POS activation and custom development are separate decisions.</p></div><button className="button button-light" onClick={() => { window.location.href = "/co/auth"; }}>Company registration / login →</button></section>
      </main>}

      {section === "company" && <main className="interior"><div className="interior-head"><span className="eyebrow">MARIZ CO / COMPANY ONBOARDING</span><h1>MARIZ CO. Your company gateway.</h1><p>Register and verify your organization in MARIZ CO at no charge. MARIZ CO manages company profiles, onboarding and access to MARIZ POS and custom software engagements. It is not a separate product subscription.</p></div>
      <div className="two-col">
        <aside className="aside-panel"><span className="aside-title">REGISTRATION JOURNEY</span>{[{n:1,t:"Account & contact",d:"Verified company representative"},{n:2,t:"Company profile",d:"Registered entity and business details"},{n:3,t:"KYB documentation",d:"Official business registration evidence"},{n:4,t:"MARIZ review",d:"Approval before company activation"}].map(x=><button key={x.n} onClick={()=>setStep(x.n)} className={"stage "+(step===x.n?"selected":"")}><span>{x.n}</span><span><strong>{x.t}</strong><small>{x.d}</small></span></button>)}<div className="aside-note"><strong>RM 0 registration</strong><p>Company registration is free. No card, trial period or demo setup.</p></div></aside>
        <div className="content-panel"><div className="panel-top"><div><span className="eyebrow">STEP 0{step} OF 04</span><h2>{["Account & contact verification","Company registration details","Company document verification","Company approval process"][step-1]}</h2></div><span className="tag amber">Preview only</span></div>
          {step===1 && <div className="form-grid"><label>Representative full name<input disabled placeholder="As shown on official records"/></label><label>Business email<input disabled placeholder="name@company.com"/></label><label>Contact number<input disabled placeholder="+60"/></label><label>Position / designation<input disabled placeholder="Director / Owner / Authorized representative"/></label></div>}
          {step===2 && <div className="form-grid"><label>Entity type<select disabled defaultValue="company"><option value="company">Sdn Bhd / Berhad</option></select></label><label>Jurisdiction<input disabled value="Malaysia" readOnly /></label><label>Legal registered name<input disabled placeholder="Registered business name"/></label><label>Registration number<input disabled placeholder="SSM registration number"/></label><label className="full">Registered address<input disabled placeholder="Address as per registration records"/></label></div>}
          {step===3 && <div className="document-steps">{["Current SSM company/business profile","Evidence of representative authority (when required)","Registered company details match the official evidence"].map((x,i)=><div className="document-row" key={x}><span className="doc-number">0{i+1}</span><strong>{x}</strong><span className="tag">Required / conditional</span></div>)}<p className="footnote">Actual document upload is intentionally disabled until private storage, access controls and review workflows are connected to a new V2 database.</p></div>}
          {step===4 && <div className="approval-steps">{["Submit complete company application","Check authenticity, duplicates and applicant authority","MARIZ reviewer approves, requests corrections or rejects","Verified company accesses product demo center"].map((x,i)=><div className="approval-row" key={x}><span>{i+1}</span>{x}</div>)}</div>}
          <div className="panel-footer"><span>🔒 No personal information is collected in this preview. <a href="/co/auth" style={{color:"#167761",fontWeight:700}}>Open secure company registration →</a></span><button className="button button-primary" onClick={()=>setStep(step===4?1:step+1)}>{step===4?"Review from start":"Next step"} →</button></div>
        </div>
      </div>
      </main>}

      {section==="demo" && <main className="interior demo-section"><div className="interior-head"><span className="eyebrow">MARIZ POS / PREPARED DEMO</span><h1>Explore MARIZ POS. Free.</h1><p>A ready-made sample store terminal and back office. No payment, no trial clock and no setup. All transactions are simulated.</p></div>
       <div className="demo-controls"><div className="segmented"><button className="on" onClick={() => setDemo("pos")}>MARIZ POS</button></div><div style={{display:"flex",gap:9,flexWrap:"wrap"}}><a className="button button-primary" href="/co/pos/preview">Back Office &amp; terminal setup →</a><button className="button button-outline reset" onClick={resetDemo}>↻ Reset sample data</button></div></div>
       {demo==="pos" && <div className="demo-layout"><aside className="demo-sidebar"><span className="aside-title">MARIZ POS</span><div className="demo-location"><strong>Simply Sample Café</strong><small>Demo Outlet · Terminal 01</small></div><button className={activeTab==="terminal"?"sidebar-active":""} onClick={()=>setActiveTab("terminal")}>▣ &nbsp; POS Terminal</button><button className={activeTab==="backoffice"?"sidebar-active":""} onClick={()=>setActiveTab("backoffice")}>▤ &nbsp; Back Office</button><div className="sandbox-note">SIMULATION MODE<br/><small>No charges. No real receipts or payments.</small></div></aside>
         {activeTab==="terminal"?<div className="demo-main"><div className="demo-title-row"><div><span className="eyebrow">COUNTER SERVICE</span><h2>New order</h2></div><span className="tag green">Terminal online · Demo</span></div><div className="menu-grid">{menu.map(item=><button className="menu-item" key={item.name} onClick={()=>addItem(item.name,item.price)}><span className="menu-icon">{item.group==="Food"?"◫":"◉"}</span><strong>{item.name}</strong><small>{item.group}</small><b>{fmt(item.price)} &nbsp; +</b></button>)}</div>{paid&&<div className="notice">✓ Sample payment completed. This was a simulation only.</div>}</div>:<div className="demo-main"><div className="demo-title-row"><div><span className="eyebrow">OPERATIONS OVERVIEW</span><h2>Back Office</h2></div><span className="tag green">Demo data</span></div><div className="metrics"><div><small>DEMO ORDERS</small><strong>{orders}</strong></div><div><small>DEMO SALES</small><strong>{fmt(revenue)}</strong></div><div><small>MENU PRODUCTS</small><strong>04</strong></div></div><div className="report"><span className="eyebrow">TODAY'S SAMPLE ACTIVITY</span><div className="chart-bars">{[38,66,44,89,70,100,62].map((v,i)=><span key={i} style={{height:String(v)+"%"}}/>)}</div><small>Simulated figures. No reporting data is stored.</small></div></div>}
         <aside className="cart-panel"><div className="cart-heading"><strong>Current order</strong><span>{cart.reduce((n,x)=>n+x.qty,0)} items</span></div><div className="cart-list">{cart.length===0?<div className="cart-empty"><span>▧</span><strong>No items yet</strong><small>Choose an item to experience the terminal.</small></div>:cart.map(item=><div className="cart-row" key={item.name}><div><strong>{item.name}</strong><small>{item.qty} × {fmt(item.price)}</small></div><b>{fmt(item.qty*item.price)}</b></div>)}</div><div className="cart-footer"><div><span>Total</span><strong>{fmt(total)}</strong></div><button className="button button-primary" disabled={!cart.length} onClick={simulatePayment}>Simulate payment →</button></div></aside>
       </div>}
      <div className="demo-legal"><span>● SAFE DEMO ENVIRONMENT</span> All financial activity and reporting shown here are simulated. Live payments and company registrations remain disabled in this build.</div>
      </main>}
      {section === "custom" && <main className="interior custom-section">
        <div className="interior-head"><span className="eyebrow">MARIZ / CUSTOM WEB SOFTWARE</span><h1>Software built around your workflow.</h1><p>For businesses whose operating requirements cannot be met by off-the-shelf software. Each hosted application is scoped, designed and quoted individually. This is a bespoke development service—not a ready-made demo product.</p></div>
        <div className="product-grid">
          <article className="product-card"><span className="product-code">01 / DISCOVERY</span><h3>Understand your operations</h3><p>Map the workflows, teams, approval points and information that the software needs to handle.</p></article>
          <article className="product-card"><span className="product-code">02 / DESIGN</span><h3>Define the application</h3><p>Agree on interfaces, modules, permissions, integration needs and a deliverable scope.</p></article>
          <article className="product-card"><span className="product-code">03 / DELIVERY</span><h3>Develop & deploy</h3><p>Implement, test, host and maintain a dedicated application under agreed commercial terms.</p></article>
        </div>
        <div className="custom-next"><strong>Need a tailored system?</strong><p>Custom engagements require a scoped quotation. This build does not yet accept enquiries or payments.</p><button className="button button-primary" onClick={() => {window.location.href="/co/auth"}}>Company registration / login →</button></div>
      </main>}
      <footer className="footer"><div className="footer-brand"><img className="brand-logo" src="/mariz-luxury-mark.svg" alt="" /><div><strong>MARIZ</strong><small>POS & Custom Web Software</small></div></div><p>Build preview · Architecture V2 · No live registrations or payments</p><button onClick={()=>{setSection("home");window.scrollTo(0,0)}}>Back to top ↑</button></footer>
    </div>
  );
}