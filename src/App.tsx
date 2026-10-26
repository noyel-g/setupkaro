import { useEffect, useState } from "react";
import type React from "react";
import { ArrowDownRight, ArrowRight, Check, Feather, Flag, Heart, LoaderCircle, ShieldCheck, Sparkles, X } from "lucide-react";

type ExchangeResponse = {
  received?: { id: string; body: string; source: "visitor" | "first-pile" };
  waiting?: boolean;
  error?: string;
};
type Phase = "write" | "sending" | "received" | "waiting" | "error";
type SavedExchange = { phase: "received" | "waiting"; received?: NonNullable<ExchangeResponse["received"]> };

const SESSION_KEY = "dayletter-exchange-v1";
const MAX_LENGTH = 600;

function getSavedExchange(): SavedExchange | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as SavedExchange;
    return value && (value.phase === "received" || value.phase === "waiting") ? value : null;
  } catch { return null; }
}

export default function App() {
  const [phase, setPhase] = useState<Phase>("write");
  const [message, setMessage] = useState("");
  const [received, setReceived] = useState<ExchangeResponse["received"]>();
  const [error, setError] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("inappropriate");
  const [reported, setReported] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [noteCount, setNoteCount] = useState<number | null>(null);

  useEffect(() => {
    const saved = getSavedExchange();
    if (saved) {
      setPhase(saved.phase);
      setReceived(saved.received);
    }
    fetch("/api/health").then(response => response.ok ? response.json() : null)
      .then(data => { if (typeof data?.availableNotes === "number") setNoteCount(data.availableNotes); })
      .catch(() => {});
  }, []);

  const trimmed = message.trim();
  const canSubmit = trimmed.length >= 8 && trimmed.length <= MAX_LENGTH && phase !== "sending";

  async function sendNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setPhase("sending");
    setError("");
    try {
      const response = await fetch("/api/exchange", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: trimmed })
      });
      const data = await response.json() as ExchangeResponse;
      if (!response.ok) {
        setPhase("write");
        setError(data.error || "That note couldn't be sent. Please try again.");
        return;
      }
      if (data.received) {
        setReceived(data.received);
        setPhase("received");
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ phase: "received", received: data.received } satisfies SavedExchange));
      } else {
        setPhase("waiting");
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ phase: "waiting" } satisfies SavedExchange));
      }
      setMessage("");
      fetch("/api/health").then(response => response.ok ? response.json() : null)
        .then(result => { if (typeof result?.availableNotes === "number") setNoteCount(result.availableNotes); })
        .catch(() => {});
    } catch {
      setPhase("write");
      setError("We couldn't reach the note pile. Check your connection and try again.");
    }
  }

  async function reportNote() {
    if (!received?.id) return;
    setReporting(true);
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ noteId: received.id, reason: reportReason })
      });
      if (!response.ok) throw new Error("Report failed");
      setReported(true);
      setReportOpen(false);
    } catch {
      setError("We couldn't send that report. Please try again.");
    } finally {
      setReporting(false);
    }
  }

  const isFirstPile = received?.source === "first-pile";

  return <div className="site-shell">
    <header className="site-header">
      <a className="wordmark" href="/" aria-label="Dayletter home"><span className="wordmark-icon"><Feather size={17} strokeWidth={1.8}/></span><span>dayletter<span className="wordmark-period">.</span></span></a>
      <div className="header-note"><span className="live-dot"/><span>A small connection between strangers</span></div>
      <a href="#how-it-works" className="header-how">HOW IT WORKS <ArrowDownRight size={13}/></a>
    </header>

    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-rule"/> THE INTERNET, A LITTLE MORE HUMAN</div>
          <h1>Leave a little<br/>something <em>here.</em></h1>
          <p className="hero-lede">Write a note for someone you’ll never meet. In return, receive a note left here by a stranger.</p>
          <div className="hero-proof">
            <div className="proof-mark"><Heart size={15}/></div>
            <div><strong>No profiles. No replies. Just words.</strong><span>One note from you. One note for you.</span></div>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-halo art-halo-one"/><div className="art-halo art-halo-two"/>
          <div className="tiny-sun">✳</div>
          <div className="floating-note note-back"><span>FOR WHOEVER FINDS THIS</span><i>Maybe today<br/>will surprise you.</i><b>— someone, somewhere</b></div>
          <div className="floating-note note-front"><span>A THOUGHT, IN PASSING</span><i>The world feels<br/>smaller when<br/>we're kind.</i><b>with care, a stranger</b><div className="note-stamp">D<br/>L</div></div>
          <div className="art-thread"/>
          <div className="art-caption">A NOTE PASSES THROUGH YOU <ArrowRight size={12}/></div>
        </div>
      </section>

      {phase === "write" || phase === "sending" || phase === "error" ? <section className="exchange-section" id="leave-a-note">
        <div className="section-intro"><span className="section-number">01 / YOUR TURN</span><h2>What would you like<br/>a stranger to know?</h2><p>It can be a small hope, a thought you can’t quite place, or something kind you wish someone would hear.</p></div>
        <form className="compose-card" onSubmit={sendNote}>
          <div className="compose-top"><span><span className="compose-dot"/> A NOTE FOR THE NEXT PERSON</span><span className="anonymous-label"><ShieldCheck size={12}/> ANONYMOUS</span></div>
          <textarea value={message} onChange={event => setMessage(event.target.value.slice(0, MAX_LENGTH))} maxLength={MAX_LENGTH} placeholder={"To whoever is reading this…\n\n"} aria-label="Write an anonymous note" disabled={phase === "sending"}/>
          <div className="compose-bottom"><span className={trimmed.length > MAX_LENGTH - 60 ? "char-warning" : ""}>{trimmed.length} / {MAX_LENGTH}</span><span>Don’t include names, contact details, or links.</span></div>
          {error && <div className="inline-error"><X size={14}/>{error}</div>}
          <button type="submit" className="send-button" disabled={!canSubmit}>{phase === "sending" ? <><LoaderCircle className="spin" size={16}/> Sending your note…</> : <>Leave a note <span className="send-button-icon"><ArrowRight size={16}/></span></>}</button>
          <div className="under-button"><ShieldCheck size={12}/> Your note is anonymous. It won’t be published as a public feed.</div>
        </form>
      </section> : null}

      {phase === "received" && received && <section className="result-section" aria-live="polite">
        <div className="result-heading"><div className="success-symbol"><Check size={17}/></div><div><span className="section-number">02 / A LITTLE SOMETHING FOR YOU</span><h2>A stranger left you<br/><em>these words.</em></h2></div></div>
        <article className="received-card">
          <div className="received-card-top"><span className="letter-icon"><Feather size={16}/></span><div><strong>{isFirstPile ? "A note from the first pile" : "A note from a stranger"}</strong><span>{isFirstPile ? "A small seed note, while the pile grows" : "Somewhere out there, someone wrote this"}</span></div><span className="envelope-stamp">UNADDRESSED<br/>· TO YOU ·</span></div>
          <div className="received-body">{received.body}</div>
          <div className="received-card-bottom"><span>YOU DON’T KNOW THEM. THEY DON’T KNOW YOU.</span><span className="tiny-heart">♡</span></div>
        </article>
        <div className="result-actions"><div className="result-thanks"><Sparkles size={15}/><span>Your note has joined the pile for someone else to find.</span></div><button className="report-button" onClick={() => setReportOpen(true)} disabled={reported}><Flag size={13}/>{reported ? "Reported" : "Report note"}</button></div>
        <div className="closing-line"><span className="closing-dash"/> Let the note be enough. <span className="closing-dash"/></div>
        <button className="share-link" onClick={() => {navigator.clipboard?.writeText(window.location.origin).then(() => setError("")).catch(() => {}); setError("Pass dayletter along to someone who might need a kind word.");}}><Heart size={14}/> Pass the kindness on <ArrowRight size={13}/></button>
        {error && <p className="share-feedback" aria-live="polite">{error}</p>}
      </section>}

      {phase === "waiting" && <section className="result-section waiting-section" aria-live="polite">
        <div className="success-symbol waiting-symbol"><Feather size={17}/></div><span className="section-number">02 / YOUR NOTE IS OUT THERE</span><h2>Yours is waiting<br/><em>for a stranger.</em></h2>
        <p className="waiting-copy">We’ve placed your note in the pile, but there isn’t another note waiting just yet. When someone leaves theirs, it can find its way to a visitor like you.</p>
        <div className="waiting-card"><span className="waiting-star">✳</span><p>Good things sometimes take one more person.</p><span>THANK YOU FOR STARTING THE CHAIN</span></div>
        <div className="closing-line"><span className="closing-dash"/> You’ve done your part. <span className="closing-dash"/></div>
      </section>}

      <section className="how-section" id="how-it-works">
        <div className="how-header"><span className="section-number">THE WHOLE IDEA</span><h2>A little give.<br/><em>A little receive.</em></h2></div>
        <div className="how-steps">
          <article><span className="step-number">01</span><div className="step-illustration step-write"><Feather size={21}/><span>✳</span></div><h3>Leave a note</h3><p>Write whatever feels right. No name or account needed.</p></article>
          <article><span className="step-number">02</span><div className="step-illustration step-pass"><ArrowRight size={21}/><span>···</span></div><h3>Pass it forward</h3><p>Your words wait quietly until the next person comes along.</p></article>
          <article><span className="step-number">03</span><div className="step-illustration step-receive"><Heart size={21}/><span>✳</span></div><h3>Find a note</h3><p>Receive a random note from someone who was here before you.</p></article>
        </div>
      </section>

      <section className="promise-section"><div className="promise-mark"><ShieldCheck size={19}/></div><div><h3>Small, anonymous, and meant to pass on.</h3><p>There are no profiles, follower counts, or public archives. Notes can be reported if something crosses a line. Please don’t share personal information.</p></div><div className="promise-symbol">↗</div></section>
    </main>

    <footer className="site-footer"><a className="footer-brand" href="/"><Feather size={13}/> dayletter<span>.</span></a><span>A SOFTER CORNER OF THE INTERNET</span><span>MADE OF WORDS, LEFT BY PEOPLE</span></footer>

    {reportOpen && received && <div className="modal-scrim" onMouseDown={event => { if (event.target === event.currentTarget) setReportOpen(false); }}><section className="report-modal" role="dialog" aria-modal="true" aria-labelledby="report-heading"><button className="modal-close" onClick={() => setReportOpen(false)} aria-label="Close report form"><X size={17}/></button><div className="report-icon"><Flag size={18}/></div><h2>Something feel off?</h2><p>Tell us why this note should be reviewed. Reports help keep the note pile kinder.</p><div className="reason-list">{[{id:"inappropriate",label:"Inappropriate or explicit content"},{id:"personal",label:"Personal information or contact details"},{id:"harassment",label:"Hateful or harassing message"},{id:"spam",label:"Spam or something else"}].map(reason => <label key={reason.id}><input type="radio" name="reason" value={reason.id} checked={reportReason===reason.id} onChange={() => setReportReason(reason.id)}/><span>{reason.label}</span></label>)}</div><div className="modal-actions"><button className="cancel-report" onClick={() => setReportOpen(false)}>Cancel</button><button className="confirm-report" onClick={reportNote} disabled={reporting}>{reporting ? <LoaderCircle size={14} className="spin"/> : <Flag size={14}/>} Send report</button></div></section></div>}
    <div className="page-grain" aria-hidden="true"/>
  </div>;
}
