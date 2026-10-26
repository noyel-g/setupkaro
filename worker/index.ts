interface Env {
  ASSETS: Fetcher;
  DB?: D1Database;
}

type NoteRow = { id: string; body: string; is_seed: number };

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
const id = () => crypto.randomUUID();
const noteIdPattern = /^(?:[0-9a-f-]{36}|seed-[0-9a-f]{32})$/i;

function contentError(body: string): string | null {
  const value = body.trim();
  if (value.length < 8) return "Write a little more before sending your note.";
  if (value.length > 600) return "Keep your note to 600 characters or fewer.";
  if (/https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(value)) return "Please leave out links and email addresses. This is a note, not a way to contact someone.";
  if (/(?:\+?\d[\d\s().-]{8,}\d)/.test(value)) return "Please leave out phone numbers or other contact details.";
  if (/(.)\1{11,}/s.test(value)) return "That looks a little like spam. Try sending the thought in your own words.";
  return null;
}

async function exchange(request: Request, env: Env) {
  if (!env.DB) return json({ error: "The note pile is not connected yet. Please try again later." }, 503);
  let payload: { body?: unknown };
  try { payload = await request.json() as { body?: unknown }; } catch { return json({ error: "Please send a note in plain text." }, 400); }
  if (typeof payload.body !== "string") return json({ error: "Please write a note first." }, 400);
  const body = payload.body.trim();
  const reason = contentError(body);
  if (reason) return json({ error: reason }, 400);

  // Keep the pool ephemeral: delivered notes age out, abandoned writes are removed,
  // and old unclaimed notes do not remain in the system indefinitely.
  await env.DB.prepare(
    "DELETE FROM notes WHERE (status = 'delivered' AND delivered_at < datetime('now', '-7 days')) OR (status = 'available' AND created_at < datetime('now', '-90 days')) OR (status = 'pending' AND created_at < datetime('now', '-1 hour'))"
  ).run().catch(() => undefined);

  const newId = id();
  await env.DB.prepare(
    "INSERT INTO notes (id, body, status, is_seed) VALUES (?, ?, 'pending', 0)"
  ).bind(newId, body).run();

  // Claim a random note using a conditional update. If another visitor claims the
  // same note between SELECT and UPDATE, retry instead of serving it twice.
  let received: NoteRow | null = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = await env.DB.prepare(
      "SELECT id, body, is_seed FROM notes WHERE status = 'available' AND is_flagged = 0 ORDER BY RANDOM() LIMIT 1"
    ).first<NoteRow>();
    if (!candidate) break;
    const claimed = await env.DB.prepare(
      "UPDATE notes SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'available' AND is_flagged = 0"
    ).bind(candidate.id).run();
    if ((claimed.meta?.changes ?? 0) === 1) {
      received = candidate;
      break;
    }
  }

  await env.DB.prepare("UPDATE notes SET status = 'available' WHERE id = ? AND status = 'pending'").bind(newId).run();

  if (!received) return json({ ok: true, waiting: true });
  return json({
    ok: true,
    received: { id: received.id, body: received.body, source: received.is_seed ? "first-pile" : "visitor" }
  });
}

async function report(request: Request, env: Env) {
  if (!env.DB) return json({ error: "Reporting is unavailable right now." }, 503);
  let payload: { noteId?: unknown; reason?: unknown };
  try { payload = await request.json() as { noteId?: unknown; reason?: unknown }; } catch { return json({ error: "Invalid report." }, 400); }
  const noteId = typeof payload.noteId === "string" ? payload.noteId : "";
  const allowed = new Set(["inappropriate", "personal", "harassment", "spam"]);
  const reason = typeof payload.reason === "string" && allowed.has(payload.reason) ? payload.reason : "spam";
  if (!noteIdPattern.test(noteId)) return json({ error: "That note could not be found." }, 400);
  const result = await env.DB.prepare("SELECT id FROM notes WHERE id = ? AND status = 'delivered'").bind(noteId).first<{ id: string }>();
  if (!result) return json({ error: "This note is no longer available to report." }, 404);
  await env.DB.batch([
    env.DB.prepare("INSERT INTO note_reports (id, note_id, reason) VALUES (?, ?, ?)").bind(id(), noteId, reason),
    env.DB.prepare("UPDATE notes SET is_flagged = 1 WHERE id = ?").bind(noteId)
  ]);
  return json({ ok: true });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      if (url.pathname === "/api/health" && request.method === "GET") {
        if (!env.DB) return json({ ok: false, error: "database-not-configured" }, 503);
        try {
          const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM notes WHERE status = 'available' AND is_flagged = 0").first<{ count: number }>();
          return json({ ok: true, availableNotes: row?.count ?? 0 });
        } catch { return json({ ok: false, error: "database-not-ready" }, 503); }
      }
      if (url.pathname === "/api/exchange" && request.method === "POST") {
        try { return await exchange(request, env); } catch { return json({ error: "The note pile had a small hiccup. Please try again." }, 500); }
      }
      if (url.pathname === "/api/report" && request.method === "POST") {
        try { return await report(request, env); } catch { return json({ error: "The report could not be saved. Please try again." }, 500); }
      }
      return json({ error: "Not found." }, 404);
    }
    return env.ASSETS.fetch(request);
  }
};
