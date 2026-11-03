import { useMemo, useState } from "react";
import type React from "react";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronDown, Code2,
  Globe2, Layers3, Menu, MonitorSmartphone, Palette, Play, Send,
  Sparkles, Video, X, Zap
} from "lucide-react";

type Market = "IN" | "GLOBAL";
type ServiceId = "website" | "video" | "design" | "other";

const services = [
  { id: "website" as const, number: "01", icon: MonitorSmartphone, title: "Websites that work as hard as you do.", short: "Thoughtful, fast and mobile-first websites that turn a first impression into a real opportunity.", tags: ["Business websites", "Landing pages", "WordPress", "Redesigns"], priceIN: "₹7,999", priceGlobal: "$199" },
  { id: "video" as const, number: "02", icon: Video, title: "Video made to hold attention.", short: "Clear, engaging edits for brands and creators who have something worth sharing.", tags: ["Reels & Shorts", "YouTube editing", "Product videos", "Promos"], priceIN: "Custom quote", priceGlobal: "Custom quote" },
  { id: "design" as const, number: "03", icon: Palette, title: "A visual identity people remember.", short: "Consistent design that gives your business a recognisable voice across every touchpoint.", tags: ["Brand identity", "Social creatives", "Presentations", "Marketing assets"], priceIN: "Custom quote", priceGlobal: "Custom quote" }
];

const projects = [
  { category: "WEB DESIGN / CONCEPT", title: "A table worth booking.", type: "Restaurant website concept", tone: "food", label: "Saffron & Stone", description: "A warm digital home for a neighbourhood dining destination." },
  { category: "WEB DESIGN / CONCEPT", title: "Spaces with a point of view.", type: "Interior studio concept", tone: "interior", label: "Forma Studio", description: "A portfolio-led experience for an independent interiors practice." },
  { category: "DIGITAL / CONCEPT", title: "Make room for better work.", type: "SaaS landing page concept", tone: "saas", label: "Northstar", description: "A focused product page built around a clear value proposition." }
];

const packages = {
  IN: [
    { name: "Starter", price: "₹7,999", note: "A clean first step online.", features: ["Up to 3 pages", "Responsive design", "Contact form / enquiry CTA", "Basic on-page SEO", "One revision round"] },
    { name: "Professional", price: "₹14,999", note: "For businesses ready to grow.", features: ["Up to 5 pages", "Custom visual direction", "Enquiry form", "Basic SEO setup", "Two revision rounds"], featured: true },
    { name: "Business", price: "₹24,999", note: "A more complete digital presence.", features: ["Up to 8 pages", "Advanced sections & integrations", "CMS-ready approach", "Analytics setup support", "Two revision rounds"] }
  ],
  GLOBAL: [
    { name: "Starter", price: "$199", note: "A clean first step online.", features: ["Up to 3 pages", "Responsive design", "Contact form / enquiry CTA", "Basic on-page SEO", "One revision round"] },
    { name: "Professional", price: "$349", note: "For businesses ready to grow.", features: ["Up to 5 pages", "Custom visual direction", "Enquiry form", "Basic SEO setup", "Two revision rounds"], featured: true },
    { name: "Business", price: "$599", note: "A more complete digital presence.", features: ["Up to 8 pages", "Advanced sections & integrations", "CMS-ready approach", "Analytics setup support", "Two revision rounds"] }
  ]
};

function App() {
  const [market, setMarket] = useState<Market>(() => {
    try { return localStorage.getItem("setupkaro-market") === "GLOBAL" ? "GLOBAL" : "IN"; } catch { return "IN"; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", business: "", service: "website" as ServiceId, budget: "", details: "" });
  const currency = market === "IN" ? "INR" : "USD";
  const priceList = useMemo(() => packages[market], [market]);

  function changeMarket(value: Market) {
    setMarket(value);
    try { localStorage.setItem("setupkaro-market", value); } catch {}
  }

  function openQuote(service: ServiceId = "website") {
    setForm(current => ({ ...current, service }));
    setSubmitted(false);
    setQuoteOpen(true);
    setMobileOpen(false);
  }

  async function submitEnquiry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = [
      "SETUPKARO PROJECT ENQUIRY",
      `Name: ${form.name}`, `Email: ${form.email}`,
      `Business: ${form.business || "Not provided"}`,
      `Service: ${form.service}`, `Budget: ${form.budget || "Not specified"}`,
      `Market: ${market}`, "", form.details
    ].join("\n");
    const email = import.meta.env.VITE_CONTACT_EMAIL as string | undefined;
    if (email) {
      window.location.href = `mailto:${email}?subject=${encodeURIComponent("New SetupKaro project enquiry")}&body=${encodeURIComponent(text)}`;
      setSubmitted(true);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
  }

  const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined;
  const navItems = [["Services", "#services"], ["Our work", "#work"], ["Process", "#process"], ["About", "#about"]];

  return <div className="site-shell">
    <div className="announcement"><span className="announcement-dot" /> A small, focused team for your next digital project <span className="announcement-link" onClick={() => openQuote()}>Let’s talk <ArrowUpRight size={12}/></span></div>
    <header className="header">
      <a className="brand" href="#top" aria-label="SetupKaro home"><span className="brand-mark">s<span>.</span></span><span className="brand-name">setupkaro<span className="brand-dot">.</span></span></a>
      <nav className={mobileOpen ? "nav nav-open" : "nav"}>
        {navItems.map(([label, href]) => <a key={href} href={href} onClick={() => setMobileOpen(false)}>{label}</a>)}
        <a className="mobile-contact" href="#contact" onClick={() => setMobileOpen(false)}>Contact <ArrowUpRight size={14}/></a>
      </nav>
      <div className="header-actions">
        <label className="market-select"><Globe2 size={14}/><select aria-label="Select market" value={market} onChange={e => changeMarket(e.target.value as Market)}><option value="IN">India · INR</option><option value="GLOBAL">Global · USD</option></select><ChevronDown size={12}/></label>
        <button className="button button-dark header-cta" onClick={() => openQuote()}>Start a project <ArrowUpRight size={14}/></button>
      </div>
      <button className="menu-toggle" aria-label={mobileOpen ? "Close menu" : "Open menu"} onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X/> : <Menu/>}</button>
    </header>

    <main id="top">
      <section className="hero section-wrap">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line"/> DIGITAL SERVICES, MADE SIMPLE <span className="eyebrow-index">01 — 03</span></div>
          <h1>Make your next<br/>digital move <em>count.</em></h1>
          <p className="hero-lede">We help ambitious businesses look sharper, work smarter and show up confidently online — from the first idea to the final launch.</p>
          <div className="hero-buttons"><button className="button button-lime" onClick={() => openQuote()}>Tell us what you need <ArrowUpRight size={16}/></button><a className="text-link" href="#work">Explore our work <ArrowDownRight size={15}/></a></div>
          <div className="hero-note"><span className="note-icon"><Sparkles size={15}/></span><span><strong>One point of contact.</strong> A hand-picked team behind the work.</span></div>
        </div>
        <div className="hero-visual" aria-label="Abstract website design composition">
          <div className="visual-topline"><span>THE DIGITAL WORKSHOP</span><span>EST. FOR WHAT'S NEXT ↗</span></div>
          <div className="visual-window">
            <div className="window-bar"><div className="window-dots"><i/><i/><i/></div><span>your-next-big-thing.com</span><span className="window-menu">•••</span></div>
            <div className="window-content">
              <div className="window-kicker">A BETTER WAY TO SHOW UP</div>
              <div className="window-headline">Built around<br/><em>your business.</em></div>
              <div className="window-line"/>
              <div className="window-bottom"><span>DESIGN / STRATEGY / DIGITAL</span><span className="window-arrow"><ArrowUpRight size={18}/></span></div>
            </div>
          </div>
          <div className="floating-chip chip-one"><span className="chip-icon"><Code2 size={15}/></span><span><b>Web experiences</b><small>Designed with purpose</small></span></div>
          <div className="floating-chip chip-two"><span className="chip-icon chip-icon-lime"><Zap size={15}/></span><span><b>Creative that connects</b><small>Made to move people</small></span></div>
          <div className="visual-stamp">GOOD<br/>IDEAS<br/><em>LIVE</em><span>HERE ↗</span></div>
          <div className="visual-orbit"/>
        </div>
        <div className="hero-bottomline"><span>INDEPENDENT DIGITAL SERVICES STUDIO</span><span>INDIA ↔ WORLDWIDE</span><span>SCROLL TO EXPLORE ↓</span></div>
      </section>

      <section className="intro-strip"><p>Good work starts with <em>a clear conversation.</em></p><span>We bring the right people and skills together to make your project happen.</span></section>

      <section className="services section-wrap" id="services">
        <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> WHAT WE CAN DO</div><h2>Digital essentials.<br/><em>Done thoughtfully.</em></h2></div><p>Start with one thing you need. We’ll help shape the scope, bring in the right specialists and keep the work moving.</p></div>
        <div className="service-grid">
          {services.map(service => { const Icon = service.icon; return <article className="service-card" key={service.id}>
            <div className="service-card-top"><span>{service.number} / SERVICE</span><Icon size={21} strokeWidth={1.5}/></div>
            <h3>{service.title}</h3><p>{service.short}</p>
            <div className="tag-list">{service.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
            <div className="service-card-bottom"><span>FROM <strong>{market === "IN" ? service.priceIN : service.priceGlobal}</strong></span><button aria-label={`Enquire about ${service.title}`} onClick={() => openQuote(service.id)}><ArrowUpRight size={17}/></button></div>
          </article>; })}
        </div>
        <div className="service-footnote"><span>* Final pricing depends on scope, content, integrations and timeline.</span><button className="inline-link" onClick={() => openQuote("other")}>Need something different? Tell us <ArrowUpRight size={13}/></button></div>
      </section>

      <section className="work-section" id="work">
        <div className="section-wrap">
          <div className="section-heading work-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> A FEEL FOR THE WORK</div><h2>Ideas, made <em>visible.</em></h2></div><p>A few illustrative directions to show how we think. These are concept projects, not commissioned client work.</p></div>
          <div className="project-grid">
            {projects.map((project, index) => <article className="project-card" key={project.label}>
              <div className={`project-art project-${project.tone}`}>
                {project.tone === "food" && <><div className="food-photo"/><div className="food-overlay"><span>NEIGHBOURHOOD KITCHEN</span><b>Saffron<br/><i>& Stone.</i></b><small>GOOD FOOD. GOOD COMPANY.</small></div><div className="food-seal">OPEN<br/>TABLE</div></>}
                {project.tone === "interior" && <><div className="interior-photo"/><div className="interior-overlay"><span>FORM / FUNCTION / FEELING</span><b>Spaces<br/>for living.</b><small>INTERIOR ARCHITECTURE</small></div><div className="interior-number">01—24</div></>}
                {project.tone === "saas" && <><div className="saas-orb"/><div className="saas-ui"><span>NORTHSTAR / WORKSPACE</span><div className="saas-ui-title">Find your<br/><em>next direction.</em></div><div className="saas-ui-bar"><i/><i/><i/></div><div className="saas-ui-button">Explore platform ↗</div></div><div className="saas-side">CLARITY IN MOTION</div></>}
                <span className="concept-label">CONCEPT PROJECT 0{index+1}</span>
              </div>
              <div className="project-meta"><div><span>{project.category}</span><h3>{project.title}</h3><p>{project.description}</p></div><ArrowUpRight size={20}/></div>
            </article>)}
          </div>
        </div>
      </section>

      <section className="process-section section-wrap" id="process">
        <div className="process-top"><div><div className="eyebrow"><span className="eyebrow-line"/> A CLEAR WAY FORWARD</div><h2>From “what if?”<br/>to <em>“it’s live.”</em></h2></div><p>No confusing hand-offs or disappearing acts. You have one point of contact, a clear plan and visibility at every step.</p></div>
        <div className="process-grid">
          {[["01","Discover","We listen first. Tell us about your business, goals, audience and the problem you want to solve."],["02","Plan","We define the deliverables, timeline, budget and the people best suited to the work."],["03","Create","Our selected creative and technical partners bring the project to life, with check-ins along the way."],["04","Deliver","We review the details together, make agreed refinements and hand over the finished work."]].map(([n,title,desc]) => <article className="process-step" key={n}><span className="process-number">{n}</span><div className="process-marker"><span/></div><h3>{title}</h3><p>{desc}</p></article>)}
        </div>
      </section>

      <section className="pricing-section" id="pricing"><div className="section-wrap">
        <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> STRAIGHTFORWARD STARTING POINTS</div><h2>Know the shape<br/><em>of the investment.</em></h2></div><p>These website packages are starting points, not one-size-fits-all promises. We’ll confirm the exact scope and quote before work begins.</p></div>
        <div className="pricing-grid">{priceList.map((pack) => <article className={pack.featured ? "price-card price-featured" : "price-card"} key={pack.name}>
          {pack.featured && <span className="popular-tag">A GOOD PLACE TO START</span>}
          <div className="price-name">{pack.name.toUpperCase()} WEBSITE</div><div className="price-amount">{pack.price}<small> / project</small></div><p>{pack.note}</p><div className="price-divider"/>
          <ul>{pack.features.map(feature => <li key={feature}><Check size={14}/>{feature}</li>)}</ul>
          <button className={pack.featured ? "button button-lime" : "button button-outline"} onClick={() => openQuote("website")}>Discuss this package <ArrowUpRight size={14}/></button>
        </article>)}</div>
        <div className="pricing-note"><span>Need e-commerce, booking, multilingual content or a custom integration?</span><button className="inline-link" onClick={() => openQuote("website")}>Get a tailored quote <ArrowUpRight size={13}/></button></div>
      </div></section>

      <section className="about-section section-wrap" id="about">
        <div className="about-art"><div className="about-art-inner"><div className="about-circle circle-a"/><div className="about-circle circle-b"/><span className="about-big-type">SK<span>.</span></span><span className="about-side-note">A SMALL STUDIO<br/>WITH A WIDE REACH</span><div className="about-tag">GOOD PEOPLE.<br/>GOOD WORK.</div></div></div>
        <div className="about-copy"><div className="eyebrow"><span className="eyebrow-line"/> A LITTLE ABOUT US</div><h2>Small by design.<br/><em>Serious about the details.</em></h2><p>SetupKaro makes getting digital work done feel simpler. We bring your brief, the right independent specialists and careful project coordination together — so you can focus on running your business.</p><p>We’re building a flexible network, not pretending to be a giant agency. That means clear expectations, honest conversations and a team shaped around the project.</p><div className="about-values"><span><Layers3 size={16}/> Carefully matched talent</span><span><Globe2 size={16}/> India & international projects</span><span><Check size={16}/> Quality checked before handover</span></div><button className="text-link" onClick={() => openQuote()}>Let’s get to know your project <ArrowUpRight size={15}/></button></div>
      </section>

      <section className="faq-section section-wrap"><div><div className="eyebrow"><span className="eyebrow-line"/> GOOD TO KNOW</div><h2>A few things<br/><em>you might wonder.</em></h2></div><div className="faq-list">
        {[["Who will actually do the work?","SetupKaro manages your project and works with independent specialists selected for the requirements. We remain your main point of contact and coordinate quality and delivery."],["Can you work with businesses outside India?","Yes. We welcome enquiries from India and other markets. Choose your preferred market and currency on this site; the final scope, payment method and timeline are confirmed individually."],["How does pricing work?","Website packages show indicative starting prices. Final pricing depends on page count, content readiness, functionality, integrations and timeline. Video and design projects are quoted after understanding the brief."],["Do I need to pay everything upfront?","Payment milestones are agreed in writing before work begins. The proposal will state the deposit, milestones, revision allowance and delivery terms."],["Can you guarantee a launch date or results?","We agree a realistic timeline after reviewing the brief and dependencies. We don’t promise search rankings, sales or other outcomes that depend on factors outside the project."]].map(([q,a]) => <details key={q}><summary>{q}<span><ChevronDown size={16}/></span></summary><p>{a}</p></details>)}
      </div></section>

      <section className="contact-cta section-wrap" id="contact"><div className="cta-kicker"><span/> YOUR NEXT MOVE STARTS HERE</div><h2>Have a good idea?<br/><em>Let’s give it a home.</em></h2><p>Tell us what you’re working on. We’ll come back with the right questions and a sensible next step.</p><button className="button button-lime cta-button" onClick={() => openQuote()}>Start a conversation <ArrowUpRight size={16}/></button><span className="cta-orbit orbit-one"/><span className="cta-orbit orbit-two"/><span className="cta-star">✳</span></section>
    </main>

    <footer className="footer"><div className="footer-main section-wrap"><div className="footer-brand-col"><a className="brand brand-footer" href="#top"><span className="brand-mark">s<span>.</span></span><span className="brand-name">setupkaro<span className="brand-dot">.</span></span></a><p>Thoughtful digital services for businesses ready for what’s next.</p><span className="footer-location">BASED IN INDIA · WORKING WORLDWIDE</span></div><div className="footer-links"><div><span>EXPLORE</span><a href="#services">Services</a><a href="#work">Our work</a><a href="#process">How we work</a><a href="#about">About</a></div><div><span>GET STARTED</span><a href="#pricing">Website packages</a><button onClick={() => openQuote()}>Start a project</button>{whatsapp && <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp ↗</a>}</div><div><span>MARKET</span><button onClick={() => changeMarket("IN")}>India · INR</button><button onClick={() => changeMarket("GLOBAL")}>Global · USD</button></div></div></div><div className="footer-bottom section-wrap"><span>© {new Date().getFullYear()} SETUPKARO. ALL RIGHTS RESERVED.</span><span>BUILT WITH INTENTION <span className="footer-heart">✳</span></span><a href="#top">BACK TO TOP ↑</a></div></footer>

    {quoteOpen && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setQuoteOpen(false); }}><section className="quote-modal" role="dialog" aria-modal="true" aria-labelledby="quote-title"><button className="modal-x" aria-label="Close" onClick={() => setQuoteOpen(false)}><X size={19}/></button>
      {!submitted ? <><div className="eyebrow"><span className="eyebrow-line"/> LET’S TALK ABOUT YOUR PROJECT</div><h2 id="quote-title">Tell us a little<br/><em>about your idea.</em></h2><p className="modal-intro">A few details help us understand what you need. We’ll use this to shape a useful first conversation.</p>
        <form className="quote-form" onSubmit={submitEnquiry}><div className="form-row"><label>Your name<input required value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Jane Smith"/></label><label>Email address<input required type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="you@business.com"/></label></div><div className="form-row"><label>Business name <span>(optional)</span><input value={form.business} onChange={e => setForm({...form,business:e.target.value})} placeholder="Your business"/></label><label>What do you need?<select value={form.service} onChange={e => setForm({...form,service:e.target.value as ServiceId})}><option value="website">Website development</option><option value="video">Video editing</option><option value="design">Graphic design & branding</option><option value="other">Something else</option></select></label></div><label>Approximate budget <span>(optional)</span><select value={form.budget} onChange={e => setForm({...form,budget:e.target.value})}><option value="">Not sure yet</option>{(market === "IN" ? ["Under ₹10,000","₹10,000–₹25,000","₹25,000–₹50,000","₹50,000+"] : ["Under $250","$250–$500","$500–$1,000","$1,000+"]).map(v => <option key={v}>{v}</option>)}</select></label><label>Tell us about the project<textarea required minLength={15} rows={4} value={form.details} onChange={e => setForm({...form,details:e.target.value})} placeholder="What are you hoping to create? What would success look like?"/></label><button className="button button-dark form-submit" type="submit">Prepare my enquiry <Send size={15}/></button><small className="form-privacy">Your details are used only to respond to this enquiry. No mailing list or spam.</small></form>
      </> : <div className="form-success"><div className="success-check"><Check size={23}/></div><div className="eyebrow">THANK YOU FOR REACHING OUT</div><h2 id="quote-title">Your next step<br/><em>is ready.</em></h2><p>{import.meta.env.VITE_CONTACT_EMAIL ? "Your email app should open with the enquiry prepared. Send it to complete your request." : "Your enquiry details have been copied if clipboard access was available. The website form is not connected to an enquiry inbox yet, so please contact SetupKaro directly once the business email is configured."}</p><button className="button button-dark" onClick={() => setQuoteOpen(false)}>Back to the website <ArrowRight size={15}/></button></div>}
    </section></div>}
    {whatsapp && <a className="whatsapp-float" href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Hi SetupKaro, I'd like to discuss a project.")}`} target="_blank" rel="noreferrer" aria-label="Chat with SetupKaro on WhatsApp">↗</a>}
  </div>;
}

export default App;
