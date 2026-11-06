import { NextResponse } from 'next/server';
import { admin, deviceId, clientIp, hit, peek, LIMITS } from '@/lib/server';
import { ANALYSIS_PROMPT, SHORT_PROMPT, COACH_PROMPT, WEIGHTS, tierFor, DISTRESS } from '@/lib/prompts';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
const J = (o, status = 200) => NextResponse.json(o, { status });
const E = (status, error, extra) => J({ error, ...extra }, status);
const PHOTO_DAYS = 7;
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const limited = (r, what) => E(429, `You've reached today's limit of ${r.max} ${what}. It resets ${new Date(r.reset).toUTCString().slice(17, 22)} UTC.`, { limit: r });

function mockReply(system) {
  if (system.includes('Coach Vee')) return 'Start with sleep and a daily SPF. Your skin scores lowest. Next step: apply SPF 30 tomorrow morning.';
  const f = {};
  Object.keys(WEIGHTS).forEach((k, i) => { f[k] = { score: 4.5 + ((i * 7) % 30) / 10, verdict: `Mock verdict for ${k}.` }; });
  const cats = ['grooming', 'skincare', 'hair', 'fitness', 'posture', 'style', 'habits', 'skincare'];
  return JSON.stringify({
    potential_score: 7.2, summary: 'Mock result for testing.', feature_scores: f,
    face_profile: { face_shape: 'oval', eye_type: 'almond', canthal_tilt: 'neutral', jaw_type: 'soft', skin_type: 'normal' },
    strengths: ['Mock strength one', 'Mock strength two', 'Mock strength three'],
    weaknesses: ['Mock weakness one', 'Mock weakness two', 'Mock weakness three'],
    plan: cats.map((c, i) => ({ category: c, title: `Mock action ${i + 1}`, reason: 'Mock reason.', effort: 'low', impact: 'medium', time_to_result: '4 weeks', priority: i + 1 })),
  });
}

async function groq(system, messages, max = 2500) {
  if (process.env.MOCK_AI === 'true') return mockReply(system);
  if (!process.env.GROQ_API_KEY || !process.env.GROQ_MODEL) throw new Error('GROQ_API_KEY and GROQ_MODEL must be configured.');
  const groqMessages = messages.map(message => ({
    role: message.role,
    content: Array.isArray(message.content) ? message.content.map(part => part.type === 'image'
      ? { type: 'image_url', image_url: { url: `data:${part.source.media_type};base64,${part.source.data}` } }
      : { type: 'text', text: part.text }) : message.content,
  }));
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: process.env.GROQ_MODEL, max_tokens: max, messages: [{ role: 'system', content: system }, ...groqMessages] }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Groq request failed (${r.status}): ${j.error?.message || 'Please try again.'}`);
  return j.choices?.[0]?.message?.content || '';
}
const parse = t => { try { return JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); } catch { return null; } };
const valid = r => r && (r.error || (r.feature_scores && Object.keys(WEIGHTS).every(k => typeof r.feature_scores[k]?.score === 'number') && Array.isArray(r.plan)));
const clamp = n => Math.max(0, Math.min(10, Number(n) || 0));

async function profileReady(db, dev) {
  const { data: p } = await db.from('profiles').select('*').eq('device_id', dev).maybeSingle();
  return p?.consent_at && p.age_confirmed ? p : null;
}

// Step 1 of a scan: create a pending scan row.
async function startScan(db, dev, ip) {
  if (!(await profileReady(db, dev))) return E(403, 'Confirm your age and consent before scanning.');
  const left = await peek('scan', ip);
  if (left.remaining <= 0) return limited(left, LIMITS.scan.label);
  const up = await hit('upload', ip);
  if (!up.ok) return limited(up, LIMITS.upload.label);
  const { data, error } = await db.from('scans').insert({ device_id: dev, status: 'pending' }).select('id').single();
  if (error) return E(500, 'Could not start the scan. Try again.');
  return J({ id: data.id });
}

// Step 2: the app sends each photo (already resized on the device) as the raw request body.
const MAX_PHOTO = 4 * 1024 * 1024;
async function uploadPhoto(db, dev, req, url) {
  const id = url.searchParams.get('id'), k = url.searchParams.get('k');
  if (!['front', 'side'].includes(k)) return E(400, 'Unknown photo slot.');
  const type = (req.headers.get('content-type') || '').split(';')[0].trim().replace('image/jpg', 'image/jpeg');
  if (!TYPES[type]) return E(400, 'Use a JPG, PNG or WEBP photo.');
  const { data: scan } = await db.from('scans').select('id,status').eq('id', id || '00000000-0000-0000-0000-000000000000').eq('device_id', dev).maybeSingle();
  if (!scan || scan.status !== 'pending') return E(404, 'Scan not found. Start a new scan.');
  const buf = Buffer.from(await req.arrayBuffer());
  if (!buf.length) return E(400, 'The photo was empty. Pick it again.');
  if (buf.length > MAX_PHOTO) return E(413, 'Photo is too large. Pick a smaller photo.');
  const path = `${dev}/${scan.id}-${k}.${TYPES[type]}`;
  const { error } = await db.storage.from('photos').upload(path, buf, { contentType: type, upsert: true });
  if (error) return E(500, 'Photo upload failed. Try again.');
  await db.from('scans').update({ [`${k}_path`]: path }).eq('id', scan.id);
  return J({ ok: true });
}

// Step 2: analyze the uploaded photos. Only a successful analysis uses one of the day's scans.
async function analyze(db, dev, ip, b) {
  const p = await profileReady(db, dev);
  if (!p) return E(403, 'Confirm your age and consent before scanning.');
  const { data: scan } = await db.from('scans').select('id,status,front_path,side_path').eq('id', b.id || '00000000-0000-0000-0000-000000000000').eq('device_id', dev).maybeSingle();
  if (!scan) return E(404, 'Scan not found. Start a new scan.');
  if (scan.status === 'complete') return J({ id: scan.id });
  if (!scan.front_path || !scan.side_path) return E(400, 'Photo upload did not finish. Retake your photos and try again.');
  const left = await peek('scan', ip);
  if (left.remaining <= 0) return limited(left, LIMITS.scan.label);
  const tries = await hit('analyze', ip);
  if (!tries.ok) return limited(tries, LIMITS.analyze.label);
  const imgs = [];
  for (const path of [scan.front_path, scan.side_path]) {
    const { data } = await db.storage.from('photos').download(path);
    if (!data) return E(400, 'Photo upload did not finish. Retake your photos and try again.');
    imgs.push({ type: 'image', source: { type: 'base64', media_type: data.type || 'image/jpeg', data: Buffer.from(await data.arrayBuffer()).toString('base64') } });
  }
  const ctx = { type: 'text', text: `Image 1 is the front photo. Image 2 is the side profile. Gender: ${p.gender}. Age range: ${p.age_range}. Goal: ${p.main_goal}.` };
  let res = null;
  for (const sys of [ANALYSIS_PROMPT, SHORT_PROMPT]) {
    try {
      res = parse(await groq(sys, [{ role: 'user', content: [...imgs, ctx] }]));
      if (valid(res)) break;
      res = null;
    } catch (e) { return E(502, `Face analysis failed: ${e.message} This did not use a scan.`); }
  }
  if (!res) return E(502, 'Analysis failed. This did not use a scan. Try again or retake your photos.');
  if (res.error) return E(422, `${res.error} This did not use a scan.`);
  let overall = 0;
  for (const k in WEIGHTS) { res.feature_scores[k].score = clamp(res.feature_scores[k].score); overall += WEIGHTS[k] * res.feature_scores[k].score; }
  overall = Math.round(overall * 10) / 10;
  const [tier, psl] = tierFor(overall);
  await db.from('scans').update({
    status: 'complete', overall, potential: clamp(res.potential_score), tier, psl, created_at: new Date().toISOString(),
    result: { summary: res.summary, feature_scores: res.feature_scores, face_profile: res.face_profile, strengths: res.strengths, weaknesses: res.weaknesses },
  }).eq('id', scan.id);
  const plan = res.plan.slice(0, 12).map((x, i) => ({ scan_id: scan.id, device_id: dev, category: x.category, title: x.title, reason: x.reason, effort: x.effort, impact: x.impact, time_to_result: x.time_to_result, priority: x.priority || i + 1 }));
  await db.from('plan_items').insert(plan);
  await hit('scan', ip);
  return J({ id: scan.id });
}

async function getScan(db, dev, id) {
  let q = db.from('scans').select('*').eq('device_id', dev).eq('status', 'complete');
  q = id ? q.eq('id', id) : q.order('created_at', { ascending: false }).limit(1);
  const { data: s } = await q.maybeSingle();
  if (!s) return J({ scan: null });
  const { data: plan } = await db.from('plan_items').select('*').eq('scan_id', s.id).order('priority');
  return J({ scan: { id: s.id, created_at: s.created_at, overall_score: Number(s.overall), tier_label: s.tier, psl_tier: s.psl, potential_score: s.potential == null ? null : Number(s.potential), photos_deleted: !s.front_path, ...s.result, plan: plan || [] } });
}

async function coach(db, dev, ip, b) {
  const text = String(b.message || '').trim().slice(0, 1000);
  if (!text) return E(400, 'Type a message first.');
  const { data: s } = await db.from('scans').select('*').eq('device_id', dev).eq('status', 'complete').order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!s) return E(400, 'Run a scan first. Coach Vee uses your results.');
  const r = await hit('coach', ip);
  if (!r.ok) return limited(r, LIMITS.coach.label);
  const [{ data: plan }, { data: p }, { data: hist }] = await Promise.all([
    db.from('plan_items').select('title,category,completed').eq('scan_id', s.id),
    db.from('profiles').select('gender,age_range,main_goal').eq('device_id', dev).maybeSingle(),
    db.from('chat_messages').select('role,content').eq('device_id', dev).order('created_at', { ascending: false }).limit(10),
  ]);
  const context = JSON.stringify({ overall: s.overall, tier: s.tier, ...s.result, open_plan: (plan || []).filter(x => !x.completed), profile: p });
  const system = `${COACH_PROMPT}\n\nUser data: ${context}${DISTRESS.test(text) ? '\n\nThe user may be distressed. Be supportive, not blunt.' : ''}`;
  const messages = [...(hist || []).reverse().map(m => ({ role: m.role, content: m.content })), { role: 'user', content: text }];
  let reply;
  try { reply = (await groq(system, messages, 500)) || 'Coach Vee is offline. Try again in a minute.'; }
  catch (e) { return E(502, `Coach Vee is unavailable: ${e.message}`); }
  await db.from('chat_messages').insert([{ device_id: dev, scan_id: s.id, role: 'user', content: text }, { device_id: dev, scan_id: s.id, role: 'assistant', content: reply }]);
  return J({ reply, remaining: r.remaining });
}

async function removePhotos(db, rows) {
  const files = rows.flatMap(s => [s.front_path, s.side_path]).filter(Boolean);
  for (let i = 0; i < files.length; i += 500) await db.storage.from('photos').remove(files.slice(i, i + 500));
}

// Daily job (vercel.json). Deletes photos 7 days after each scan, abandoned uploads after a day, and old rate-limit counters.
async function cron(db) {
  const weekAgo = new Date(Date.now() - PHOTO_DAYS * 864e5).toISOString();
  const dayAgo = new Date(Date.now() - 864e5).toISOString();
  let photos = 0;
  for (;;) {
    const { data } = await db.from('scans').select('id,front_path,side_path').lt('created_at', weekAgo).not('front_path', 'is', null).limit(500);
    if (!data?.length) break;
    await removePhotos(db, data);
    await db.from('scans').update({ front_path: null, side_path: null }).in('id', data.map(r => r.id));
    photos += data.length;
  }
  const { data: stale } = await db.from('scans').select('id,front_path,side_path').eq('status', 'pending').lt('created_at', dayAgo).limit(1000);
  if (stale?.length) { await removePhotos(db, stale); await db.from('scans').delete().in('id', stale.map(r => r.id)); }
  await db.from('rate_limits').delete().lt('expires_at', new Date().toISOString());
  return J({ photos_deleted: photos, abandoned_removed: stale?.length || 0 });
}

async function handle(req, ctx, method) {
  const [a, b] = ctx.params.path;
  const db = admin();
  if (a === 'cron') {
    if (!process.env.CRON_SECRET || req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return E(401, 'Unauthorized');
    return cron(db);
  }
  const dev = deviceId(req);
  if (!dev) return E(400, 'Missing device id. Reload the app.');
  const ip = clientIp(req);
  try {
    const burst = await hit('burst', ip);
    if (!burst.ok) return E(429, 'Too many requests. Wait a minute and try again.');
    const url = new URL(req.url);
    const route = `${method} ${a}${b ? '/' + b : ''}`;
    if (route === 'POST scan/photo') return uploadPhoto(db, dev, req, url);
    const body = method === 'POST' ? await req.json().catch(() => ({})) : {};
    switch (route) {
      case 'GET me': {
        const [{ data: profile }, scan, coachLeft] = await Promise.all([
          db.from('profiles').select('gender,age_range,main_goal,onboarded').eq('device_id', dev).maybeSingle(),
          peek('scan', ip), peek('coach', ip),
        ]);
        return J({ profile, limits: { scan, coach: coachLeft }, photo_days: PHOTO_DAYS });
      }
      case 'POST profile': {
        if (!body.age_confirmed || !body.consent_accepted) return E(400, 'Confirm your age and consent to continue.');
        await db.from('profiles').upsert({ device_id: dev, gender: body.gender, age_range: body.age_range, main_goal: body.main_goal, age_confirmed: true, consent_at: new Date().toISOString(), onboarded: true });
        return J({ ok: true });
      }
      case 'POST settings': {
        const patch = {};
        for (const k of ['gender', 'age_range', 'main_goal']) if (typeof body[k] === 'string') patch[k] = body[k].slice(0, 40);
        await db.from('profiles').update(patch).eq('device_id', dev);
        return J({ ok: true });
      }
      case 'POST scan/start': return startScan(db, dev, ip);
      case 'POST analyze': return analyze(db, dev, ip, body);
      case 'GET scan': return getScan(db, dev, url.searchParams.get('id'));
      case 'GET scans': {
        const { data } = await db.from('scans').select('id,created_at,overall,tier,front_path').eq('device_id', dev).eq('status', 'complete').order('created_at', { ascending: false }).limit(100);
        const list = await Promise.all((data || []).map(async s => ({ id: s.id, created_at: s.created_at, overall: Number(s.overall), tier: s.tier, thumb: s.front_path ? (await db.storage.from('photos').createSignedUrl(s.front_path, 3600)).data?.signedUrl || null : null })));
        return J({ scans: list });
      }
      case 'POST plan/toggle': {
        await db.from('plan_items').update({ completed: !!body.completed }).eq('id', body.id).eq('device_id', dev);
        return J({ ok: true });
      }
      case 'GET chat': {
        const { data } = await db.from('chat_messages').select('role,content').eq('device_id', dev).order('created_at').limit(100);
        return J({ messages: data || [] });
      }
      case 'POST coach': return coach(db, dev, ip, body);
      case 'POST delete': {
        const { data } = await db.from('scans').select('id,front_path,side_path').eq('device_id', dev);
        await removePhotos(db, data || []);
        await db.from('scans').update({ front_path: null, side_path: null }).eq('device_id', dev);
        if (body.mode === 'all') for (const t of ['plan_items', 'chat_messages', 'scans', 'profiles']) await db.from(t).delete().eq('device_id', dev);
        return J({ ok: true });
      }
    }
    return E(404, 'Not found');
  } catch (e) {
    return E(500, e.message || 'Something went wrong.');
  }
}
export const GET = (r, c) => handle(r, c, 'GET');
export const POST = (r, c) => handle(r, c, 'POST');
