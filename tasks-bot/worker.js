// SetupKaro Tasks Bot — Cloudflare Worker + D1 (binding name: DB)
// Secrets: BOT_TOKEN, ADMIN_IDS (comma-separated Telegram user IDs, e.g. "2139204449")

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const now = () => Math.floor(Date.now() / 1000);
const date = (ts) => ts ? new Date(ts * 1000).toISOString().slice(0, 10) : '—';
const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

async function tg(env, method, body) {
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  try { return await r.json(); } catch { return { ok: false }; }
}
const send = (env, chat_id, text, extra = {}) =>
  tg(env, 'sendMessage', { chat_id, text, parse_mode: 'HTML', ...extra });
const answerCb = (env, id, text = '') =>
  tg(env, 'answerCallbackQuery', { callback_query_id: id, text: text.slice(0, 190) });

const isAdmin = (env, id) => String(env.ADMIN_IDS || '').split(',').map(s => s.trim()).includes(String(id));

// ---- sessions ----
async function getSess(env, id) {
  const r = await env.DB.prepare('SELECT state, data FROM sessions WHERE tg_id=?').bind(id).first();
  return r ? { state: r.state, data: r.data ? JSON.parse(r.data) : {} } : { state: null, data: {} };
}
async function setSess(env, id, state, data = {}) {
  await env.DB.prepare('INSERT INTO sessions (tg_id, state, data) VALUES (?,?,?) ON CONFLICT(tg_id) DO UPDATE SET state=excluded.state, data=excluded.data')
    .bind(id, state, JSON.stringify(data)).run();
}
async function clearSess(env, id) {
  await env.DB.prepare('DELETE FROM sessions WHERE tg_id=?').bind(id).run();
}

function parseReddit(input) {
  let s = String(input || '').trim();
  let m = s.match(/reddit\.com\/(?:u|user)\/([A-Za-z0-9_-]+)/i);
  if (m) return m[1];
  s = s.replace(/^@/, '').replace(/^u\//i, '').replace(/^\/?u\//i, '');
  m = s.match(/^([A-Za-z0-9_-]{3,20})$/);
  return m ? m[1] : null;
}

async function redditInfo(user) {
  try {
    const r = await fetch(`https://www.reddit.com/user/${encodeURIComponent(user)}/about.json`, {
      headers: { 'User-Agent': 'SetupKaroTasksBot/1.0 (admin review helper)' },
    });
    if (!r.ok) return null;
    const d = (await r.json()).data || {};
    return {
      created: d.created_utc ? date(Math.floor(d.created_utc)) : '?',
      link: d.link_karma ?? '?',
      comment: d.comment_karma ?? '?',
      createdUtc: d.created_utc ? Math.floor(d.created_utc) : 0,
      linkN: typeof d.link_karma === 'number' ? d.link_karma : 0,
      commentN: typeof d.comment_karma === 'number' ? d.comment_karma : 0,
    };
  } catch { return null; }
}

// Honest proxy for Contributor Quality Score (Reddit's real CQS is internal
// and invisible to any API). Never presented as Reddit's score.
function cqsTier(ageDays, karma) {
  if (ageDays >= 365 && karma >= 1000) return 'high';
  if ((ageDays >= 365 && karma >= 100) || (ageDays >= 180 && karma >= 500)) return 'moderate';
  return 'low';
}
function statsOf(w) {
  const age = w.reddit_created ? Math.floor((now() - w.reddit_created) / 86400) : 0;
  const karma = (w.link_karma || 0) + (w.comment_karma || 0);
  return { age, karma, tier: cqsTier(age, karma) };
}

async function workerStatus(env, id) {
  const w = await env.DB.prepare('SELECT status FROM workers WHERE tg_id=?').bind(id).first();
  return w ? w.status : null;
}

// ================= WORKER COMMANDS =================
const HELP = `<b>SetupKaro Tasks — help</b>
/start — begin / see status
/rules — must-read: what is this work, payment, risks
/profile — your application, tasks & payments
/tasks — available tasks (approved workers)
/mytasks — your active, pending & past work
/payments — pending, paid & totals
/help — this message
Send /start anytime to return to the main menu.`;

const RULES = `<b>📖 Read Before You Start — Reddit Posting Work</b>

<b>1. What is this task?</b>
Clients want promotion / other work on Reddit. You post from your own active Reddit account as instructed.
We need good, active accounts. Moderate to High quality or good karma preferred. Higher quality = higher pay (₹150-₹500 per post).

<b>2. Payment</b>
• ₹150 – ₹500 per post, as per post requirement
• Moderate to High accounts get higher amount
• Payment is NOT instant
• Post must stay live in the subreddit for at least 48 hours, then you get paid

<b>3. Problems while posting — be careful</b>
• If you post out of nowhere, Reddit filters may mark you as spam and ban you
• Each subreddit has its own rules — read them before posting
• Using a secondary account is better / safer for you

<b>4. Why can't I see all tasks?</b>
In /tasks you only see tasks your account qualifies for. If you are not seeing a task, your account may be inactive, low karma, or low CQS.

<b>5. Reddit + CQS screenshot required</b>
When you apply, send Reddit username + CQS screenshot.
How to check CQS:
1. Go to r/whatismycqs
2. Post with title: what is my cqs
3. Just below your title you will see your CQS — take a screenshot and send it here.`;

const CQS_HOWTO = `How to check CQS:
1. Go to r/whatismycqs
2. Post with title: what is my cqs
3. Just below your title you will see your CQS — screenshot it and send here.`;

const TASKS_FOOTER = `ℹ️ Only tasks your account qualifies for are shown here. If you are not seeing a task, your account may be inactive, low karma, or low CQS. Payment is only after your post stays live 48 hours.`;

async function cmdStart(env, chatId, from) {
  const st = await workerStatus(env, from.id);
  const kb = st === 'approved'
    ? { inline_keyboard: [[{ text: '📋 View tasks', callback_data: 'w:tasks' }], [{ text: '👤 My profile', callback_data: 'w:profile' }], [{ text: '📖 Read Before Start', callback_data: 'w:rules' }]] }
    : { inline_keyboard: [[{ text: '📖 Read Before Start', callback_data: 'w:rules' }], [{ text: '📝 Submit Reddit Profile', callback_data: 'w:apply' }]] };
  const extra = st === 'approved'
    ? '\n\nYour application is <b>approved</b> — tasks are open to you.'
    : st ? `\n\nApplication status: <b>${esc(st)}</b>.`
    : '';
  await send(env, chatId,
    `Welcome to <b>SetupKaro</b>.\n\nPaid Reddit posting tasks (₹150-₹500/post). You post from your active account, post must stay live 48 hours to get paid. Moderate-High / good karma accounts earn more.\n\n⚠️ Please tap <b>Read Before Start</b> first — it explains payment, spam/ban risk, subreddit rules, and why some tasks may not show for low karma/CQS.${extra}`,
    { reply_markup: kb });
}

async function cmdRules(env, chatId, from) {
  const st = await workerStatus(env, from.id);
  const btn = st === 'approved'
    ? [[{ text: '📋 View tasks', callback_data: 'w:tasks' }]]
    : [[{ text: '📝 I Agree — Submit Reddit Profile', callback_data: 'w:apply' }]];
  await send(env, chatId, RULES, { reply_markup: { inline_keyboard: btn } });
}

async function cmdProfile(env, chatId, from) {
  const w = await env.DB.prepare('SELECT * FROM workers WHERE tg_id=?').bind(from.id).first();
  if (!w) {
    await send(env, chatId, `No application yet. Tap below to apply.`,
      { reply_markup: { inline_keyboard: [[{ text: '📝 Submit Reddit Profile', callback_data: 'w:apply' }]] } });
    return;
  }
  const done = await env.DB.prepare("SELECT COUNT(*) c FROM assignments WHERE tg_id=? AND status='completed'").bind(from.id).first();
  const pend = await env.DB.prepare("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE tg_id=? AND status='pending'").bind(from.id).first();
  const paid = await env.DB.prepare("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE tg_id=? AND status='paid'").bind(from.id).first();
  await send(env, chatId,
    `<b>👤 Profile</b>\nTelegram: @${esc(w.tg_username || from.username || '?')}\nReddit: ${w.reddit_user ? `u/${esc(w.reddit_user)}` : `📷 screenshot on file`}\nApplication: <b>${esc(w.status)}</b>\nCompleted tasks: <b>${done.c}</b>\nPending payments: <b>${inr(pend.s)}</b>\nPaid total: <b>${inr(paid.s)}</b>`);
}

async function cmdTasks(env, chatId, from) {
  if (await workerStatus(env, from.id) !== 'approved') {
    await send(env, chatId, `Tasks open after approval. Current status: <b>${esc(await workerStatus(env, from.id) || 'not applied')}</b>.`);
    return;
  }
  const list = (await env.DB.prepare("SELECT * FROM tasks WHERE status='open' ORDER BY id DESC LIMIT 15").all()).results;
  if (!list.length) { await send(env, chatId, `No open tasks right now. You'll be notified here when one drops.\n\n${TASKS_FOOTER}`); return; }
  for (const t of list) {
    const n = await env.DB.prepare("SELECT COUNT(*) c FROM assignments WHERE task_id=? AND status IN ('accepted','submitted','completed')").bind(t.id).first();
    await send(env, chatId,
      `📌 <b>${esc(t.title)}</b>\nTarget: r/${esc(t.subreddit)}\nPayment: <b>${inr(t.amount)}</b>\nSlots: ${n.c}/${t.needed}${t.deadline ? `\nDeadline: ${esc(t.deadline)}` : ''}`,
      { reply_markup: { inline_keyboard: [[{ text: '👁 View Task', callback_data: `w:view:${t.id}` }]] } });
  }
  await send(env, chatId, TASKS_FOOTER);
}

async function cmdMyTasks(env, chatId, from) {
  const rows = (await env.DB.prepare(
    'SELECT a.*, t.title FROM assignments a JOIN tasks t ON t.id=a.task_id WHERE a.tg_id=? ORDER BY a.id DESC LIMIT 20').bind(from.id).all()).results;
  if (!rows.length) { await send(env, chatId, `No tasks yet. Check /tasks when approved.`); return; }
  const label = { accepted: '🟡 Active', submitted: '🕐 Pending verification', completed: '✅ Completed', rejected: '❌ Rejected' };
  await send(env, chatId, `<b>📁 My tasks</b>\n\n` + rows.map(a =>
    `${label[a.status] || a.status} — <b>${esc(a.title)}</b> (#${a.task_id})${a.status === 'rejected' && a.reject_reason ? `\nReason: ${esc(a.reject_reason)}` : ''}`
  ).join('\n\n'));
}

async function cmdPayments(env, chatId, from) {
  const rows = (await env.DB.prepare(
    'SELECT p.*, t.title FROM payments p JOIN tasks t ON t.id=p.task_id WHERE p.tg_id=? ORDER BY p.id DESC LIMIT 20').bind(from.id).all()).results;
  if (!rows.length) { await send(env, chatId, `No payments yet — they appear here after your submissions are verified.`); return; }
  const tot = rows.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0);
  await send(env, chatId, `<b>💰 Payments</b>\n\n` + rows.map(r =>
    `${r.status === 'paid' ? '✅ Paid' : '🕐 Pending'} — ${inr(r.amount)} — <b>${esc(r.title)}</b> (#${r.task_id})`
  ).join('\n') + `\n\nTotal paid: <b>${inr(tot)}</b>`);
}

// ================= ADMIN =================
async function cmdAdmin(env, chatId) {
  const pa = await env.DB.prepare("SELECT COUNT(*) c FROM applications WHERE status='pending'").first();
  const at = await env.DB.prepare("SELECT COUNT(*) c FROM tasks WHERE status='open'").first();
  const ps = await env.DB.prepare("SELECT COUNT(*) c FROM assignments WHERE status='submitted'").first();
  const pp = await env.DB.prepare("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE status='pending'").first();
  const tw = await env.DB.prepare("SELECT COUNT(*) c FROM workers WHERE status='approved'").first();
  const ct = await env.DB.prepare("SELECT COUNT(*) c FROM assignments WHERE status='completed'").first();
  await send(env, chatId,
    `<b>🛠 Admin dashboard</b>\nPending applications: <b>${pa.c}</b>\nActive tasks: <b>${at.c}</b>\nPending submissions: <b>${ps.c}</b>\nPending payments: <b>${inr(pp.s)}</b>\nTotal workers: <b>${tw.c}</b>\nCompleted tasks: <b>${ct.c}</b>`,
    { reply_markup: { inline_keyboard: [
      [{ text: `📥 Applications (${pa.c})`, callback_data: 'a:apps' }],
      [{ text: `🕐 Submissions (${ps.c})`, callback_data: 'a:subs' }],
      [{ text: `💰 Payments (${inr(pp.s)})`, callback_data: 'a:pays' }],
      [{ text: '➕ New task', callback_data: 'a:new' }, { text: '👥 Workers', callback_data: 'a:workers' }],
    ]}});
}

async function listApps(env, chatId) {
  const rows = (await env.DB.prepare("SELECT * FROM applications WHERE status='pending' ORDER BY id DESC LIMIT 10").all()).results;
  if (!rows.length) { await send(env, chatId, `No pending applications. 🎉`); return; }
  for (const a of rows) {
    const info = a.reddit_user ? await redditInfo(a.reddit_user) : null;
    const tier = info ? cqsTier(info.createdUtc ? Math.floor((now() - info.createdUtc) / 86400) : 0, info.linkN + info.commentN) : '?';
    const rline = a.reddit_user
      ? `Reddit: u/${esc(a.reddit_user)} — https://www.reddit.com/user/${encodeURIComponent(a.reddit_user)}\n${info ? `Reddit age: ${info.created} • link karma ${info.link} • comment karma ${info.comment} • quality-proxy: ${tier}` : `Reddit public info unavailable — open profile manually.`}`
      : `Reddit: 📷 screenshot only (private profile)`;
    const body = `<b>📥 Application #${a.id}</b>\nTelegram: @${esc(a.tg_username || '?')} (<code>${a.tg_id}</code>)\n${rline}\nDate: ${date(a.created_at)}\nStatus: <b>${a.status}</b>\n\n<i>Review history, karma, activity &amp; standing yourself — never auto-approve on karma alone.</i>`;
    const kb = { reply_markup: { inline_keyboard: [[
        { text: '✅ Approve', callback_data: `a:app_ok:${a.id}` },
        { text: '❌ Reject', callback_data: `a:app_no:${a.id}` },
      ]]} };
    if (a.proof_file_id) {
      await tg(env, 'sendPhoto', { chat_id: chatId, photo: a.proof_file_id, caption: body.slice(0, 1000), parse_mode: 'HTML', ...kb }).catch(() => {});
    } else {
      await send(env, chatId, body, kb);
    }
  }
}

// ---- qualified broadcast (stats refreshed, moderate+ quality always required) ----
async function qualifiedWorkers(env, minAge, minKarma) {
  const ws = (await env.DB.prepare("SELECT * FROM workers WHERE status='approved'").all()).results;
  for (const w of ws) {
    if (w.reddit_user) {
      const info = await redditInfo(w.reddit_user);
      if (info) await env.DB.prepare('UPDATE workers SET reddit_created=?, link_karma=?, comment_karma=? WHERE tg_id=?')
        .bind(info.createdUtc, info.linkN, info.commentN, w.tg_id).run().catch(() => {});
    }
  }
  const fresh = (await env.DB.prepare("SELECT * FROM workers WHERE status='approved'").all()).results;
  return fresh.filter(w => {
    const s = statsOf(w);
    if (minAge > 0 && s.age < minAge) return false;
    if (minKarma > 0 && s.karma < minKarma) return false;
    if (s.tier === 'low') return false;
    return true;
  });
}
async function newTaskFlow(env, chatId, from, text, photoId, sess) {
  const d = { body: '', photos: [], ...(sess.data || {}) };
  const st = sess.state;
  if (st === 'n_details') {
    if (photoId) {
      if (d.photos.length >= 5) { await send(env, chatId, `5 photos max — send /done to continue, or /cancel.`); return true; }
      d.photos.push(photoId);
      if (text && text !== '/done') d.body += (d.body ? '\n' : '') + text;
      await setSess(env, from.id, 'n_details', d);
      await send(env, chatId, `Photo ${d.photos.length} saved. Send more text/photos, then /done — or /cancel.`);
      return true;
    }
    if (!text) return true;
    d.body += (d.body ? '\n' : '') + text;
    await setSess(env, from.id, 'n_details', d);
    await send(env, chatId, `Noted. Send more (text/photos), then /done — or /cancel.`);
    return true;
  }
  const val = text.trim();
  if (st === 'n_amount') {
    if (!/^\d+$/.test(val)) { await send(env, chatId, `Payment in ₹ as a plain number (e.g. 100).`); return true; }
    d.amount = +val;
    await setSess(env, from.id, 'n_needed', d);
    await send(env, chatId, `Workers needed (number)?`);
    return true;
  }
  if (st === 'n_needed') {
    if (!/^\d+$/.test(val) || +val < 1) { await send(env, chatId, `Workers needed as a number ≥ 1.`); return true; }
    d.needed = +val;
    await setSess(env, from.id, 'n_deadline', d);
    await send(env, chatId, `Deadline? (text, or - for none)`);
    return true;
  }
  if (st === 'n_deadline') {
    d.deadline = val === '-' ? '' : val;
    await setSess(env, from.id, 'n_age', d);
    await send(env, chatId, `Minimum Reddit account age in days? (0 = any, suggested 365)`);
    return true;
  }
  if (st === 'n_age') {
    if (!/^\d+$/.test(val)) { await send(env, chatId, `Number of days, 0 for any.`); return true; }
    d.minAge = +val;
    await setSess(env, from.id, 'n_karma', d);
    await send(env, chatId, `Minimum total karma? (0 = any, suggested 100)`);
    return true;
  }
  if (st === 'n_karma') {
    if (!/^\d+$/.test(val)) { await send(env, chatId, `Number, 0 for any.`); return true; }
    d.minKarma = +val;
    const firstLine = (d.body.split('\n').find(l => l.trim()) || 'Untitled task').slice(0, 80);
    const subm = d.body.match(/r\/([A-Za-z0-9_]+)/);
    const r = await env.DB.prepare(
      "INSERT INTO tasks (title, client, subreddit, content, instructions, amount, needed, deadline, image_ids, min_age_days, min_karma, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,'open',?)")
      .bind(firstLine, '', subm ? subm[1] : '', d.body, '', d.amount, d.needed, d.deadline || '', JSON.stringify(d.photos), d.minAge, d.minKarma, now()).run();
    await clearSess(env, from.id);
    const tid = r.meta.last_row_id;
    await send(env, chatId, `✅ Task #${tid} created. Checking who qualifies (age ≥ ${d.minAge}d, karma ≥ ${d.minKarma}, quality moderate+)…`);
    const qs = await qualifiedWorkers(env, d.minAge, d.minKarma);
    const all = (await env.DB.prepare("SELECT COUNT(*) c FROM workers WHERE status='approved'").first()).c;
    let sent = 0;
    for (const w of qs) {
      const ok = await send(env, w.tg_id,
        `📢 <b>New task available</b>\nTask: <b>${esc(firstLine)}</b>${subm ? `\nTarget: r/${esc(subm[1])}` : ''}\nPayment: <b>${inr(d.amount)}</b>\nWorkers needed: ${d.needed}`,
        { reply_markup: { inline_keyboard: [[{ text: '👁 View Task', callback_data: `w:view:${tid}` }]] } }).catch(() => null);
      if (ok && ok.ok !== false) {
        sent++;
        for (const fid of d.photos.slice(0, 5)) {
          await tg(env, 'sendPhoto', { chat_id: w.tg_id, photo: fid }).catch(() => {});
        }
      }
    }
    await send(env, chatId, `Notified <b>${sent}/${all}</b> approved workers — only qualifiers got it.`);
    return true;
  }
  return true;
}

// ================= CALLBACKS =================
async function onCb(env, cb) {
  const from = cb.from, chatId = cb.message?.chat?.id || from.id;
  const [ns, act, arg] = String(cb.data || '').split(':');
  const ack = (t = '') => answerCb(env, cb.id, t);

  if (ns === 'w') {
    if (act === 'rules') { await ack(); await cmdRules(env, chatId, from); return; }
    if (act === 'apply') {
      await ack();
      await setSess(env, from.id, 'await_reddit', {});
      await send(env, chatId, `📝 <b>Submit Reddit Profile + CQS</b>\n\n1. Send your Reddit username or public profile link (e.g. <code>u/someone</code>)\n2. + Send CQS screenshot photo\n\n${CQS_HOWTO}\n\n<i>We never ask for passwords or logins — username + screenshot only. Moderate-High / good karma preferred. Payment ₹150-₹500/post, only after post stays live 48 hours.</i>`);
      return;
    }
    if (act === 'tasks') { await ack(); await cmdTasks(env, chatId, from); return; }
    if (act === 'profile') { await ack(); await cmdProfile(env, chatId, from); return; }
    if (act === 'view' && arg) {
      await ack();
      const t = await env.DB.prepare('SELECT * FROM tasks WHERE id=?').bind(+arg).first();
      if (!t || t.status !== 'open') { await send(env, chatId, `That task is closed.`); return; }
      await send(env, chatId,
        `📌 <b>${esc(t.title)}</b>${t.client ? `\nClient: ${esc(t.client)}` : ''}${t.subreddit ? `\nTarget: r/${esc(t.subreddit)}` : ''}\nPayment: <b>${inr(t.amount)}</b>${t.deadline ? `\nDeadline: ${esc(t.deadline)}` : ''}\n\n<b>Details:</b>\n${esc(t.content)}${t.instructions ? `\n\n<i>${esc(t.instructions)}</i>` : ''}${t.subreddit ? `\n\n⚠️ <i>You are responsible for checking and following the rules of r/${esc(t.subreddit)} before posting.</i>` : `\n\n⚠️ <i>Post only where the community rules allow this kind of content.</i>`}\n\n💰 Payment <b>${inr(t.amount)}</b> (range ₹150-₹500 as per requirement) — NOT instant, only after post stays live 48 hours.\n🚫 Posting out of nowhere can trigger spam filters / ban. Read subreddit rules first. Using a secondary account is safer.`,
        { reply_markup: { inline_keyboard: [[{ text: '✅ Accept Task', callback_data: `w:accept:${t.id}` }]] } });
      try {
        for (const fid of JSON.parse(t.image_ids || '[]').slice(0, 5)) {
          await tg(env, 'sendPhoto', { chat_id: chatId, photo: fid }).catch(() => {});
        }
      } catch {}
      return;
    }
    if (act === 'accept' && arg) {
      const tid = +arg;
      const st = await workerStatus(env, from.id);
      if (st !== 'approved') { await ack('Not eligible.'); return; }
      const t = await env.DB.prepare('SELECT * FROM tasks WHERE id=?').bind(tid).first();
      if (!t || t.status !== 'open') { await ack('Task closed.'); return; }
      const mine = await env.DB.prepare('SELECT id FROM assignments WHERE task_id=? AND tg_id=?').bind(tid, from.id).first();
      if (mine) { await ack('Already accepted.'); return; }
      const n = await env.DB.prepare("SELECT COUNT(*) c FROM assignments WHERE task_id=? AND status IN ('accepted','submitted','completed')").bind(tid).first();
      if (n.c >= t.needed) { await ack('Slots full.'); await send(env, chatId, `All ${t.needed} slots for #${tid} are taken.`); return; }
      await env.DB.prepare("INSERT INTO assignments (task_id, tg_id, tg_username, status, created_at) VALUES (?,?,?,'accepted',?)")
        .bind(tid, from.id, from.username || '', now()).run();
      if (n.c + 1 >= t.needed) await env.DB.prepare("UPDATE tasks SET status='closed' WHERE id=?").bind(tid).run();
      await ack('Assigned ✓');
      await send(env, chatId,
        `✅ <b>Task assigned.</b>\n\nComplete it per the instructions and the rules of r/${esc(t.subreddit)}.\n\n⚠️ Check r/${esc(t.subreddit)} rules before posting. Posting out of nowhere can look like spam and get you banned. Secondary account is safer.\n\n💰 Payment ${inr(t.amount)} is NOT instant — post must stay live at least 48 hours.\n\nAfter completing it, submit the Reddit post link here.`,
        { reply_markup: { inline_keyboard: [[{ text: '📤 Submit Reddit Post', callback_data: `w:submit:${tid}` }]] } });
      return;
    }
    if (act === 'submit' && arg) {
      await ack();
      await setSess(env, from.id, 'await_postlink', { task_id: +arg });
      await send(env, chatId, `Please send the <b>public Reddit post link</b> for task #${arg}.`);
      return;
    }
    await ack();
    return;
  }

  // ---- admin callbacks ----
  if (ns === 'a') {
    if (!isAdmin(env, from.id)) { await ack('Admins only.'); return; }
    if (act === 'apps') { await ack(); await listApps(env, chatId); return; }
    if (act === 'app_ok' && arg) {
      await ack('Approved ✓');
      const a = await env.DB.prepare('SELECT * FROM applications WHERE id=?').bind(+arg).first();
      if (!a || a.status !== 'pending') { await send(env, chatId, `Already decided.`); return; }
      await env.DB.prepare("UPDATE applications SET status='approved', decided_at=? WHERE id=?").bind(now(), a.id).run();
      await env.DB.prepare("INSERT INTO workers (tg_id, tg_username, reddit_user, status, created_at) VALUES (?,?,?,?,?) ON CONFLICT(tg_id) DO UPDATE SET tg_username=excluded.tg_username, reddit_user=excluded.reddit_user, status='approved'")
        .bind(a.tg_id, a.tg_username, a.reddit_user, now()).run();
      const wrow = await env.DB.prepare('SELECT * FROM workers WHERE tg_id=?').bind(a.tg_id).first();
      const s0 = wrow ? statsOf(wrow) : { age: 0, karma: 0, tier: 'low' };
      await send(env, a.tg_id, `✅ <b>Your application has been approved.</b>\n\nYour profile: ${s0.age}-day-old account • ${s0.karma} karma • quality tier ${s0.tier}.\n\nYou are now eligible to receive available tasks.\n\nBefore completing any task, make sure you understand the instructions and follow the rules of the target Reddit community.`);
      await send(env, chatId, `Application #${a.id} approved. Worker notified.`);
      return;
    }
    if (act === 'app_no' && arg) {
      await ack('Rejected.');
      const a = await env.DB.prepare('SELECT * FROM applications WHERE id=?').bind(+arg).first();
      if (!a || a.status !== 'pending') { await send(env, chatId, `Already decided.`); return; }
      await env.DB.prepare("UPDATE applications SET status='rejected', decided_at=? WHERE id=?").bind(now(), a.id).run();
      await env.DB.prepare("INSERT INTO workers (tg_id, tg_username, reddit_user, status, created_at) VALUES (?,?,?,'rejected',?) ON CONFLICT(tg_id) DO UPDATE SET status='rejected'")
        .bind(a.tg_id, a.tg_username, a.reddit_user, now()).run();
      await send(env, a.tg_id, `Your application was not approved at this time.\n\nThank you for applying.`);
      await send(env, chatId, `Application #${a.id} rejected. Worker notified.`);
      return;
    }
    if (act === 'subs') {
      await ack();
      const rows = (await env.DB.prepare(
        "SELECT a.*, t.title, t.amount FROM assignments a JOIN tasks t ON t.id=a.task_id WHERE a.status='submitted' ORDER BY a.submitted_at DESC LIMIT 10").all()).results;
      if (!rows.length) { await send(env, chatId, `No pending submissions. 🎉`); return; }
      for (const s of rows) {
        await send(env, chatId,
          `<b>🔍 Submission — assignment #${s.id}</b>\nWorker: @${esc(s.tg_username || '?')} (<code>${s.tg_id}</code>)\nTask: <b>${esc(s.title)}</b> (#${s.task_id})\nPost: ${esc(s.post_link)}\nPayment: <b>${inr(s.amount)}</b>\nSubmitted: ${date(s.submitted_at)}\n\n<i>Open the post, check it against instructions + subreddit rules, then decide.</i>`,
          { reply_markup: { inline_keyboard: [[
            { text: '✅ Approve', callback_data: `a:sub_ok:${s.id}` },
            { text: '❌ Reject', callback_data: `a:sub_no:${s.id}` },
          ]]} });
      }
      return;
    }
    if (act === 'sub_ok' && arg) {
      await ack('Verified ✓');
      const s = await env.DB.prepare('SELECT a.*, t.amount, t.title FROM assignments a JOIN tasks t ON t.id=a.task_id WHERE a.id=?').bind(+arg).first();
      if (!s || s.status !== 'submitted') { await send(env, chatId, `Already handled.`); return; }
      await env.DB.prepare("UPDATE assignments SET status='completed', verified_at=? WHERE id=?").bind(now(), s.id).run();
      await env.DB.prepare("INSERT INTO payments (assignment_id, task_id, tg_id, amount, status, created_at) VALUES (?,?,?,?,'pending',?)")
        .bind(s.id, s.task_id, s.tg_id, s.amount, now()).run();
      const told = await send(env, s.tg_id, `✅ <b>Your task has been verified successfully.</b>\n\nPayment: <b>${inr(s.amount)}</b>\nPayment status: Pending.`);
      await send(env, chatId, told && told.ok === false
        ? `Submission #${s.id} approved → payment ${inr(s.amount)} set to Pending. ⚠️ Worker notify FAILED — message them manually.`
        : `Submission #${s.id} approved → payment ${inr(s.amount)} set to Pending.`);
      return;
    }
    if (act === 'sub_no' && arg) {
      await ack();
      await setSess(env, from.id, 'await_reject_reason', { assignment_id: +arg });
      await send(env, chatId, `Send the rejection reason for submission #${arg} (or - for none).`);
      return;
    }
    if (act === 'pays') {
      await ack();
      const rows = (await env.DB.prepare(
        "SELECT p.*, t.title FROM payments p JOIN tasks t ON t.id=p.task_id WHERE p.status='pending' ORDER BY p.id DESC LIMIT 15").all()).results;
      if (!rows.length) { await send(env, chatId, `No pending payments. 🎉`); return; }
      for (const p of rows) {
        await send(env, chatId,
          `<b>💰 Payment #${p.id}</b>\nWorker: <code>${p.tg_id}</code>\nTask: <b>${esc(p.title)}</b> (#${p.task_id})\nAmount: <b>${inr(p.amount)}</b>\nStatus: Pending\n\n<i>Pay via UPI in your own app first — the bot cannot move money.</i>`,
          { reply_markup: { inline_keyboard: [[{ text: '✅ Mark Paid', callback_data: `a:pay_ok:${p.id}` }]] } });
      }
      return;
    }
    if (act === 'pay_ok' && arg) {
      await ack('Paid ✓');
      const p = await env.DB.prepare('SELECT * FROM payments WHERE id=?').bind(+arg).first();
      if (!p || p.status !== 'pending') { await send(env, chatId, `Already handled.`); return; }
      await env.DB.prepare("UPDATE payments SET status='paid', paid_at=? WHERE id=?").bind(now(), p.id).run();
      await send(env, p.tg_id, `💰 <b>Payment completed.</b>\n\nTask: #${p.task_id}\nAmount: <b>${inr(p.amount)}</b>\nStatus: Paid.`);
      await send(env, chatId, `Payment #${p.id} marked Paid. Worker notified.`);
      return;
    }
    if (act === 'new') {
      await ack();
      await setSess(env, from.id, 'n_details', {});
      await send(env, chatId, `➕ <b>New task.</b>\n\nSend <b>everything in one go</b> — title, client, subreddit, content, instructions, as one or more messages. Attach reference <b>photos</b> too if needed.\n\nWhen finished, send /done (or /cancel).`);
      return;
    }
    if (act === 'workers') {
      await ack();
      const rows = (await env.DB.prepare('SELECT * FROM workers ORDER BY created_at DESC LIMIT 15').all()).results;
      if (!rows.length) { await send(env, chatId, `No workers yet.`); return; }
      for (const w of rows) {
        await send(env, chatId,
          `👤 @${esc(w.tg_username || '?')} (<code>${w.tg_id}</code>)\nReddit: ${w.reddit_user ? `u/${esc(w.reddit_user)}` : `📷 screenshot`} • <b>${w.status}</b>`,
          w.status === 'approved'
            ? { reply_markup: { inline_keyboard: [[{ text: '⛔ Suspend', callback_data: `a:susp:${w.tg_id}` }]] } }
            : {});
      }
      return;
    }
    if (act === 'susp' && arg) {
      await ack('Suspended.');
      await env.DB.prepare("UPDATE workers SET status='suspended' WHERE tg_id=?").bind(+arg).run();
      await send(env, +arg, `Your worker access has been suspended. Contact the admin if you think this is a mistake.`);
      await send(env, chatId, `Worker <code>${arg}</code> suspended.`);
      return;
    }
    await ack();
    return;
  }
  await ack();
}

// ================= MESSAGES =================
async function onMsg(env, msg) {
  const from = msg.from, chatId = msg.chat.id, text = (msg.text || msg.caption || '').trim();
  const photoId = msg.photo && msg.photo.length ? msg.photo[msg.photo.length - 1].file_id : null;
  if (!text && !photoId) return;
  const admin = isAdmin(env, from.id);

  if (text.startsWith('/')) {
    const cmd = text.split(' ')[0].split('@')[0];
    if (admin && (cmd === '/done' || cmd === '/cancel')) {
      const s0 = await getSess(env, from.id);
      if (s0.state && s0.state.startsWith('n_')) {
        if (cmd === '/cancel') { await clearSess(env, from.id); return send(env, chatId, `Task creation cancelled.`); }
        const d0 = { body: '', photos: [], ...(s0.data || {}) };
        if (!d0.body && !d0.photos.length) return send(env, chatId, `Nothing yet — send the work details first (text/photos), then /done.`);
        if (photoId && !d0.photos.includes(photoId)) d0.photos.push(photoId);
        await setSess(env, from.id, 'n_amount', d0);
        return send(env, chatId, `Got it. Payment in ₹ (plain number)?`);
      }
    }
    await clearSess(env, from.id);
    if (cmd === '/start') return cmdStart(env, chatId, from);
    if (cmd === '/rules') { await clearSess(env, from.id); return cmdRules(env, chatId, from); }
    if (cmd === '/help') return send(env, chatId, HELP + (admin ? `\n\n<b>Admin:</b> /admin /createtask` : ''));
    if (cmd === '/profile') return cmdProfile(env, chatId, from);
    if (cmd === '/tasks') return cmdTasks(env, chatId, from);
    if (cmd === '/mytasks') return cmdMyTasks(env, chatId, from);
    if (cmd === '/payments') return cmdPayments(env, chatId, from);
    if (cmd === '/admin') {
      if (!admin) return send(env, chatId, `Admins only.`);
      return cmdAdmin(env, chatId);
    }
    if (cmd === '/createtask') {
      if (!admin) return send(env, chatId, `Admins only.`);
      await setSess(env, from.id, 'n_details', {});
      return send(env, chatId, `➕ <b>New task.</b>\n\nSend <b>everything in one go</b> — title, client, subreddit, content, instructions, as one or more messages. Attach reference <b>photos</b> too if needed.\n\nWhen finished, send /done (or /cancel).`);
    }
    return send(env, chatId, `Unknown command. Try /help.`);
  }

  const sess = await getSess(env, from.id);
  if (sess.state === 'await_reddit') {
    const prev = sess.data || {};
    const user = parseReddit(text) || prev.reddit_user || '';
    const cqsPhoto = photoId || prev.cqs_file_id || '';
    if (!user && !cqsPhoto) { await send(env, chatId, `Couldn't read that. Send like <code>u/someone</code> or full profile link, plus your CQS screenshot photo.\\n\\n` + CQS_HOWTO); return; }
    if (!user) {
      await setSess(env, from.id, 'await_reddit', { cqs_file_id: cqsPhoto });
      await send(env, chatId, `Got your screenshot. Now send your Reddit username / profile link (e.g. <code>u/someone</code>).`);
      return;
    }
    if (!cqsPhoto) {
      await setSess(env, from.id, 'await_cqs', { reddit_user: user });
      await send(env, chatId, `Got u/${esc(user)}. Now send your <b>CQS screenshot</b>.\\n\\n` + CQS_HOWTO);
      return;
    }
    const proofType = 'screenshot';
    const info0 = user ? await redditInfo(user) : null;
    await env.DB.prepare("INSERT INTO applications (tg_id, tg_username, reddit_user, proof_type, proof_file_id, status, created_at) VALUES (?,?,?,?,?,'pending',?)")
      .bind(from.id, from.username || '', user || '', proofType, cqsPhoto || '', now()).run();
    await env.DB.prepare("INSERT INTO workers (tg_id, tg_username, reddit_user, reddit_created, link_karma, comment_karma, status, created_at) VALUES (?,?,?,?,?,?,'pending',?) ON CONFLICT(tg_id) DO UPDATE SET tg_username=excluded.tg_username, reddit_user=excluded.reddit_user, reddit_created=excluded.reddit_created, link_karma=excluded.link_karma, comment_karma=excluded.comment_karma, status='pending'")
      .bind(from.id, from.username || '', user || '', info0 ? info0.createdUtc : 0, info0 ? info0.linkN : 0, info0 ? info0.commentN : 0, now()).run();
    await clearSess(env, from.id);
    await send(env, chatId, `Your application (u/${esc(user)} + CQS screenshot) has been submitted successfully.\\n\\nOur team will review your profile and get back to you here.`);
    for (const aid of String(env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean)) {
      const info = info0;
      const rline = user
        ? `Reddit: u/${esc(user)} — https://www.reddit.com/user/${encodeURIComponent(user)}\n${info ? `Age: ${info.created} • karma ${info.link}/${info.comment} • quality-proxy: ${cqsTier(info.createdUtc ? Math.floor((now() - info.createdUtc) / 86400) : 0, info.linkN + info.commentN)}` : `Reddit info unavailable — check manually.`} \nCQS: screenshot attached (verify manually in r/whatismycqs style).`
        : `Reddit: screenshot only (private profile)`;
      const body = `📥 <b>New application</b>\nTelegram: @${esc(from.username || '?')} (<code>${from.id}</code>)\n${rline}\n\nUse /admin → Applications to decide.`;
      if (cqsPhoto) {
        await tg(env, 'sendPhoto', { chat_id: +aid, photo: cqsPhoto, caption: body.slice(0, 1000), parse_mode: 'HTML' }).catch(() => {});
      } else {
        await send(env, +aid, body).catch(() => {});
      }
    }
    return;
  }
  if (sess.state === 'await_cqs') {
    if (!photoId) { await send(env, chatId, `Please send your <b>CQS screenshot photo</b> now.\\n\\n` + CQS_HOWTO); return; }
    const user2 = (sess.data && sess.data.reddit_user) || parseReddit(text) || '';
    if (!user2) { await clearSess(env, from.id); await send(env, chatId, `Session expired. Tap Submit Reddit Profile again.`); return; }
    const info0b = await redditInfo(user2);
    await env.DB.prepare("INSERT INTO applications (tg_id, tg_username, reddit_user, proof_type, proof_file_id, status, created_at) VALUES (?,?,?,?,?,'pending',?)")
      .bind(from.id, from.username || '', user2, 'screenshot', photoId, now()).run();
    await env.DB.prepare("INSERT INTO workers (tg_id, tg_username, reddit_user, reddit_created, link_karma, comment_karma, status, created_at) VALUES (?,?,?,?,?,?,'pending',?) ON CONFLICT(tg_id) DO UPDATE SET tg_username=excluded.tg_username, reddit_user=excluded.reddit_user, reddit_created=excluded.reddit_created, link_karma=excluded.link_karma, comment_karma=excluded.comment_karma, status='pending'")
      .bind(from.id, from.username || '', user2, info0b ? info0b.createdUtc : 0, info0b ? info0b.linkN : 0, info0b ? info0b.commentN : 0, now()).run();
    await clearSess(env, from.id);
    await send(env, chatId, `Your application (u/${esc(user2)} + CQS screenshot) has been submitted successfully.\\n\\nOur team will review your profile and get back to you here.`);
    for (const aid of String(env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean)) {
      const body2 = `📥 <b>New application</b>\nTelegram: @${esc(from.username || '?')} (<code>${from.id}</code>)\nReddit: u/${esc(user2)} — https://www.reddit.com/user/${encodeURIComponent(user2)}\nCQS: screenshot attached.\n\nUse /admin → Applications to decide.`;
      await tg(env, 'sendPhoto', { chat_id: +aid, photo: photoId, caption: body2.slice(0, 1000), parse_mode: 'HTML' }).catch(() => {});
    }
    return;
  }
  if (sess.state === 'await_postlink') {
    if (!/reddit\.com\/r\/.+\/comments\//i.test(text)) {
      await send(env, chatId, `That doesn't look like a Reddit post link. It should look like:\n<code>https://www.reddit.com/r/sub/comments/abc123/title/</code>`);
      return;
    }
    const a = await env.DB.prepare('SELECT * FROM assignments WHERE task_id=? AND tg_id=?').bind(sess.data.task_id, from.id).first();
    if (!a || a.status !== 'accepted') { await clearSess(env, from.id); await send(env, chatId, `No active assignment for that task.`); return; }
    await env.DB.prepare("UPDATE assignments SET post_link=?, status='submitted', submitted_at=? WHERE id=?").bind(text, now(), a.id).run();
    await clearSess(env, from.id);
    await send(env, chatId, `✅ <b>Your submission has been received.</b>\n\nIt is now waiting for verification.`);
    for (const aid of String(env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean)) {
      const t = await env.DB.prepare('SELECT * FROM tasks WHERE id=?').bind(a.task_id).first();
      await send(env, +aid,
        `🔍 <b>New submission to verify</b> — assignment #${a.id}\nWorker: @${esc(a.tg_username || '?')} (<code>${a.tg_id}</code>)\nTask: <b>${esc(t.title)}</b> (#${t.id}) • ${inr(t.amount)}\nPost: ${esc(text)}\n\nUse /admin → Submissions.`).catch(() => {});
    }
    return;
  }
  if (sess.state && sess.state.startsWith('n_') && admin) return newTaskFlow(env, chatId, from, text, photoId, sess);
  if (sess.state === 'await_reject_reason' && admin) {
    const reason = text === '-' ? '' : text;
    const a = await env.DB.prepare('SELECT * FROM assignments WHERE id=?').bind(sess.data.assignment_id).first();
    await clearSess(env, from.id);
    if (!a || a.status !== 'submitted') { await send(env, chatId, `Already handled.`); return; }
    await env.DB.prepare('UPDATE assignments SET status=?, reject_reason=? WHERE id=?').bind('rejected', reason, a.id).run();
    await send(env, a.tg_id,
      `Your submission for Task #${a.task_id} was not approved.${reason ? `\n\nReason:\n${esc(reason)}` : ''}`);
    await send(env, chatId, `Submission #${a.id} rejected. Worker notified.`);
    return;
  }
  await send(env, chatId, `Send /start for the menu, or /help for commands.`);
}

export default {
  async fetch(req, env) {
    // Health check
    if (req.method === 'GET') return new Response('SetupKaro Tasks bot alive ✓', { status: 200 });
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    let update;
    try { update = await req.json(); }
    catch (e) { console.error('Invalid Telegram JSON:', e); return new Response('Invalid JSON', { status: 400 }); }
    try {
      console.log('Telegram update received:', JSON.stringify(update).slice(0, 500));
      if (update.callback_query) await onCb(env, update.callback_query);
      else if (update.message) await onMsg(env, update.message);
    } catch (e) {
      console.error('Telegram update error:', e);
      return new Response('Internal error', { status: 500 });
    }
    return new Response('ok', { status: 200 });
  },
};
