import { useMemo, useRef, useState } from "react";
import type React from "react";
import { Activity, ArrowDownRight, Check, ChevronDown, CircleHelp, Download, Flame, Footprints, MapPin, Plus, Route, Sparkles, X, Pencil, RotateCcw } from "lucide-react";

const templates = [
  { id: "01", layout: "editorial", name: "The Sunday Long Run", kind: "EDITORIAL", style: "cream", distance: "21.10", time: "2:04:38", pace: "5:54", date: "SUNDAY, OCT 18", headline: "A LITTLE\nFARTHER." },
  { id: "02", layout: "night-grid", name: "After Hours", kind: "DARK MODE", style: "dark", distance: "10.02", time: "48:12", pace: "4:48", date: "THURSDAY, OCT 22", headline: "NIGHT\nMILES." },
  { id: "03", layout: "type-poster", name: "Just Keep Going", kind: "BOLD TYPE", style: "orange", distance: "5.00", time: "26:40", pace: "5:20", date: "TUESDAY, OCT 20", headline: "SHOW UP.\nRUN ON." },
  { id: "04", layout: "sunrise", name: "First Light", kind: "MINIMAL", style: "cream", distance: "8.24", time: "42:18", pace: "5:08", date: "MONDAY, OCT 19", headline: "MEET ME\nAT DAWN." },
  { id: "05", layout: "photo-frame", name: "Midnight Club", kind: "DARK MODE", style: "dark", distance: "12.00", time: "1:02:44", pace: "5:14", date: "FRIDAY, OCT 16", headline: "CITY\nSLEEPING." },
  { id: "06", layout: "personal-best", name: "Personal Best", kind: "BOLD TYPE", style: "orange", distance: "5.00", time: "24:58", pace: "4:59", date: "SATURDAY, OCT 17", headline: "NEW\nPERSONAL BEST." },
  { id: "07", layout: "quiet", name: "Quiet Miles", kind: "MINIMAL", style: "cream", distance: "6.50", time: "35:20", pace: "5:26", date: "WEDNESDAY, OCT 21", headline: "JUST ME\nAND THE ROAD." },
  { id: "08", layout: "track", name: "Track Session", kind: "BOLD TYPE", style: "orange", distance: "7.20", time: "34:12", pace: "4:45", date: "TUESDAY, OCT 13", headline: "ONE MORE\nREPEAT." },
  { id: "09", layout: "route-map", name: "The Long Way Home", kind: "EDITORIAL", style: "cream", distance: "18.60", time: "1:48:30", pace: "5:50", date: "SUNDAY, OCT 11", headline: "TAKE THE\nLONG WAY." },
  { id: "10", layout: "minimal-stats", name: "No Days Wasted", kind: "DARK MODE", style: "dark", distance: "4.80", time: "25:40", pace: "5:21", date: "THURSDAY, OCT 15", headline: "SMALL STEPS.\nBIG DAYS." },
  { id: "11", layout: "magazine", name: "Weekend Ritual", kind: "EDITORIAL", style: "cream", distance: "10.00", time: "51:06", pace: "5:06", date: "SATURDAY, OCT 10", headline: "SAME TIME.\nSAME JOY." },
  { id: "12", layout: "split", name: "Run Your Run", kind: "BOLD TYPE", style: "orange", distance: "3.00", time: "16:20", pace: "5:26", date: "SUNDAY, OCT 25", headline: "YOUR PACE.\nYOUR PLACE." },
];
type Template = typeof templates[number];
type Design = { headline: string; distance: string; time: string; pace: string; date: string; footer: string; style: string; backgroundImage: string; customText: string; routePolyline?: string; activityOverlay?: string };

const palettes: Record<string, { bg: string; ink: string; accent: string }> = {
  cream: { bg: "#f9f5e9", ink: "#262720", accent: "#ed633b" },
  dark: { bg: "#242824", ink: "#f0efe7", accent: "#e3c66c" },
  orange: { bg: "#ee653d", ink: "#2a2a24", accent: "#f9f5e9" },
};

function decodeRoute(encoded: string) {
  const points: Array<[number, number]> = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let result = 0, shift = 0, byte = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 31) << shift; shift += 5; } while (byte >= 32 && index < encoded.length);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0; shift = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 31) << shift; shift += 5; } while (byte >= 32 && index < encoded.length);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

function Poster({ item, design, editable = false, onEdit }: { item: Template; design?: Design; editable?: boolean; onEdit?: (key: keyof Design, value: string) => void }) {
  const style = design?.style ?? item.style;
  const headline = design?.headline ?? item.headline;
  const palette = palettes[style] ?? palettes.cream;
  const editProps = (key: keyof Design) => editable ? {
    contentEditable: true as const, suppressContentEditableWarning: true, spellCheck: false,
    onBlur: (event: React.FocusEvent<HTMLElement>) => onEdit?.(key, event.currentTarget.innerText.replace(/\r/g, "")),
    onClick: (event: React.MouseEvent<HTMLElement>) => event.stopPropagation(),
    className: "canvas-editable", title: "Click and type to edit",
  } : {};
  const title = <div className="poster-title" style={{ whiteSpace: "pre-line" }} {...editProps("headline")}>{headline}</div>;
  const custom = design?.customText ? <div className="poster-custom-text" {...editProps("customText")}>{design.customText}</div> : null;
  const stats = <div className="poster-stats"><div><strong {...editProps("distance")}>{design?.distance ?? item.distance}</strong><small>KILOMETRES</small></div><div><strong {...editProps("time")}>{design?.time ?? item.time}</strong><small>TIME</small></div><div><strong {...editProps("pace")}>{design?.pace ?? item.pace}</strong><small>MIN / KM</small></div></div>;
  const top = <div className="poster-top"><span>RS / STUDIO</span><span {...editProps("date")}>{design?.date ?? item.date}</span></div>;
  const footer = <div className="poster-bottom"><span {...editProps("footer")}>{design?.footer ?? "ONE RUN AT A TIME."}</span><span>RUNSTATS STUDIO ↗</span></div>;
  const photoSources: Record<string, {src:string; alt:string}> = {
    editorial: {src:"https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=85",alt:"Runner training on a road"},
    "night-grid": {src:"https://images.unsplash.com/photo-1776935889501-68e5607fa42a?auto=format&fit=crop&w=900&q=85",alt:"Runner on a track at night"},
    "type-poster": {src:"https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=900&q=85",alt:"Runner in motion"},
    sunrise: {src:"https://images.unsplash.com/photo-1502904550040-7534597429ae?auto=format&fit=crop&w=900&q=85",alt:"Outdoor landscape at sunrise"},
    "photo-frame": {src:"https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=900&q=85",alt:"Athlete training"},
    "personal-best": {src:"https://images.unsplash.com/photo-1533561052604-c3beb6d55b8d?auto=format&fit=crop&w=900&q=85",alt:"Runner on a track"},
    quiet: {src:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85",alt:"Quiet outdoor landscape"},
    track: {src:"https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=85",alt:"Runner training"},
    "route-map": {src:"https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=85",alt:"Forest trail"},
    "minimal-stats": {src:"https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=85",alt:"Athlete running"},
    magazine: {src:"https://images.unsplash.com/photo-1502904550040-7534597429ae?auto=format&fit=crop&w=900&q=85",alt:"Mountain landscape"},
    split: {src:"https://images.unsplash.com/photo-1533561052604-c3beb6d55b8d?auto=format&fit=crop&w=900&q=85",alt:"Runner outdoors"},
  };
  const photo = photoSources[item.layout];
  const photoLayer = photo ? <img className="poster-photo-layer" src={photo.src} alt={photo.alt} crossOrigin="anonymous" /> : null;
  const gpsPoints = design?.routePolyline ? decodeRoute(design.routePolyline) : [];
  const gpsPath = gpsPoints.length > 1 ? (() => {
    const lats = gpsPoints.map((p) => p[0]), lngs = gpsPoints.map((p) => p[1]);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    return gpsPoints.map((p, i) => (i ? "L " : "M ") + (8 + (p[1] - minLng) / (maxLng - minLng || 1) * 284) + " " + (102 - (p[0] - minLat) / (maxLat - minLat || 1) * 94)).join(" ");
  })() : "";
  const gpsPathTall = gpsPoints.length > 1 ? (() => {
    const lats=gpsPoints.map((p)=>p[0]),lngs=gpsPoints.map((p)=>p[1]);
    const minLat=Math.min(...lats),maxLat=Math.max(...lats),minLng=Math.min(...lngs),maxLng=Math.max(...lngs);
    return gpsPoints.map((p,i)=>(i?"L ":"M ")+(8+(p[1]-minLng)/(maxLng-minLng||1)*284)+" "+(232-(p[0]-minLat)/(maxLat-minLat||1)*224)).join(" ");
  })() : "";
  const route = <div className="route-art" aria-label={gpsPath ? "Imported GPS route" : "Decorative running route map"}><svg viewBox="0 0 300 110" role="img">{gpsPath ? <path d={gpsPath} fill="none" stroke="#ed633b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/> : <path d="M8 78 C24 82 35 20 66 36 S99 97 127 66 S154 11 183 32 S212 88 241 60 S270 18 292 29" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray="4 5"/>}</svg></div>;
  const layouts: Record<string, React.ReactNode> = {
    editorial: <>{top}<div className="poster-edition">FIELD NOTES / RUN LOG NO. 018</div>{title}{custom}<div className="poster-editorial-rule"/><div className="poster-route-caption">THE DISTANCE IS THE STORY <span>↘</span></div>{route}{stats}{footer}</>,
    "night-grid": <><div className="poster-night-orbit"><span>AFTER</span><b>HOURS</b><i>RUN CLUB / EST. 05:30</i></div>{top}{title}<div className="poster-night-wave">{route}<span>01 — KEEP MOVING</span></div>{stats}{footer}</>,
    "type-poster": <><div className="poster-type-index">RUN / REPEAT / RECOVER</div>{title}<div className="poster-type-stamp">NO EXCUSES<br/>JUST MILES.</div>{custom}{stats}{footer}</>,
    sunrise: <><div className="poster-sun-disc"/><div className="poster-sun-horizon"/>{top}{title}<div className="poster-sun-subtitle">THE WORLD IS QUIET. SO ARE YOUR DOUBTS.</div>{route}{custom}{stats}{footer}</>,
    "photo-frame": <><div className="poster-photo-window"><div className="poster-photo-sky"/><div className="poster-photo-moon"/><div className="poster-photo-city"><i/><i/><i/><i/><i/><i/><i/></div><div className="poster-photo-road"/></div>{top}<div className="poster-photo-title">{title}<span>RUN AFTER DARK / VOL. 01</span></div>{custom}{stats}{footer}</>,
    "personal-best": <><div className="poster-pb-kicker">THE WORK PAID OFF</div>{top}{title}<div className="poster-pb-medal"><span>PB</span><b {...editProps("time")}>{design?.time ?? item.time}</b><small>NEW PERSONAL BEST</small></div>{custom}{stats}{footer}</>,
    quiet: <><div className="poster-quiet-mark">○</div>{top}<div className="poster-quiet-title">{title}<span>somewhere between breath and belief.</span></div>{custom}{route}{stats}{footer}</>,
    track: <><div className="poster-track-header"><span>SESSION 08</span><span>400M REPEATS</span></div>{title}<div className="poster-track-lanes"><i/><i/><i/><i/><b>PACE YOURSELF</b></div>{custom}{stats}{footer}</>,
    "route-map": <>{top}<div className="poster-map-heading">{title}<span>GPS TRACE / OUT & BACK</span></div><div className="poster-map-visual">{gpsPathTall ? <svg viewBox="0 0 300 240" role="img"><path d={gpsPathTall} fill="none" stroke="#ed633b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></svg> : <svg viewBox="0 0 300 240" role="img"><path d="M18 190 L42 160 L36 130 L82 116 L96 78 L137 91 L154 46 L185 62 L202 104 L238 111 L258 76 L284 88 L266 132 L231 150 L220 191 L175 202 L149 170 L103 190 L72 174 L42 205 Z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M18 190 C48 174 43 134 82 116 S106 91 137 91 S139 48 185 62 S211 121 258 76" fill="none" stroke="#ed633b" strokeWidth="5" strokeLinecap="round"/><circle cx="18" cy="190" r="6" fill="#ed633b"/><circle cx="258" cy="76" r="6" fill="#ed633b"/></svg>}<span>START ●</span><span>FINISH ↗</span></div>{custom}{stats}{footer}</>,
    "minimal-stats": <><div className="poster-minimal-label">TODAY, WELL SPENT.</div>{top}{title}{custom}<div className="poster-minimal-hero-number">{design?.distance ?? item.distance}<small>KM COMPLETED</small></div><div className="poster-minimal-secondary">{stats}</div>{footer}</>,
    magazine: <><div className="poster-magazine-masthead">PACE <span>THE RUN JOURNAL</span><b>№ 026</b></div>{title}<div className="poster-magazine-photo"><div className="poster-magazine-sun"/><div className="poster-magazine-hill"/><div className="poster-magazine-runner">↗</div><span>THE WEEKEND ISSUE</span></div>{custom}{stats}{footer}</>,
    split: <><div className="poster-split-copy">{top}{title}<div className="poster-split-vertical">RUN YOUR OWN RACE — SINCE ALWAYS</div>{custom}{footer}</div><div className="poster-split-data"><span>YOUR SESSION</span>{stats}<div className="poster-split-mark">RS<span>®</span></div></div></>,
  };
  return <div className={"poster poster-" + style + " poster-layout-" + item.layout + (editable ? " poster-edit-mode" : "") + (design?.activityOverlay ? " has-activity-overlay" : "")} style={{ backgroundColor: palette.bg, color: palette.ink, backgroundImage: design?.backgroundImage ? 'linear-gradient(#00000022,#00000022), url("' + design.backgroundImage + '")' : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
    {photoLayer}{design?.activityOverlay && <img className="poster-activity-overlay" src={design.activityOverlay} alt="Uploaded transparent activity graphic" />}{layouts[item.layout] ?? <>{top}{title}{custom}{route}{stats}{footer}</>}
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
  if (design.activityOverlay) {
    const overlay = new Image();
    overlay.src = design.activityOverlay;
    await new Promise<void>((resolve) => { overlay.onload = () => resolve(); overlay.onerror = () => resolve(); });
    if (overlay.naturalWidth > 0 && overlay.naturalHeight > 0) {
      const maxW = 860, maxH = 820;
      const scale = Math.min(maxW / overlay.naturalWidth, maxH / overlay.naturalHeight);
      const w = overlay.naturalWidth * scale, h = overlay.naturalHeight * scale;
      ctx.drawImage(overlay, (canvas.width - w) / 2, 235 + (maxH - h) / 2, w, h);
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
  if (design.customText.trim()) {
    ctx.fillStyle = palette.ink;
    ctx.font = "bold 34px Arial, sans-serif";
    ctx.fillText(design.customText.slice(0, 45), 72, 650, 930);
  }
  ctx.strokeStyle = design.routePolyline ? "#ed633b" : palette.ink;
  ctx.lineWidth = 5;
  if (design.routePolyline) {
    const points = decodeRoute(design.routePolyline);
    if (points.length > 1) {
      const lats = points.map((p) => p[0]), lngs = points.map((p) => p[1]);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
      ctx.beginPath();
      points.forEach((p, i) => {
        const x = 80 + (p[1] - minLng) / (maxLng - minLng || 1) * 920;
        const y = 900 - (p[0] - minLat) / (maxLat - minLat || 1) * 190;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
    }
  } else if (!design.activityOverlay) {
    ctx.setLineDash([10, 14]);
    ctx.beginPath();
    ctx.moveTo(80, 770);
    ctx.bezierCurveTo(180, 850, 210, 650, 330, 740);
    ctx.bezierCurveTo(450, 850, 510, 620, 650, 720);
    ctx.bezierCurveTo(780, 820, 850, 660, 1000, 710);
    ctx.stroke();
    ctx.setLineDash([]);
  }
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
  const activityImageInputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState("");
  const [uploadedOverlay, setUploadedOverlay] = useState("");
  const visibleTemplates = useMemo(() => filter === "ALL" ? templates : templates.filter((item) => item.kind === filter), [filter]);

  const openEditor = (item: Template) => {
    setSelected(item);
    setDesign({headline:item.headline,distance:item.distance,time:item.time,pace:item.pace,date:item.date,footer:"ONE RUN AT A TIME.",style:item.style,backgroundImage:"",customText:"",routePolyline:"",activityOverlay:uploadedOverlay});
    setNotice("");
  };
  const closeEditor = () => { setSelected(null); setDesign(null); };
  const ensureEditor = (overlay:string) => {
    const item=templates.find((t)=>t.layout==="route-map")??templates[0];
    setSelected(item);
    setDesign((current)=>current?{...current,activityOverlay:overlay}:{headline:item.headline,distance:item.distance,time:item.time,pace:item.pace,date:item.date,footer:"ONE RUN AT A TIME.",style:item.style,backgroundImage:"",customText:"",routePolyline:"",activityOverlay:overlay});
  };
  const handleActivityImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file=event.target.files?.[0]; if(!file)return;
    if(!["image/png","image/webp"].includes(file.type)){setNotice("Use a transparent PNG or WebP image. JPEG images do not support transparency.");event.target.value="";return;}
    if(file.size>10*1024*1024){setNotice("Choose an image smaller than 10 MB.");event.target.value="";return;}
    const reader=new FileReader();
    reader.onload=()=>{const image=String(reader.result??"");setUploadedOverlay(image);ensureEditor(image);setNotice("Activity image added. Its route and stats will be kept together as one transparent layer on your poster.");};
    reader.onerror=()=>setNotice("Could not read that image. Try another file.");
    reader.readAsDataURL(file);
  };
  const updateDesign = (key: keyof Design, value: string) => setDesign((current) => current ? { ...current, [key]: value } : current);

  return <main className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brand-mark"><Footprints size={20}/></span><span>runstats<span className="brand-light">studio</span></span></a>
      <div className="side-label">WORKSPACE</div>
      <a className="nav-item active" href="#templates"><Sparkles size={17}/> Discover templates</a>
      <a className="nav-item" href="#editor" onClick={(event) => { event.preventDefault(); if (selected) setNotice("You're already in the poster editor."); else setNotice("Choose a template to open the poster editor."); }}><Pencil size={17}/> Poster editor <span className="nav-soon">BETA</span></a>
      <a className="nav-item" href="#activities" onClick={(event) => { event.preventDefault(); document.getElementById("activities")?.scrollIntoView({behavior:"smooth"}); }}><Route size={17}/> Import activity</a>
      <div className="side-bottom"><div className="connect-card"><div className="connect-icon"><Route size={18}/></div><strong>Your run, your story.</strong><p>Upload one transparent activity image that already includes the route and stats. No account needed.</p><button className="connect-button" onClick={() => document.getElementById("activities")?.scrollIntoView({behavior:"smooth"})}>Import activity <ArrowDownRight size={15}/></button><small>NO LOGIN REQUIRED</small></div><a className="nav-item muted" href="#help" onClick={(event) => { event.preventDefault(); setNotice("Help and feedback will be added as the app grows."); }}><CircleHelp size={17}/> Help & feedback</a><div className="profile"><div className="avatar">R</div><div><strong>Runner</strong><small>Free workspace</small></div><ChevronDown size={16}/></div></div>
    </aside>
    <section className="main-content">
      <header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> <b>Discover</b></div><div className="top-actions"><span className="status-dot"/> <span className="saved-label">Template gallery ready</span><button className="help-button" aria-label="Help" onClick={() => setNotice("Choose a template to edit it. Changes appear in the live preview.")}><CircleHelp size={17}/></button></div></header>
      <div className="content-wrap">
        <div className="eyebrow"><span className="eyebrow-line"/> THE RUNNER'S CREATIVE STUDIO</div>
        <section className="hero"><div><h1>Your miles.<br/><em>Your masterpiece.</em></h1><p>Every run has a story. Give yours a place on the wall — with thoughtful, customisable posters made for runners.</p><a className="primary-button" href="#templates">Explore the templates <ArrowDownRight size={17}/></a></div><div className="hero-note"><div className="note-icon"><Flame size={20}/></div><div><strong>Made for the miles that matter.</strong><span>Long runs. First 5Ks. Ordinary Tuesdays.</span></div></div></section>
        <section className="stats-strip"><div><span className="strip-icon"><Activity size={17}/></span><strong>YOUR DATA</strong><small>Import your own activity</small></div><div><span className="strip-icon"><MapPin size={17}/></span><strong>YOUR ROUTE</strong><small>Route included in your image</small></div><div><span className="strip-icon"><Download size={17}/></span><strong>YOUR POSTER</strong><small>Export-ready designs</small></div></section>
        <section className="activity-import" id="activities"><div className="eyebrow small"><span className="eyebrow-line"/> ACTIVITY IMAGE / NO ACCOUNT REQUIRED</div><h2>Bring your run into the studio<span>.</span></h2><p className="activity-import-copy">Upload one transparent PNG or WebP that already includes your activity stats and route graphic. The whole graphic is placed on your poster—no separate route upload and no account connection.</p><div className="activity-upload-grid activity-upload-grid-single"><div className="activity-upload-card"><div className="activity-upload-icon"><Download size={20}/></div><strong>Upload your transparent activity image</strong><p>Choose the transparent activity image that includes the route and running stats. It will be layered over the selected poster design.</p><input ref={activityImageInputRef} id="activity-image-input" type="file" accept="image/png,image/webp" className="image-file-input" onChange={handleActivityImage}/><button className="primary-button" onClick={() => activityImageInputRef.current?.click()}><Plus size={15}/>{uploadedOverlay ? "Replace activity image" : "Upload transparent PNG / WebP"}</button>{uploadedOverlay && <button className="text-button" onClick={() => { setUploadedOverlay(""); setDesign((current) => current ? { ...current, activityOverlay: "" } : current); setNotice("Activity image removed."); }}>Remove image</button>}<small className="activity-file-hint">{uploadedOverlay ? "Image loaded into the editor. Open preview and export when ready." : "PNG/WebP · Maximum 10 MB · Transparency recommended"}</small></div></div><div className="activity-import-note"><strong>How this works:</strong> the route and stats are preserved visually from the image itself. An image does not contain the original GPS coordinates, so this single-upload mode does not recalculate GPS metrics; you can edit poster text and stats in the editor.</div></section><section className="template-section" id="templates"><div className="section-heading"><div><div className="eyebrow small"><span className="eyebrow-line"/> THE STARTING LINE</div><h2>Find your format<span>.</span></h2><p>Choose a design to customise your headline, stats, colors, and export a PNG.</p></div><div className="filter-wrap"><button className="filter-button" aria-expanded={filterOpen} onClick={() => setFilterOpen((open) => !open)}>{filter === "ALL" ? "All templates" : templates.find((item) => item.kind === filter)?.kind}<ChevronDown size={15}/></button>{filterOpen && <div className="filter-menu">{[["ALL", "All templates"], ["EDITORIAL", "Editorial"], ["DARK MODE", "Dark mode"], ["BOLD TYPE", "Bold type"], ["MINIMAL", "Minimal"]].map(([value, label]) => <button key={value} className={filter === value ? "filter-option selected" : "filter-option"} onClick={() => { setFilter(value); setFilterOpen(false); }}><span>{label}</span>{filter === value && <Check size={14}/>}</button>)}</div>}</div></div>
          <div className="template-grid">{visibleTemplates.map((item) => <article className="template-card" key={item.id}><button className="poster-pick" onClick={() => openEditor(item)} aria-label={`Edit ${item.name}`}><div className="poster-frame"><Poster item={item}/><span className="template-number">{item.id} / {String(templates.length).padStart(2, "0")}</span><span className="poster-hover-label">CUSTOMISE POSTER ↗</span></div></button><div className="template-info"><div><h3>{item.name}</h3><span className="template-kind">{item.kind}</span></div><button className="select-button" aria-label={`Edit ${item.name}`} title="Customize template" onClick={() => openEditor(item)}><Plus size={18}/></button></div></article>)}</div>
        </section>
        <section className="bottom-banner"><div className="banner-symbol"><Footprints size={23}/></div><div><strong>Good things take miles.</strong><p>Upload one transparent activity image containing your route and stats, then customise and export your poster.</p></div><span className="banner-tag">BUILT FOR RUNNERS, BY RUNNERS</span></section>
        <footer><span>© 2026 RUNSTATS STUDIO</span><span>MADE FOR THE LOVE OF THE RUN <span className="footer-heart">♥</span></span></footer>
      </div>
    </section>
    {notice && <div className="toast" role="status"><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice("")}><X size={15}/></button></div>}
    {selected && design && <div className="modal-backdrop editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor(); }}><section className="template-modal editor-modal" role="dialog" aria-modal="true" aria-labelledby="editor-title"><button className="modal-close" aria-label="Close editor" onClick={closeEditor}><X size={18}/></button><div className="editor-preview"><div className="eyebrow small"><span className="eyebrow-line"/> LIVE PREVIEW</div><div className="modal-poster canvas-poster"><Poster item={selected} design={design} editable onEdit={updateDesign}/></div><p className="preview-caption">Click any text to edit it directly · Your uploaded route graphic stays together as one image layer</p></div><div className="modal-details editor-controls"><div className="eyebrow small"><span className="eyebrow-line"/> POSTER WORKSPACE</div><h2 id="editor-title">Make it yours<span>.</span></h2><p className="editor-intro">Customise your poster using imported activity data or enter the stats manually.</p><label className="field-label" htmlFor="poster-headline">Headline <span>Use a new line for line breaks</span></label><textarea id="poster-headline" rows={2} maxLength={48} value={design.headline} onChange={(event) => updateDesign("headline", event.target.value)} /><div className="editor-fields"><label><span className="field-label">Distance (km)</span><input value={design.distance} maxLength={8} onChange={(event) => updateDesign("distance", event.target.value)} /></label><label><span className="field-label">Time</span><input value={design.time} maxLength={12} onChange={(event) => updateDesign("time", event.target.value)} /></label><label><span className="field-label">Pace (min/km)</span><input value={design.pace} maxLength={8} onChange={(event) => updateDesign("pace", event.target.value)} /></label></div><label className="field-label" htmlFor="poster-date">Date label</label><input id="poster-date" value={design.date} maxLength={28} onChange={(event) => updateDesign("date", event.target.value.toUpperCase())}/><label className="field-label" htmlFor="poster-footer">Footer message</label><input id="poster-footer" value={design.footer} maxLength={36} onChange={(event) => updateDesign("footer", event.target.value.toUpperCase())}/><div className="field-label">Extra text layer <span>Optional</span></div>
          <input aria-label="Additional poster text" placeholder="Add a short line to your poster…" value={design.customText} maxLength={45} onChange={(event) => updateDesign("customText", event.target.value)} />
          <div className="field-label">Background image</div>
          <div className="background-tools">
            <input ref={backgroundInputRef} className="image-file-input" type="file" accept="image/*" aria-label="Upload poster background image" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 8 * 1024 * 1024) { setNotice("Choose an image smaller than 8 MB."); event.target.value = ""; return; } const reader = new FileReader(); reader.onload = () => updateDesign("backgroundImage", String(reader.result ?? "")); reader.readAsDataURL(file); }} />
            <button type="button" className="secondary-button" onClick={() => backgroundInputRef.current?.click()}><Plus size={14}/>{design.backgroundImage ? "Replace image" : "Upload image"}</button>
            {design.backgroundImage && <button type="button" className="text-button" onClick={() => { updateDesign("backgroundImage", ""); if (backgroundInputRef.current) backgroundInputRef.current.value = ""; }}>Remove image</button>}
          </div>
          <div className="field-label">Color style</div><div className="palette-options">{Object.entries(palettes).map(([key, palette]) => <button type="button" key={key} className={design.style === key ? "palette-swatch active" : "palette-swatch"} onClick={() => updateDesign("style", key)} aria-label={`${key} color style`} aria-pressed={design.style === key}><span style={{ background: palette.bg, color: palette.ink, borderColor: palette.accent }}>Aa</span><small>{key === "cream" ? "Editorial" : key === "dark" ? "Dark" : "Orange"}</small>{design.style === key && <Check size={13}/>}</button>)}</div><div className="editor-actions"><button className="secondary-button" onClick={() => openEditor(selected)}><RotateCcw size={15}/> Reset</button><button className="primary-button export-button" onClick={() => { downloadPoster(selected, design); setNotice("PNG export started. Check your browser downloads."); }}><Download size={16}/> Export PNG</button></div><small className="modal-note">PNG export is generated in your browser. No data is uploaded.</small></div></section></div>}
  </main>;
}
