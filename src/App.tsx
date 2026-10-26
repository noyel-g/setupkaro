import { useEffect, useMemo, useState } from "react";
import {
  Archive, ArrowDown, ArrowLeft, ArrowRight, CalendarDays, Check, CheckCheck,
  ChevronDown, ChevronLeft, ChevronRight, Circle, Clock3, Download, FileText,
  Filter, Folder, Hash, Inbox, ListTodo, Menu, MoreHorizontal, Plus, Search,
  Settings2, SlidersHorizontal, Sparkles, Tag, Trash2, X, BookOpen, PenLine,
  Pin, Sun, Calendar, PanelLeftClose
} from "lucide-react";

type EntryKind = "Note" | "Reading" | "Exercise" | "Idea" | "Work" | "Personal" | "Investing";
type Entry = {
  id: string;
  title: string;
  body: string;
  date: string;
  time: string;
  kind: EntryKind;
  tags: string[];
  pinned: boolean;
  createdAt: number;
};
type Task = {
  id: string;
  text: string;
  done: boolean;
  due: string;
  createdAt: number;
};
type View = "today" | "timeline" | "tasks" | "categories" | "settings";
const STORAGE_KEY = "daymark-journal-v1";
const kinds: EntryKind[] = ["Note", "Reading", "Exercise", "Idea", "Work", "Personal", "Investing"];
const kindColors: Record<EntryKind, string> = {
  Note: "stone", Reading: "plum", Exercise: "green", Idea: "amber",
  Work: "blue", Personal: "rose", Investing: "teal"
};
const dateKey = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const prettyDate = (value: string, options: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric", year: "numeric" }) =>
  new Date(value + "T12:00:00").toLocaleDateString("en-US", options);
const timeNow = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const makeId = () => Math.random().toString(36).slice(2, 10);

const starterEntries: Entry[] = [
  { id: "sample-1", title: "A slower kind of morning", body: "Woke up before the noise of the day. Made coffee, opened the window, and let the room fill with light.\n\nA reminder that a good day doesn't always need a big beginning. Sometimes it just needs a little space.", date: dateKey(), time: "08:12 AM", kind: "Personal", tags: ["reflection", "morning"], pinned: true, createdAt: Date.now() - 1000 * 60 * 60 * 4 },
  { id: "sample-2", title: "The book on the table", body: "Read 18 pages before checking my phone.\n\n**Keep:** write one sentence about what stays with me after reading, not just what happened in the chapter.", date: dateKey(), time: "10:35 AM", kind: "Reading", tags: ["books"], pinned: false, createdAt: Date.now() - 1000 * 60 * 60 * 2 },
  { id: "sample-3", title: "Run notes", body: "Easy run. Kept the effort relaxed and paid attention to breathing instead of pace. The first kilometre felt stiff; the rest came together.", date: dateKey(new Date(Date.now() - 86400000)), time: "Yesterday", kind: "Exercise", tags: ["running", "health"], pinned: false, createdAt: Date.now() - 1000 * 60 * 60 * 24 },
  { id: "sample-4", title: "A tiny app idea", body: "A tool should make capturing something feel easier than forgetting it. Maybe notes could be grouped by what they are, rather than forcing everything into folders.", date: dateKey(new Date(Date.now() - 86400000)), time: "Yesterday", kind: "Idea", tags: ["product", "design"], pinned: false, createdAt: Date.now() - 1000 * 60 * 60 * 27 }
];
const starterTasks: Task[] = [
  { id: "task-1", text: "Read for 20 minutes", done: false, due: dateKey(), createdAt: Date.now() - 3000 },
  { id: "task-2", text: "Write down today's run", done: true, due: dateKey(), createdAt: Date.now() - 6000 },
  { id: "task-3", text: "Review Java notes", done: false, due: dateKey(new Date(Date.now() + 86400000)), createdAt: Date.now() - 9000 }
];

function loadData(): { entries: Entry[]; tasks: Task[]; hasData: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return { entries: data.entries ?? [], tasks: data.tasks ?? [], hasData: true };
    }
  } catch { /* recover with an empty journal if browser storage is unavailable */ }
  return { entries: starterEntries, tasks: starterTasks, hasData: false };
}

function downloadText(filename: string, content: string, mime = "text/markdown;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click();
  URL.revokeObjectURL(url);
}
function toMarkdown(entry: Entry) {
  return `## ${entry.title || "Untitled"}\n\n> ${entry.time} · ${entry.kind}\n\n${entry.body}\n\n${entry.tags.map(t => `#${t}`).join(" ")}\n`;
}
function renderBody(body: string) {
  return body.split("\n").map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return <br key={index} />;
    if (trimmed.startsWith("> ")) return <blockquote key={index}>{trimmed.slice(2)}</blockquote>;
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) return <div className="body-list-line" key={index}><span>—</span>{trimmed.slice(2)}</div>;
    const parts = trimmed.split(/(\*\*.*?\*\*)/g);
    return <p key={index}>{parts.map((part, i) => part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part)}</p>;
  });
}

export default function App() {
  const initial = useMemo(loadData, []);
  const [entries, setEntries] = useState<Entry[]>(initial.entries);
  const [tasks, setTasks] = useState<Task[]>(initial.tasks);
  const [view, setView] = useState<View>("today");
  const [selectedDate, setSelectedDate] = useState(dateKey());
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<EntryKind | "All">("All");
  const [activeEntry, setActiveEntry] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftKind, setDraftKind] = useState<EntryKind>("Note");
  const [draftTags, setDraftTags] = useState("");
  const [draftDate, setDraftDate] = useState(dateKey());
  const [taskInput, setTaskInput] = useState("");
  const [taskDate, setTaskDate] = useState(dateKey());
  const [showSearch, setShowSearch] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showStarterHint, setShowStarterHint] = useState(!initial.hasData);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries, tasks })); } catch { setNotice("Browser storage is full. Export a backup to keep your notes safe."); }
  }, [entries, tasks]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const today = dateKey();
  const todaysEntries = useMemo(() => entries.filter(entry => entry.date === selectedDate).sort((a,b) => b.createdAt-a.createdAt), [entries, selectedDate]);
  const filteredEntries = useMemo(() => entries
    .filter(entry => kindFilter === "All" || entry.kind === kindFilter)
    .filter(entry => !search.trim() || (entry.title + " " + entry.body + " " + entry.tags.join(" ") + " " + entry.kind).toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => b.date.localeCompare(a.date) || b.createdAt-a.createdAt), [entries, kindFilter, search]);
  const active = entries.find(entry => entry.id === activeEntry) ?? null;
  const allTags = [...new Set(entries.flatMap(entry => entry.tags))].sort();
  const pendingTasks = tasks.filter(task => !task.done);
  const doneTasks = tasks.filter(task => task.done);
  const datedTasks = tasks.filter(task => task.due === selectedDate);
  const streak = useMemo(() => {
    const days = new Set(entries.map(entry => entry.date));
    let count = 0;
    const d = new Date();
    if (!days.has(dateKey(d))) d.setDate(d.getDate() - 1);
    while (days.has(dateKey(d))) { count++; d.setDate(d.getDate() - 1); }
    return count;
  }, [entries]);

  function openNew(date = selectedDate, kind: EntryKind = "Note") {
    setActiveEntry(null); setDraftTitle(""); setDraftBody(""); setDraftKind(kind); setDraftTags(""); setDraftDate(date); setEditorOpen(true);
  }
  function openEdit(entry: Entry) {
    setActiveEntry(entry.id); setDraftTitle(entry.title); setDraftBody(entry.body); setDraftKind(entry.kind); setDraftTags(entry.tags.join(", ")); setDraftDate(entry.date); setEditorOpen(true);
  }
  function saveEntry() {
    if (!draftTitle.trim() && !draftBody.trim()) { setNotice("Add a thought before saving."); return; }
    const existing = entries.find(entry => entry.id === activeEntry);
    const entry: Entry = {
      id: existing?.id ?? makeId(), title: draftTitle.trim() || "Untitled moment", body: draftBody.trim(),
      date: draftDate || today, time: existing?.time ?? timeNow(), kind: draftKind,
      tags: [...new Set(draftTags.split(",").map(tag => tag.trim().replace(/^#/, "")).filter(Boolean))],
      pinned: existing?.pinned ?? false, createdAt: existing?.createdAt ?? Date.now()
    };
    setEntries(previous => existing ? previous.map(item => item.id === entry.id ? entry : item) : [entry, ...previous]);
    setSelectedDate(entry.date); setView("today"); setEditorOpen(false); setActiveEntry(entry.id);
    setNotice(existing ? "Moment updated" : "Moment saved to your journal");
  }
  function deleteEntry(entry: Entry) {
    if (!window.confirm(`Delete “${entry.title}”? This cannot be undone.`)) return;
    setEntries(previous => previous.filter(item => item.id !== entry.id));
    if (activeEntry === entry.id) setActiveEntry(null);
    setEditorOpen(false); setNotice("Moment deleted");
  }
  function togglePin(entry: Entry) {
    setEntries(previous => previous.map(item => item.id === entry.id ? { ...item, pinned: !item.pinned } : item));
  }
  function addTask() {
    if (!taskInput.trim()) return;
    setTasks(previous => [{ id: makeId(), text: taskInput.trim(), done: false, due: taskDate, createdAt: Date.now() }, ...previous]);
    setTaskInput(""); setNotice("Task added");
  }
  function toggleTask(id: string) {
    setTasks(previous => previous.map(task => task.id === id ? { ...task, done: !task.done } : task));
  }
  function deleteTask(id: string) {
    setTasks(previous => previous.filter(task => task.id !== id));
  }
  function exportBackup() {
    const markdown = entries.slice().sort((a,b) => a.date.localeCompare(b.date)).map(entry => `# ${prettyDate(entry.date)}\n\n${toMarkdown(entry)}`).join("\n---\n\n");
    downloadText(`daymark-backup-${today}.md`, markdown);
    downloadText(`daymark-data-${today}.json`, JSON.stringify({ entries, tasks, exportedAt: new Date().toISOString() }, null, 2), "application/json");
    setNotice("Markdown and JSON backups downloaded");
  }
  async function importBackup(file?: File) {
    if (!file) return;
    try {
      const text = await file.text();
      if (file.name.endsWith(".json")) {
        const data = JSON.parse(text);
        if (!Array.isArray(data.entries)) throw new Error("This file does not look like a Daymark backup.");
        setEntries(previous => [...data.entries.filter((e: Entry) => !previous.some(p => p.id === e.id)), ...previous]);
        if (Array.isArray(data.tasks)) setTasks(previous => [...data.tasks.filter((t: Task) => !previous.some(p => p.id === t.id)), ...previous]);
      } else {
        const sections = text.split(/(?=^##? )/m).filter(s => s.trim());
        const imported: Entry[] = sections.map(section => {
          const lines = section.split("\n");
          const title = lines[0].replace(/^#+\s*/, "").trim() || "Imported note";
          return { id: makeId(), title, body: lines.slice(1).join("\n").replace(/^\s*\n+/, "").trim(), date: today, time: timeNow(), kind: "Note", tags: [], pinned: false, createdAt: Date.now() };
        });
        setEntries(previous => [...imported, ...previous]);
      }
      setNotice("Import complete");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not import this file"); }
  }
  function changeView(next: View) {
    setView(next); setMobileMenu(false); setActiveEntry(null); setSearch(""); setKindFilter("All");
  }
  function shiftDate(amount: number) {
    const next = new Date(selectedDate + "T12:00:00"); next.setDate(next.getDate() + amount); setSelectedDate(dateKey(next));
  }
  const navItems: { id: View; label: string; icon: typeof Inbox; count?: number }[] = [
    { id: "today", label: "Today", icon: Sun },
    { id: "timeline", label: "Timeline", icon: CalendarDays },
    { id: "tasks", label: "Tasks", icon: ListTodo, count: pendingTasks.length },
    { id: "categories", label: "Categories", icon: Folder },
  ];

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
      <div className="brand-row">
        <div className="brand-mark"><span>dm</span></div>
        <div className="brand-word">daymark<span>.</span><small>YOUR PRIVATE SPACE</small></div>
        <button className="sidebar-close icon-button" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={17}/></button>
      </div>
      <button className="new-entry-button" onClick={() => openNew(today)}><Plus size={16}/><span>Capture a moment</span><kbd>N</kbd></button>
      <div className="nav-label">JOURNAL</div>
      <nav className="main-nav">
        {navItems.map(item => <button key={item.id} className={`nav-item ${view === item.id ? "selected" : ""}`} onClick={() => changeView(item.id)}>
          <item.icon size={17} strokeWidth={1.7}/><span>{item.label}</span>{item.count !== undefined && item.count > 0 && <span className="nav-count">{item.count}</span>}
          {view === item.id && <span className="nav-active-mark"/>}
        </button>)}
      </nav>
      <div className="sidebar-rule"/>
      <div className="nav-label category-label">YOUR TYPES <button aria-label="Add category" onClick={() => {setView("categories");setShowCategoryMenu(true)}}><Plus size={14}/></button></div>
      <nav className="category-nav">
        {kinds.slice(1).map(kind => <button key={kind} className="category-nav-item" onClick={() => {setKindFilter(kind);setView("timeline");setSearch("")}}>
          <span className={`category-dot ${kindColors[kind]}`}/><span>{kind}</span><span className="category-num">{entries.filter(entry => entry.kind === kind).length || ""}</span>
        </button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="privacy-note"><div className="privacy-lock"><BookOpen size={16}/></div><div><strong>Yours to keep.</strong><p>Your notes stay in this browser. Nothing is uploaded.</p></div></div>
        <button className={`nav-item ${view === "settings" ? "selected" : ""}`} onClick={() => changeView("settings")}><Settings2 size={17}/><span>Settings & backup</span></button>
        <div className="sidebar-user"><div className="user-avatar">Y</div><div className="user-copy"><strong>Your journal</strong><span>Local workspace</span></div><MoreHorizontal size={17}/></div>
      </div>
    </aside>
    {mobileMenu && <button className="mobile-scrim" onClick={() => setMobileMenu(false)} aria-label="Close navigation"/>}
    <main className="main-area">
      <header className="topbar">
        <div className="topbar-left"><button className="mobile-menu icon-button" onClick={() => setMobileMenu(true)} aria-label="Open menu"><Menu size={18}/></button><span className="breadcrumbs">Journal</span><ChevronRight size={14}/><strong>{view === "today" ? "Today" : view === "timeline" ? "Timeline" : view === "tasks" ? "Tasks" : view === "categories" ? "Categories" : "Settings"}</strong></div>
        <div className="topbar-right"><div className="save-status"><span/> Saved on this device</div><button className="icon-button top-search" onClick={() => {setShowSearch(v => !v);setView("timeline")}} title="Search entries"><Search size={17}/></button><button className="top-add" onClick={() => openNew(view === "today" ? today : selectedDate)}><Plus size={15}/><span>New entry</span></button></div>
      </header>

      {view === "today" && <div className="page-content today-page">
        <section className="welcome-row">
          <div><div className="eyebrow"><span className="eyebrow-line"/> YOUR DAY, IN YOUR WORDS</div><h1>A little space<br/><em>to remember.</em></h1><p className="welcome-subtitle">Collect the small things before they become distant things.</p></div>
          <div className="date-card"><div className="date-card-top"><span>YOUR PAGE FOR</span><CalendarDays size={17}/></div><div className="date-day">{prettyDate(selectedDate,{day:"2-digit"})}</div><div className="date-month">{prettyDate(selectedDate,{month:"long",weekday:"long"})}</div><div className="date-controls"><button onClick={() => shiftDate(-1)} aria-label="Previous day"><ChevronLeft size={15}/></button><button onClick={() => setSelectedDate(today)} className="today-button">Jump to today</button><button onClick={() => shiftDate(1)} aria-label="Next day"><ChevronRight size={15}/></button></div></div>
        </section>
        <section className="daily-ribbon"><div className="ribbon-glyph">✳</div><div><strong>{selectedDate === today ? "Make room for the ordinary." : prettyDate(selectedDate,{weekday:"long",month:"short",day:"numeric"})}</strong><p>{selectedDate === today ? "A sentence is enough. A list is enough. Start wherever you are." : "Your memories are kept in date order, just like the days they came from."}</p></div><button onClick={() => openNew(selectedDate)}><PenLine size={15}/> Write a note</button></section>
        <section className="today-layout">
          <div className="entries-column">
            <div className="section-title-row"><div><div className="section-kicker">THE DAY SO FAR</div><h2>{selectedDate === today ? "Today’s moments" : prettyDate(selectedDate,{month:"short",day:"numeric"})}</h2></div><span className="entry-count">{todaysEntries.length} {todaysEntries.length === 1 ? "entry" : "entries"}</span></div>
            {todaysEntries.length ? <div className="entry-list">{todaysEntries.map((entry,index) => <article key={entry.id} className={`entry-card ${activeEntry === entry.id ? "entry-active" : ""}`}>
              <div className="entry-time-column"><span className="timeline-node"/><time>{entry.time}</time></div>
              <div className="entry-card-content"><div className="entry-metadata"><span className={`kind-pill ${kindColors[entry.kind]}`}>{entry.kind}</span>{entry.pinned && <span className="pinned-label"><Pin size={11} fill="currentColor"/> Pinned</span>}<button className="entry-more icon-button" onClick={() => openEdit(entry)} aria-label={`Edit ${entry.title}`}><MoreHorizontal size={17}/></button></div><button className="entry-title-button" onClick={() => setActiveEntry(activeEntry === entry.id ? null : entry.id)}>{entry.title}</button><div className={`entry-body ${activeEntry === entry.id ? "entry-body-expanded" : ""}`}>{renderBody(entry.body)}</div>{entry.tags.length > 0 && <div className="tag-row">{entry.tags.map(tag => <button key={tag} onClick={() => {setKindFilter("All");setSearch(tag);setView("timeline")}}><Hash size={11}/>{tag}</button>)}</div>}
                <div className="entry-actions"><button onClick={() => openEdit(entry)}><PenLine size={13}/> Edit</button><button onClick={() => togglePin(entry)}><Pin size={12}/>{entry.pinned ? "Unpin" : "Pin"}</button><button onClick={() => downloadText(`${entry.date}-${entry.title.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.md`, `---\ndate: ${entry.date}\ntype: ${entry.kind.toLowerCase()}\ntags: [${entry.tags.join(", ")}]\n---\n\n# ${entry.title}\n\n${entry.body}\n`)}><Download size={13}/> .md</button></div>
              </div>
            </article>)}</div> : <div className="empty-day"><div className="empty-illustration"><PenLine size={22}/></div><h3>Nothing written down. Yet.</h3><p>Leave a note about this day, even if it is only one line.</p><button className="primary-action" onClick={() => openNew(selectedDate)}><Plus size={15}/> Capture your first moment</button></div>}
            <button className="add-entry-inline" onClick={() => openNew(selectedDate)}><Plus size={15}/> Add another moment <span>·</span></button>
          </div>
          <aside className="day-aside">
            <div className="aside-section quote-panel"><div className="aside-heading"><span className="tiny-spark">✳</span> A NOTE TO SELF</div><div className="quote-mark">“</div><p>You don't have to make every day remarkable. You only have to be here for the one you're living.</p><span className="quote-attribution">A GENTLE REMINDER</span></div>
            <div className="aside-section"><div className="aside-heading"><span>TODAY’S TASKS</span><button onClick={() => changeView("tasks")}>View all <ArrowRight size={12}/></button></div><div className="mini-task-list">{datedTasks.slice(0,4).map(task => <label key={task.id} className={`mini-task ${task.done ? "task-done" : ""}`}><button onClick={() => toggleTask(task.id)} aria-label={task.done ? "Mark incomplete" : "Complete task"}>{task.done ? <Check size={13}/> : <Circle size={14}/>}</button><span>{task.text}</span></label>)}{datedTasks.length === 0 && <p className="aside-empty">A small task makes a good beginning.</p>}</div><button className="mini-add-task" onClick={() => {setView("tasks");setTaskDate(selectedDate)}}><Plus size={13}/> Add a task</button></div>
            <div className="aside-section rhythm-panel"><div className="aside-heading"><span>YOUR RHYTHM</span><span className="rhythm-icon"><Calendar size={14}/></span></div><div className="rhythm-stat"><strong>{streak}</strong><span>day writing streak</span></div><div className="week-dots">{["M","T","W","T","F","S","S"].map((day,i) => {const date = new Date(); const monday = (date.getDay()+6)%7; date.setDate(date.getDate()-monday+i); const key = dateKey(date); const has = entries.some(entry => entry.date === key); return <div key={i} className="week-day"><span className={has ? "day-filled" : ""}>{has ? <Check size={12}/> : ""}</span><small>{day}</small></div>})}</div><p className="rhythm-caption">Small notes build a life you can look back on.</p></div>
          </aside>
        </section>
        {showStarterHint && <div className="starter-banner"><span><Sparkles size={16}/> These are sample moments to show you around. Edit or delete them, or start with your own.</span><button onClick={() => {setEntries([]);setTasks([]);setShowStarterHint(false);setActiveEntry(null);setNotice("Fresh journal ready")}}>Start fresh <X size={13}/></button></div>}
      </div>}

      {view === "timeline" && <div className="page-content content-page"><div className="page-heading"><div className="eyebrow"><span className="eyebrow-line"/> YOUR HISTORY</div><h1>The timeline<span>.</span></h1><p>Every moment, one day at a time. Nothing gets lost in a feed.</p></div>
        <div className="archive-toolbar">{showSearch && <label className="search-field"><Search size={15}/><input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search titles, words or tags…"/>{search && <button onClick={() => setSearch("")}><X size={14}/></button>}</label>}<div className="filter-wrap"><SlidersHorizontal size={15}/><select value={kindFilter} onChange={e => setKindFilter(e.target.value as EntryKind | "All")} aria-label="Filter by type"><option value="All">All types</option>{kinds.map(k => <option key={k}>{k}</option>)}</select><ChevronDown size={13}/></div><span className="results-count">{filteredEntries.length} moments</span><button className="square-button" onClick={() => setShowSearch(v => !v)} aria-label="Search"><Search size={16}/></button></div>
        {filteredEntries.length ? <div className="timeline-groups">{Object.entries(filteredEntries.reduce<Record<string,Entry[]>>((groups,entry) => { (groups[entry.date] ||= []).push(entry); return groups; },{})).map(([date,items]) => <section className="timeline-group" key={date}><div className="timeline-date"><span>{prettyDate(date,{month:"short",day:"2-digit"})}</span><div><strong>{prettyDate(date,{weekday:"long"})}</strong><small>{items.length} {items.length===1?"moment":"moments"}</small></div></div><div className="timeline-items">{items.map(entry => <button key={entry.id} className="timeline-item" onClick={() => {setSelectedDate(entry.date);setView("today");setActiveEntry(entry.id)}}><span className={`timeline-item-dot ${kindColors[entry.kind]}`}/><div><div className="timeline-item-meta"><span>{entry.time}</span><span className={`kind-pill ${kindColors[entry.kind]}`}>{entry.kind}</span></div><strong>{entry.title}</strong><p>{entry.body.slice(0,140) || "A moment captured."}{entry.body.length>140?"…":""}</p>{entry.tags.length > 0 && <small className="timeline-tags">{entry.tags.map(t=>"#"+t).join("  ")}</small>}</div><ArrowRight size={15}/></button>)}</div></section>)}</div> : <div className="empty-state"><Archive size={25}/><h3>No moments match.</h3><p>Try another search or clear the type filter.</p><button className="primary-action" onClick={() => {setSearch("");setKindFilter("All")}}>Clear filters</button></div>}
      </div>}

      {view === "tasks" && <div className="page-content content-page tasks-page"><div className="page-heading"><div className="eyebrow"><span className="eyebrow-line"/> KEEP THINGS MOVING</div><h1>A list that <em>breathes.</em></h1><p>Little things worth doing, without turning your life into a dashboard.</p></div>
        <div className="task-summary"><div><span>TO DO</span><strong>{pendingTasks.length.toString().padStart(2,"0")}</strong></div><div><span>DONE</span><strong>{doneTasks.length.toString().padStart(2,"0")}</strong></div><div><span>COMPLETION</span><strong>{tasks.length ? Math.round(doneTasks.length/tasks.length*100) : 0}%</strong></div><div className="task-sun">✳</div></div>
        <form className="task-create" onSubmit={e => {e.preventDefault();addTask()}}><Plus size={17}/><input value={taskInput} onChange={e=>setTaskInput(e.target.value)} placeholder="Something small you want to get done…"/><input type="date" value={taskDate} onChange={e=>setTaskDate(e.target.value)} aria-label="Task due date"/><button type="submit">Add task <ArrowRight size={14}/></button></form>
        <div className="tasks-workspace"><section className="task-group"><div className="task-group-heading"><span className="task-heading-dot open-dot"/><h2>Up next</h2><span>{pendingTasks.length}</span></div>{pendingTasks.sort((a,b)=>a.due.localeCompare(b.due)).map(task=><div key={task.id} className="task-row"><button className="task-check" onClick={()=>toggleTask(task.id)} aria-label="Complete task"><Circle size={17}/></button><div className="task-row-text"><strong>{task.text}</strong><span className={task.due<today?"overdue":""}>{task.due===today?"Today":task.due===dateKey(new Date(Date.now()+86400000))?"Tomorrow":prettyDate(task.due,{month:"short",day:"numeric"})}</span></div><button className="icon-button task-delete" onClick={()=>deleteTask(task.id)} aria-label="Delete task"><Trash2 size={14}/></button></div>)}{pendingTasks.length===0&&<div className="task-empty"><CheckCheck size={21}/><p>All clear. Enjoy the breathing room.</p></div>}</section><section className="task-group completed-group"><div className="task-group-heading"><span className="task-heading-dot done-dot"/><h2>Put to bed</h2><span>{doneTasks.length}</span></div>{doneTasks.map(task=><div key={task.id} className="task-row task-row-complete"><button className="task-check checked" onClick={()=>toggleTask(task.id)} aria-label="Reopen task"><Check size={14}/></button><div className="task-row-text"><strong>{task.text}</strong><span>{prettyDate(task.due,{month:"short",day:"numeric"})}</span></div><button className="icon-button task-delete" onClick={()=>deleteTask(task.id)} aria-label="Delete task"><Trash2 size={14}/></button></div>)}{doneTasks.length===0&&<p className="muted-hint">The things you finish will find a home here.</p>}</section></div>
      </div>}

      {view === "categories" && <div className="page-content content-page"><div className="page-heading"><div className="eyebrow"><span className="eyebrow-line"/> YOUR THOUGHTS, SORTED</div><h1>By kind, not <em>by folder.</em></h1><p>Each note has a type. Consecutive thoughts on the same thing start to feel like a thread.</p></div><div className="category-grid">{kinds.map((kind,index)=>{const list=entries.filter(e=>e.kind===kind);return <button className="category-card" key={kind} onClick={()=>{setKindFilter(kind);setView("timeline");setSearch("")}}><div className="category-card-top"><span className={`category-large-dot ${kindColors[kind]}`}/><span className="category-card-index">0{index+1}</span></div><h2>{kind}</h2><p>{kind==="Note"?"Everyday thoughts and passing moments":kind==="Reading"?"Lines worth keeping from a book":kind==="Exercise"?"Movement, effort and how you felt":kind==="Idea"?"Things you might want to make":kind==="Work"?"Projects, lessons and progress":kind==="Personal"?"Life, people and inner weather":"Numbers, decisions and money"}</p><div className="category-card-footer"><span>{list.length} {list.length===1?"moment":"moments"}</span><ArrowUpRightIcon/></div></button>})}</div></div>}

      {view === "settings" && <div className="page-content content-page"><div className="page-heading"><div className="eyebrow"><span className="eyebrow-line"/> MAKE YOURSELF AT HOME</div><h1>Your space. <em>Your rules.</em></h1><p>Daymark is local-first. Your journal lives in this browser unless you choose to export it.</p></div><div className="settings-layout"><section className="settings-card"><div className="settings-card-icon"><Download size={18}/></div><div><h2>Backup your journal</h2><p>Download your moments as Markdown, and a JSON backup with entries and tasks. Keep the files somewhere safe.</p><button className="primary-action" onClick={exportBackup}><Download size={15}/> Export backup</button></div></section><section className="settings-card"><div className="settings-card-icon"><FileText size={18}/></div><div><h2>Bring notes in</h2><p>Import a Daymark JSON backup, or Markdown text files. Imported notes are added to your existing journal.</p><label className="secondary-action"><Plus size={14}/> Choose .json or .md<input type="file" accept=".json,.md,.markdown,.txt" onChange={e=>importBackup(e.target.files?.[0])}/></label></div></section><section className="settings-card"><div className="settings-card-icon"><Folder size={18}/></div><div><h2>Storage & privacy</h2><p><strong>Stored in this browser</strong><br/>No account. No analytics. No data sent to a server. Clearing browser data can delete this journal, so export a backup occasionally.</p><div className="privacy-status"><span/> Local storage active</div></div></section><section className="settings-card"><div className="settings-card-icon"><Archive size={18}/></div><div><h2>Start a clean journal</h2><p>Remove all entries and tasks from this browser. Export a backup first if you'd like to keep them.</p><button className="danger-button" onClick={()=>{if(window.confirm("Delete every entry and task from this browser? Export a backup first if you need one.")){setEntries([]);setTasks([]);setShowStarterHint(false);setActiveEntry(null);setNotice("Journal cleared")}}}><Trash2 size={14}/> Clear journal</button></div></section></div></div>}

      <footer className="app-footer"><span>DAYMARK <i>·</i> A SMALL PLACE FOR THE DAYS YOU WANT TO KEEP</span><span>MADE FOR THE MOMENTS BETWEEN THINGS</span></footer>
    </main>

    {editorOpen && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setEditorOpen(false)}}><section className="editor-modal"><header className="editor-modal-header"><div><div className="eyebrow"><span className="eyebrow-line"/>{activeEntry?"EDIT A MOMENT":"SAVE THIS MOMENT"}</div><h2>{activeEntry?"A little revision.":"Put it into words."}</h2></div><button className="icon-button" onClick={()=>setEditorOpen(false)} aria-label="Close editor"><X size={18}/></button></header><div className="editor-field"><label htmlFor="entry-title">GIVE IT A TITLE</label><input id="entry-title" autoFocus value={draftTitle} onChange={e=>setDraftTitle(e.target.value)} placeholder="What do you want to remember?"/></div><div className="editor-field"><label htmlFor="entry-body">THE MOMENT <span>Markdown-friendly · plain words are perfect</span></label><textarea id="entry-body" value={draftBody} onChange={e=>setDraftBody(e.target.value)} rows={8} placeholder={"Write a thought, a list, a line from a book…\n\nIt doesn't need to be finished."}/><div className="editor-helper"><span>**bold**</span><span>- list item</span><span>#tag below</span></div></div><div className="editor-fields-row"><div className="editor-field"><label htmlFor="entry-kind">TYPE</label><div className="select-with-icon"><span className={`category-dot ${kindColors[draftKind]}`}/><select id="entry-kind" value={draftKind} onChange={e=>setDraftKind(e.target.value as EntryKind)}>{kinds.map(kind=><option key={kind}>{kind}</option>)}</select><ChevronDown size={13}/></div></div><div className="editor-field"><label htmlFor="entry-date">DATE</label><input id="entry-date" type="date" value={draftDate} onChange={e=>setDraftDate(e.target.value)}/></div></div><div className="editor-field"><label htmlFor="entry-tags">TAGS <span>COMMA SEPARATED</span></label><div className="tag-input-wrap"><Hash size={14}/><input id="entry-tags" value={draftTags} onChange={e=>setDraftTags(e.target.value)} placeholder="reading, gratitude, idea"/></div></div><footer className="editor-modal-footer">{activeEntry ? <button className="delete-entry-button" onClick={()=>{const entry=entries.find(e=>e.id===activeEntry);if(entry)deleteEntry(entry)}}><Trash2 size={14}/> Delete</button> : <span className="editor-privacy"><span/> Saved only on this device</span>}<div><button className="cancel-button" onClick={()=>setEditorOpen(false)}>Cancel</button><button className="primary-action" onClick={saveEntry}><Check size={15}/>{activeEntry?"Save changes":"Keep this moment"}</button></div></footer></section></div>}
    {notice && <div className="toast"><Check size={15}/>{notice}<button onClick={()=>setNotice("")}><X size={13}/></button></div>}
  </div>;
}

function ArrowUpRightIcon() {
  return <ArrowRight size={15}/>;
}
