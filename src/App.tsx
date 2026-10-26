import { Activity, ArrowDownRight, ArrowUpRight, Check, ChevronDown, CircleHelp, Download, Flame, Footprints, Instagram, MapPin, Plus, Route, Sparkles, Timer, Waves } from "lucide-react";

const templates = [
  { id: "01", name: "The Sunday Long Run", kind: "EDITORIAL", style: "cream", distance: "21.10", time: "2:04:38", pace: "5:54", date: "SUNDAY, OCT 18" },
  { id: "02", name: "After Hours", kind: "DARK MODE", style: "dark", distance: "10.02", time: "48:12", pace: "4:48", date: "THURSDAY, OCT 22" },
  { id: "03", name: "Just Keep Going", kind: "BOLD TYPE", style: "orange", distance: "5.00", time: "26:40", pace: "5:20", date: "TUESDAY, OCT 20" },
];

function Poster({ item }: { item: typeof templates[number] }) {
  return <div className={`poster poster-${item.style}`}>
    <div className="poster-top"><span>RS / STUDIO</span><span>{item.date}</span></div>
    <div className="poster-title">{item.style === "dark" ? <>NIGHT<br/>MILES<span>.</span></> : item.style === "orange" ? <>SHOW UP.<br/>RUN ON<span>.</span></> : <>A LITTLE<br/>FARTHER<span>.</span></>}</div>
    <div className="route-art" aria-label="Decorative running route map"><svg viewBox="0 0 300 110" role="img"><path d="M8 78 C24 82 35 20 66 36 S99 97 127 66 S154 11 183 32 S212 88 241 60 S270 18 292 29" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray="4 5"/><circle cx="8" cy="78" r="4" fill="currentColor"/><circle cx="292" cy="29" r="4" fill="currentColor"/></svg></div>
    <div className="poster-stats"><div><strong>{item.distance}</strong><small>KILOMETRES</small></div><div><strong>{item.time}</strong><small>TIME</small></div><div><strong>{item.pace}</strong><small>MIN / KM</small></div></div>
    <div className="poster-bottom"><span>ONE RUN AT A TIME.</span><span>RUNSTATS STUDIO ↗</span></div>
  </div>
}

export default function App() {
  return <main className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brand-mark"><Footprints size={20}/></span><span>runstats<span className="brand-light">studio</span></span></a>
      <div className="side-label">WORKSPACE</div>
      <a className="nav-item active" href="#templates"><Sparkles size={17}/> Discover templates</a>
      <a className="nav-item" href="#editor"><Activity size={17}/> My poster <span className="nav-soon">SOON</span></a>
      <a className="nav-item" href="#activities"><Route size={17}/> My activities <span className="nav-soon">SOON</span></a>
      <div className="side-bottom"><div className="connect-card"><div className="connect-icon"><Waves size={18}/></div><strong>Your runs, your story.</strong><p>Connect Strava to turn your real activities into something worth keeping.</p><button className="connect-button" disabled>Connect Strava <ArrowUpRight size={15}/></button><small>AVAILABLE IN A LATER STEP</small></div><a className="nav-item muted" href="#help"><CircleHelp size={17}/> Help & feedback</a><div className="profile"><div className="avatar">R</div><div><strong>Runner</strong><small>Free workspace</small></div><ChevronDown size={16}/></div></div>
    </aside>
    <section className="main-content">
      <header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> <b>Discover</b></div><div className="top-actions"><span className="status-dot"/> <span className="saved-label">All changes saved</span><button className="help-button"><CircleHelp size={17}/></button></div></header>
      <div className="content-wrap">
        <div className="eyebrow"><span className="eyebrow-line"/> THE RUNNER'S CREATIVE STUDIO</div>
        <section className="hero"><div><h1>Your miles.<br/><em>Your masterpiece.</em></h1><p>Every run has a story. Give yours a place on the wall — with thoughtful, customisable posters made for runners.</p><a className="primary-button" href="#templates">Explore the templates <ArrowDownRight size={17}/></a></div><div className="hero-note"><div className="note-icon"><Flame size={20}/></div><div><strong>Made for the miles that matter.</strong><span>Long runs. First 5Ks. Ordinary Tuesdays.</span></div></div></section>
        <section className="stats-strip"><div><span className="strip-icon"><Activity size={17}/></span><strong>YOUR DATA</strong><small>Real run stats, coming soon</small></div><div><span className="strip-icon"><MapPin size={17}/></span><strong>YOUR ROUTE</strong><small>Your path, drawn beautifully</small></div><div><span className="strip-icon"><Download size={17}/></span><strong>YOUR POSTER</strong><small>Export-ready designs</small></div></section>
        <section className="template-section" id="templates"><div className="section-heading"><div><div className="eyebrow small"><span className="eyebrow-line"/> THE STARTING LINE</div><h2>Find your format<span>.</span></h2><p>A first collection of poster directions. Pick a style to start imagining your next keepsake.</p></div><button className="filter-button">All templates <ChevronDown size={15}/></button></div>
          <div className="template-grid">{templates.map((item) => <article className="template-card" key={item.id}><div className="poster-frame"><Poster item={item}/><span className="template-number">{item.id} / 03</span></div><div className="template-info"><div><h3>{item.name}</h3><span className="template-kind">{item.kind}</span></div><button className="select-button" aria-label={`Select ${item.name}`} title="Poster editor arrives in Step 3" disabled><Plus size={18}/></button></div></article>)}</div>
        </section>
        <section className="bottom-banner"><div className="banner-symbol"><Footprints size={23}/></div><div><strong>Good things take miles.</strong><p>We're building the tools to make every one of them count.</p></div><span className="banner-tag">BUILT FOR RUNNERS, BY RUNNERS</span></section>
        <footer><span>© 2026 RUNSTATS STUDIO</span><span>MADE FOR THE LOVE OF THE RUN <span className="footer-heart">♥</span></span></footer>
      </div>
    </section>
  </main>;
}