import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Check, ChevronDown, CircleHelp, Download, Flame, Footprints, MapPin, Plus, Route, Sparkles, Waves, X, Pencil, RotateCcw } from "lucide-react";

const templates = [
  { id: "01", name: "The Sunday Long Run", kind: "EDITORIAL", style: "cream", distance: "21.10", time: "2:04:38", pace: "5:54", date: "SUNDAY, OCT 18", headline: "A LITTLE\nFARTHER." },
  { id: "02", name: "After Hours", kind: "DARK MODE", style: "dark", distance: "10.02", time: "48:12", pace: "4:48", date: "THURSDAY, OCT 22", headline: "NIGHT\nMILES." },
  { id: "03", name: "Just Keep Going", kind: "BOLD TYPE", style: "orange", distance: "5.00", time: "26:40", pace: "5:20", date: "TUESDAY, OCT 20", headline: "SHOW UP.\nRUN ON." },
  { id: "04", name: "First Light", kind: "MINIMAL", style: "cream", distance: "8.24", time: "42:18", pace: "5:08", date: "MONDAY, OCT 19", headline: "MEET ME\nAT DAWN." },
  { id: "05", name: "Midnight Club", kind: "DARK MODE", style: "dark", distance: "12.00", time: "1:02:44", pace: "5:14", date: "FRIDAY, OCT 16", headline: "CITY\nSLEEPING." },
  { id: "06", name: "Personal Best", kind: "BOLD TYPE", style: "orange", distance: "5.00", time: "24:58", pace: "4:59", date: "SATURDAY, OCT 17", headline: "NEW\nPERSONAL BEST." },
  { id: "07", name: "Quiet Miles", kind: "MINIMAL", style: "cream", distance: "6.50", time: "35:20", pace: "5:26", date: "WEDNESDAY, OCT 21", headline: "JUST ME\nAND THE ROAD." },
  { id: "08", name: "Track Session", kind: "BOLD TYPE", style: "orange", distance: "7.20", time: "34:12", pace: "4:45", date: "TUESDAY, OCT 13", headline: "ONE MORE\nREPEAT." },
  { id: "09", name: "The Long Way Home", kind: "EDITORIAL", style: "cream", distance: "18.60", time: "1:48:30", pace: "5:50", date: "SUNDAY, OCT 11", headline: "TAKE THE\nLONG WAY." },
  { id: "10", name: "No Days Wasted", kind: "DARK MODE", style: "dark", distance: "4.80", time: "25:40", pace: "5:21", date: "THURSDAY, OCT 15", headline: "SMALL STEPS.\nBIG DAYS." },
  { id: "11", name: "Weekend Ritual", kind: "EDITORIAL", style: "cream", distance: "10.00", time: "51:06", pace: "5:06", date: "SATURDAY, OCT 10", headline: "SAME TIME.\nSAME JOY." },
  { id: "12", name: "Run Your Run", kind: "BOLD TYPE", style: "orange", distance: "3.00", time: "16:20", pace: "5:26", date: "SUNDAY, OCT 25", headline: "YOUR PACE.\nYOUR PLACE." },
];
type Template = typeof templates[number];
type Design = { headline: string; distance: string; time: string; pace: string; date: string; footer: string; style: string; backgroundImage: string };
type Athlete = { id: number; firstname: string | null; lastname: string | null; profile: string | null };

const palettes: Record<string, { bg: string; ink: string; accent: string }> = {
  cream: { bg: "#f9f5e9", ink: "#262720", accent: "#ed633b" },
  dark: { bg: "#242824", ink: "#f0efe7", accent: "#e3c66c" },
  orange: { bg: "#ee653d", ink: "#2a2a24", accent: "#f9f5e9" },
};

function Poster({ item, design, editable = false, onEdit }: { item: Template; design?: Design; editable?: boolean; onEdit?: (key: keyof Design, value: string) => void }) {
  const style = design?.style ?? item.style;
  const headline = design?.headline ?? item.headline;
  const palette = palettes[style] ?? palettes.cream;
  const editProps = (key: keyof Design) => editable ? {
    contentEditable: true as const,
    suppressContentEditableWarning: true,
    spellCheck: false,
    onBlur: (event: React.FocusEvent<HTMLElement>) => onEdit?.(key, event.currentTarget.innerText.replace(/\r/g, "")),
    onClick: (event: React.MouseEvent<HTMLElement>) => event.stopPropagation(),
    className: "canvas-editable",
    title: "Click and type to edit",
  } : {};
  return <div className={`poster poster-${style} ${editable ? "poster-edit-mode" : ""}`} style={{ backgroundColor: palette.bg, color: palette.ink, backgroundImage: design?.backgroundImage ? `linear-gradient(#00000022,#00000022), url("${design.backgroundImage}")` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
    <div className="poster-top"><span>RS / STUDIO</span><span {...editProps("date")}>{design?.date ?? item.date}</span></div>
    <div className="poster-title" style={{ whiteSpace: "pre-line" }} {...editProps("headline")}>{headline}</div>
    <div className="route-art" aria-label="Decorative running route map"><svg viewBox="0 0 300 110" role="img"><path d="M8 78 C24 82 35 20 66 36 S99 97 127 66 S154 11 183 32 S212 88 241 60 S270 18 292 29" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray="4 5"/><circle cx="8" cy="78" r="4" fill="currentColor"/><circle cx="292" cy="29" r="4" fill="currentColor"/></svg></div>
    <div className="poster-stats"><div><strong {...editProps("distance")}>{design?.distance ?? item.distance}</strong><small>KILOMETRES</small></div><div><strong {...editProps("time")}>{design?.time ?? item.time}</strong><small>TIME</small></div><div><strong {...editProps("pace")}>{design?.pace ?? item.pace}</strong><small>MIN / KM</small></div></div>
    <div className="poster-bottom"><span {...editProps("footer")}>{design?.footer ?? "ONE RUN AT A TIME."}</span><span>RUNSTATS STUDIO ↗</span></div>
  </div>;
}
async function downloadPoster(item: Template, design: Design) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1480;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const palette = palettes[design.style] ?? palettes.cream;
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (design.backgroundImage) {
    const background = new Image();
    background.src = design.backgroundImage;
    await new Promise<void>((resolve) => {
      background.onload = () => resolve();
      background.onerror = () => resolve();
    });
    if (background.naturalWidth > 0 && background.naturalHeight > 0) {
      const scale = Math.max(canvas.width / background.naturalWidth, canvas.height / background.naturalHeight);
      const width = background.naturalWidth * scale;
      const height = background.naturalHeight * scale;
      ctx.drawImage(background, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      ctx.fillStyle = "#00000022";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
  ctx.fillStyle = palette.ink;
  ctx.font = "500 24px monospace";
  ctx.fillText("RS / STUDIO", 72, 80);
  ctx.textAlign = "right";
  ctx.fillText(design.date.slice(0, 24), 1008, 80);
  ctx.textAlign = "left";
  const lines = design.headline.split("\n").slice(0, 3);
  ctx.font = "bold 106px Arial, sans-serif";
  lines.forEach((line, i) => {
    ctx.fillStyle = line.endsWith(".") ? palette.accent : palette.ink;
    ctx.fillText(line.slice(0, 16), 72, 400 + i * 112, 930);
  });
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = 5;
  ctx.setLineDash([10, 14]);
  ctx.beginPath();
  ctx.moveTo(80, 770);
  ctx.bezierCurveTo(180, 850, 210, 650, 330, 740);
  ctx.bezierCurveTo(450, 850, 510, 620, 650, 720);
  ctx.bezierCurveTo(780, 820, 850, 660, 1000, 710);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(72, 1030); ctx.lineTo(1008, 1030);
  ctx.moveTo(72, 1195); ctx.lineTo(1008, 1195);
  ctx.stroke();
  const statX = [72, 410, 720];
  const statVals = [design.distance, design.time, design.pace];
  const statLabels = ["KILOMETRES", "TIME", "MIN / KM"];
  statVals.forEach((value, i) => {
    ctx.fillStyle = palette.ink;
    ctx.font = "42px monospace";
    ctx.fillText(value, statX[i], 1100);
    ctx.font = "18px monospace";
    ctx.fillText(statLabels[i], statX[i], 1145);
  });
  ctx.font = "20px monospace";
  ctx.fillText(design.footer.slice(0, 36), 72, 1260);
  ctx.textAlign = "right";
  ctx.fillText("RUNSTATS STUDIO", 1008, 1260);
  const link = document.createElement("a");
  link.download = `runstats-${item.id}-poster.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export default function App() {
  const [filter, setFilter] = useState("ALL");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<Template | null>(null);
  const [design, setDesign] = useState<Design | null>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState("");
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const visibleTemplates = useMemo(() => filter === "ALL" ? templates : templates.filter((item) => item.kind === filter), [filter]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((response) => response.ok ? response.json() : { connected: false })
      .then((data: { connected?: boolean; athlete?: Athlete }) => { if (active && data.connected && data.athlete) setAthlete(data.athlete); })
      .catch(() => undefined)
      .finally(() => { if (active) setAuthChecked(true); });
    const params = new URLSearchParams(window.location.search);
    if (params.get("strava") === "connected") setNotice("Strava connected successfully. Your activity import is ready for the next step.");
    if (params.get("strava") === "cancelled") setNotice("Strava connection was cancelled.");
    if (params.has("strava")) { params.delete("strava"); const query = params.toString(); window.history.replaceState({}, "", window.location.pathname + (query ? "?" + query : "") + window.location.hash); }
    return () => { active = false; };
  }, []);

  const connectStrava = () => { window.location.assign("/api/auth/strava/start"); };
  const disconnectStrava = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }); }
    finally { setAthlete(null); setNotice("Strava disconnected from this workspace."); }
  };

  const openEditor = (item: Template) => {
    setSelected(item);
    setDesign({ headline: item.headline, distance: item.distance, time: item.time, pace: item.pace, date: item.date, footer: "ONE RUN AT A TIME.", style: item.style, backgroundImage: "" });
    setNotice("");
  };
  const closeEditor = () => { setSelected(null); setDesign(null); };
  const updateDesign = (key: keyof Design, value: string) => setDesign((current) => current ? { ...current, [key]: value } : current);

  return <main className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brand-mark"><Footprints size={20}/></span><span>runstats<span className="brand-light">studio</span></span></a>
      <div className="side-label">WORKSPACE</div>
      <a className="nav-item active" href="#templates"><Sparkles size={17}/> Discover templates</a>
      <a className="nav-item" href="#editor" onClick={(event) => { event.preventDefault(); if (selected) setNotice("You're already in the poster editor."); else setNotice("Choose a template to open the poster editor."); }}><Pencil size={17}/> Poster editor <span className="nav-soon">BETA</span></a>
      <a className="nav-item" href="#activities" onClick={(event) => { event.preventDefault(); setNotice("Activity import will be available after Strava connection is built."); }}><Route size={17}/> My activities <span className="nav-soon">SOON</span></a>
      <div className="side-bottom"><div className="connect-card"><div className="connect-icon"><Waves size={18}/></div><strong>{athlete ? `Connected: ${athlete.firstname ?? "Strava"} ${athlete.lastname ?? ""}`.trim() : "Your runs, your story."}</strong><p>{athlete ? "Your Strava account is connected. Activity browsing is the next interface step." : "Connect Strava to turn your real activities into something worth keeping."}</p>{athlete ? <button className="connect-button connected-button" onClick={disconnectStrava}>Disconnect Strava <X size={14}/></button> : <button className="connect-button" onClick={connectStrava}>Connect Strava <ArrowUpRight size={15}/></button>}<small>{athlete ? "ACCOUNT CONNECTED" : authChecked ? "SECURE STRAVA OAUTH" : "CHECKING CONNECTION…"}</small></div><a className="nav-item muted" href="#help" onClick={(event) => { event.preventDefault(); setNotice("Help and feedback will be added as the app grows."); }}><CircleHelp size={17}/> Help & feedback</a><div className="profile"><div className="avatar">R</div><div><strong>{athlete ? `${athlete.firstname ?? "Strava"} ${athlete.lastname ?? ""}`.trim() : "Runner"}</strong><small>{athlete ? "Strava connected" : "Free workspace"}</small></div><ChevronDown size={16}/></div></div>
    </aside>
    <section className="main-content">
      <header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> <b>Discover</b></div><div className="top-actions"><span className="status-dot"/> <span className="saved-label">Template gallery ready</span><button className="help-button" aria-label="Help" onClick={() => setNotice("Choose a template to edit it. Changes appear in the live preview.")}><CircleHelp size={17}/></button></div></header>
      <div className="content-wrap">
        <div className="eyebrow"><span className="eyebrow-line"/> THE RUNNER'S CREATIVE STUDIO</div>
        <section className="hero"><div><h1>Your miles.<br/><em>Your masterpiece.</em></h1><p>Every run has a story. Give yours a place on the wall — with thoughtful, customisable posters made for runners.</p><a className="primary-button" href="#templates">Explore the templates <ArrowDownRight size={17}/></a></div><div className="hero-note"><div className="note-icon"><Flame size={20}/></div><div><strong>Made for the miles that matter.</strong><span>Long runs. First 5Ks. Ordinary Tuesdays.</span></div></div></section>
        <section className="stats-strip"><div><span className="strip-icon"><Activity size={17}/></span><strong>YOUR DATA</strong><small>Real run stats, coming soon</small></div><div><span className="strip-icon"><MapPin size={17}/></span><strong>YOUR ROUTE</strong><small>Your path, drawn beautifully</small></div><div><span className="strip-icon"><Download size={17}/></span><strong>YOUR POSTER</strong><small>Export-ready designs</small></div></section>
        <section className="template-section" id="templates"><div className="section-heading"><div><div className="eyebrow small"><span className="eyebrow-line"/> THE STARTING LINE</div><h2>Find your format<span>.</span></h2><p>Choose a design to customise your headline, stats, colors, and export a PNG.</p></div><div className="filter-wrap"><button className="filter-button" aria-expanded={filterOpen} onClick={() => setFilterOpen((open) => !open)}>{filter === "ALL" ? "All templates" : templates.find((item) => item.kind === filter)?.kind}<ChevronDown size={15}/></button>{filterOpen && <div className="filter-menu">{[["ALL", "All templates"], ["EDITORIAL", "Editorial"], ["DARK MODE", "Dark mode"], ["BOLD TYPE", "Bold type"], ["MINIMAL", "Minimal"]].map(([value, label]) => <button key={value} className={filter === value ? "filter-option selected" : "filter-option"} onClick={() => { setFilter(value); setFilterOpen(false); }}><span>{label}</span>{filter === value && <Check size={14}/>}</button>)}</div>}</div></div>
          <div className="template-grid">{visibleTemplates.map((item) => <article className="template-card" key={item.id}><button className="poster-pick" onClick={() => openEditor(item)} aria-label={`Edit ${item.name}`}><div className="poster-frame"><Poster item={item}/><span className="template-number">{item.id} / {String(templates.length).padStart(2, "0")}</span><span className="poster-hover-label">CUSTOMISE POSTER ↗</span></div></button><div className="template-info"><div><h3>{item.name}</h3><span className="template-kind">{item.kind}</span></div><button className="select-button" aria-label={`Edit ${item.name}`} title="Customize template" onClick={() => openEditor(item)}><Plus size={18}/></button></div></article>)}</div>
        </section>
        <section className="bottom-banner"><div className="banner-symbol"><Footprints size={23}/></div><div><strong>Good things take miles.</strong><p>Personalise a poster with sample stats and export a PNG. Strava sync comes later.</p></div><span className="banner-tag">BUILT FOR RUNNERS, BY RUNNERS</span></section>
        <footer><span>© 2026 RUNSTATS STUDIO</span><span>MADE FOR THE LOVE OF THE RUN <span className="footer-heart">♥</span></span></footer>
      </div>
    </section>
    {notice && <div className="toast" role="status"><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice("")}><X size={15}/></button></div>}
    {selected && design && <div className="modal-backdrop editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor(); }}><section className="template-modal editor-modal" role="dialog" aria-modal="true" aria-labelledby="editor-title"><button className="modal-close" aria-label="Close editor" onClick={closeEditor}><X size={18}/></button><div className="editor-preview"><div className="eyebrow small"><span className="eyebrow-line"/> LIVE PREVIEW</div><div className="modal-poster canvas-poster"><Poster item={selected} design={design} editable onEdit={updateDesign}/></div><p className="preview-caption">Click any text on the poster to edit it directly · Sample stats only</p></div><div className="modal-details editor-controls"><div className="eyebrow small"><span className="eyebrow-line"/> POSTER WORKSPACE</div><h2 id="editor-title">Make it yours<span>.</span></h2><p className="editor-intro">Customise this design. Real Strava data will be connected in a later step.</p><label className="field-label" htmlFor="poster-headline">Headline <span>Use a new line for line breaks</span></label><textarea id="poster-headline" rows={2} maxLength={48} value={design.headline} onChange={(event) => updateDesign("headline", event.target.value)} /><div className="editor-fields"><label><span className="field-label">Distance (km)</span><input value={design.distance} maxLength={8} onChange={(event) => updateDesign("distance", event.target.value)} /></label><label><span className="field-label">Time</span><input value={design.time} maxLength={12} onChange={(event) => updateDesign("time", event.target.value)} /></label><label><span className="field-label">Pace (min/km)</span><input value={design.pace} maxLength={8} onChange={(event) => updateDesign("pace", event.target.value)} /></label></div><label className="field-label" htmlFor="poster-date">Date label</label><input id="poster-date" value={design.date} maxLength={28} onChange={(event) => updateDesign("date", event.target.value.toUpperCase())}/><label className="field-label" htmlFor="poster-footer">Footer message</label><input id="poster-footer" value={design.footer} maxLength={36} onChange={(event) => updateDesign("footer", event.target.value.toUpperCase())}/><div className="field-label">Background image</div>
          <div className="background-tools">
            <input ref={backgroundInputRef} className="image-file-input" type="file" accept="image/*" aria-label="Upload poster background image" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 8 * 1024 * 1024) { setNotice("Choose an image smaller than 8 MB."); event.target.value = ""; return; } const reader = new FileReader(); reader.onload = () => updateDesign("backgroundImage", String(reader.result ?? "")); reader.readAsDataURL(file); }} />
            <button type="button" className="secondary-button" onClick={() => backgroundInputRef.current?.click()}><Plus size={14}/>{design.backgroundImage ? "Replace image" : "Upload image"}</button>
            {design.backgroundImage && <button type="button" className="text-button" onClick={() => { updateDesign("backgroundImage", ""); if (backgroundInputRef.current) backgroundInputRef.current.value = ""; }}>Remove image</button>}
          </div>
          <div className="field-label">Color style</div><div className="palette-options">{Object.entries(palettes).map(([key, palette]) => <button type="button" key={key} className={design.style === key ? "palette-swatch active" : "palette-swatch"} onClick={() => updateDesign("style", key)} aria-label={`${key} color style`} aria-pressed={design.style === key}><span style={{ background: palette.bg, color: palette.ink, borderColor: palette.accent }}>Aa</span><small>{key === "cream" ? "Editorial" : key === "dark" ? "Dark" : "Orange"}</small>{design.style === key && <Check size={13}/>}</button>)}</div><div className="editor-actions"><button className="secondary-button" onClick={() => openEditor(selected)}><RotateCcw size={15}/> Reset</button><button className="primary-button export-button" onClick={() => { downloadPoster(selected, design); setNotice("PNG export started. Check your browser downloads."); }}><Download size={16}/> Export PNG</button></div><small className="modal-note">PNG export is generated in your browser. No data is uploaded.</small></div></section></div>}
  </main>;
}
