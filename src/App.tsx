import { useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Check, ChevronDown, CircleHelp, Download, Flame, Footprints, MapPin, Plus, Route, Sparkles, Waves, X } from "lucide-react";

const templates = [
  { id: "01", name: "The Sunday Long Run", kind: "EDITORIAL", style: "cream", distance: "21.10", time: "2:04:38", pace: "5:54", date: "SUNDAY, OCT 18" },
  { id: "02", name: "After Hours", kind: "DARK MODE", style: "dark", distance: "10.02", time: "48:12", pace: "4:48", date: "THURSDAY, OCT 22" },
  { id: "03", name: "Just Keep Going", kind: "BOLD TYPE", style: "orange", distance: "5.00", time: "26:40", pace: "5:20", date: "TUESDAY, OCT 20" },
];

type Template = typeof templates[number];

function Poster({ item }: { item: Template }) {
  return <div className={`poster poster-${item.style}`}>
    <div className="poster-top"><span>RS / STUDIO</span><span>{item.date}</span></div>
    <div className="poster-title">{item.style === "dark" ? <>NIGHT<br/>MILES<span>.</span></> : item.style === "orange" ? <>SHOW UP.<br/>RUN ON<span>.</span></> : <>A LITTLE<br/>FARTHER<span>.</span></>}</div>
    <div className="route-art" aria-label="Decorative running route map"><svg viewBox="0 0 300 110" role="img"><path d="M8 78 C24 82 35 20 66 36 S99 97 127 66 S154 11 183 32 S212 88 241 60 S270 18 292 29" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray="4 5"/><circle cx="8" cy="78" r="4" fill="currentColor"/><circle cx="292" cy="29" r="4" fill="currentColor"/></svg></div>
    <div className="poster-stats"><div><strong>{item.distance}</strong><small>KILOMETRES</small></div><div><strong>{item.time}</strong><small>TIME</small></div><div><strong>{item.pace}</strong><small>MIN / KM</small></div></div>
    <div className="poster-bottom"><span>ONE RUN AT A TIME.</span><span>RUNSTATS STUDIO ↗</span></div>
  </div>;
}

export default function App() {
  const [filter, setFilter] = useState("ALL");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<Template | null>(null);
  const [notice, setNotice] = useState("");
  const visibleTemplates = useMemo(
    () => filter === "ALL" ? templates : templates.filter((item) => item.kind === filter),
    [filter]
  );

  const chooseTemplate = (item: Template) => {
    setSelected(item);
    setNotice("");
  };

  return <main className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brand-mark"><Footprints size={20}/></span><span>runstats<span className="brand-light">studio</span></span></a>
      <div className="side-label">WORKSPACE</div>
      <a className="nav-item active" href="#templates"><Sparkles size={17}/> Discover templates</a>
      <a className="nav-item" href="#editor" onClick={(event) => { event.preventDefault(); setNotice("The poster editor is the next feature we're building."); }}><Activity size={17}/> My poster <span className="nav-soon">NEXT</span></a>
      <a className="nav-item" href="#activities" onClick={(event) => { event.preventDefault(); setNotice("Activity import will be available after Strava connection is built."); }}><Route size={17}/> My activities <span className="nav-soon">SOON</span></a>
      <div className="side-bottom"><div className="connect-card"><div className="connect-icon"><Waves size={18}/></div><strong>Your runs, your story.</strong><p>Connect Strava to turn your real activities into something worth keeping.</p><button className="connect-button" onClick={() => setNotice("Strava connection is planned for a later step.")}>Connect Strava <ArrowUpRight size={15}/></button><small>COMING IN A LATER STEP</small></div><a className="nav-item muted" href="#help" onClick={(event) => { event.preventDefault(); setNotice("Help and feedback will be added as the app grows."); }}><CircleHelp size={17}/> Help & feedback</a><div className="profile"><div className="avatar">R</div><div><strong>Runner</strong><small>Free workspace</small></div><ChevronDown size={16}/></div></div>
    </aside>
    <section className="main-content">
      <header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> <b>Discover</b></div><div className="top-actions"><span className="status-dot"/> <span className="saved-label">Template gallery ready</span><button className="help-button" aria-label="Help" onClick={() => setNotice("Choose a template to preview it. Filtering is available above the gallery.")}><CircleHelp size={17}/></button></div></header>
      <div className="content-wrap">
        <div className="eyebrow"><span className="eyebrow-line"/> THE RUNNER'S CREATIVE STUDIO</div>
        <section className="hero"><div><h1>Your miles.<br/><em>Your masterpiece.</em></h1><p>Every run has a story. Give yours a place on the wall — with thoughtful, customisable posters made for runners.</p><a className="primary-button" href="#templates">Explore the templates <ArrowDownRight size={17}/></a></div><div className="hero-note"><div className="note-icon"><Flame size={20}/></div><div><strong>Made for the miles that matter.</strong><span>Long runs. First 5Ks. Ordinary Tuesdays.</span></div></div></section>
        <section className="stats-strip"><div><span className="strip-icon"><Activity size={17}/></span><strong>YOUR DATA</strong><small>Real run stats, coming soon</small></div><div><span className="strip-icon"><MapPin size={17}/></span><strong>YOUR ROUTE</strong><small>Your path, drawn beautifully</small></div><div><span className="strip-icon"><Download size={17}/></span><strong>YOUR POSTER</strong><small>Export-ready designs</small></div></section>
        <section className="template-section" id="templates"><div className="section-heading"><div><div className="eyebrow small"><span className="eyebrow-line"/> THE STARTING LINE</div><h2>Find your format<span>.</span></h2><p>Browse the first collection, filter by visual style, and preview a design before choosing it.</p></div><div className="filter-wrap"><button className="filter-button" aria-expanded={filterOpen} onClick={() => setFilterOpen((open) => !open)}>{filter === "ALL" ? "All templates" : templates.find((item) => item.kind === filter)?.kind}<ChevronDown size={15}/></button>{filterOpen && <div className="filter-menu">{[["ALL", "All templates"], ["EDITORIAL", "Editorial"], ["DARK MODE", "Dark mode"], ["BOLD TYPE", "Bold type"]].map(([value, label]) => <button key={value} className={filter === value ? "filter-option selected" : "filter-option"} onClick={() => { setFilter(value); setFilterOpen(false); }}><span>{label}</span>{filter === value && <Check size={14}/>}</button>)}</div>}</div></div>
          <div className="template-grid">{visibleTemplates.map((item) => <article className="template-card" key={item.id}><button className="poster-pick" onClick={() => chooseTemplate(item)} aria-label={`Preview ${item.name}`}><div className="poster-frame"><Poster item={item}/><span className="template-number">{item.id} / 03</span><span className="poster-hover-label">PREVIEW TEMPLATE ↗</span></div></button><div className="template-info"><div><h3>{item.name}</h3><span className="template-kind">{item.kind}</span></div><button className="select-button" aria-label={`Preview ${item.name}`} title="Preview template" onClick={() => chooseTemplate(item)}><Plus size={18}/></button></div></article>)}</div>
          {visibleTemplates.length === 0 && <p className="empty-state">No templates in this category yet.</p>}
        </section>
        <section className="bottom-banner"><div className="banner-symbol"><Footprints size={23}/></div><div><strong>Good things take miles.</strong><p>Choose a look today. We'll add real run data and editing tools next.</p></div><span className="banner-tag">BUILT FOR RUNNERS, BY RUNNERS</span></section>
        <footer><span>© 2026 RUNSTATS STUDIO</span><span>MADE FOR THE LOVE OF THE RUN <span className="footer-heart">♥</span></span></footer>
      </div>
    </section>
    {notice && <div className="toast" role="status"><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice("")}><X size={15}/></button></div>}
    {selected && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section className="template-modal" role="dialog" aria-modal="true" aria-labelledby="preview-title"><button className="modal-close" aria-label="Close preview" onClick={() => setSelected(null)}><X size={18}/></button><div className="modal-poster"><Poster item={selected}/></div><div className="modal-details"><div className="eyebrow small"><span className="eyebrow-line"/> TEMPLATE PREVIEW</div><h2 id="preview-title">{selected.name}</h2><p className="modal-kind">{selected.kind}</p><p>This is a sample preview with demonstration running stats. Once the editor is ready, you'll be able to replace these with your own activity data and customise the design.</p><div className="modal-sample-stats"><div><strong>{selected.distance} km</strong><span>DISTANCE</span></div><div><strong>{selected.time}</strong><span>TIME</span></div><div><strong>{selected.pace} /km</strong><span>AVERAGE PACE</span></div></div><button className="primary-button modal-action" onClick={() => { setNotice(`${selected.name} selected. The editable poster workspace is the next build step.`); setSelected(null); }}>Choose this style <ArrowDownRight size={17}/></button><small className="modal-note">Sample data only · Not connected to Strava yet</small></div></section></div>}
  </main>;
}
