'use client';
// Browser-side helpers for the web app. There are no accounts: a random device id kept in
// localStorage identifies this browser to the API.

const KEY = 'maxora.device';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
let memoryId = null;

function uuid() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function getDeviceId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!UUID.test(id || '')) { id = uuid(); localStorage.setItem(KEY, id); }
    return id;
  } catch {
    return (memoryId ||= uuid());
  }
}

export function resetDeviceId() {
  memoryId = null;
  try { localStorage.removeItem(KEY); } catch {}
}

async function request(path, init) {
  let r;
  try { r = await fetch('/api/' + path, { ...init, headers: { 'x-device-id': getDeviceId(), ...init.headers } }); }
  catch { throw new Error('No connection. Check your internet and try again.'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || 'Something went wrong. Try again.'), { status: r.status, data: j });
  return j;
}

export const api = (path, body) => request(path, body
  ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
  : { method: 'GET', headers: {} });

export const uploadPhoto = (id, k, blob) => request(`scan/photo?id=${id}&k=${k}`, { method: 'POST', headers: { 'content-type': blob.type || 'image/jpeg' }, body: blob });

// Resize to at most 1280px on the long side and re-encode as JPEG. Keeps uploads small and fast,
// and within the AI provider's image size limit. Falls back to the original file if the browser can't decode it.
export async function compress(file, max = 1280, quality = 0.86) {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close?.();
    const blob = await new Promise(res => c.toBlob(res, 'image/jpeg', quality));
    return blob || file;
  } catch {
    return file;
  }
}

export const nice = s => (s || '').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
export const FEATS = ['symmetry', 'jawline', 'cheekbones', 'eye_area', 'nose', 'lips', 'skin_quality', 'facial_harmony', 'dimorphism'];
export const CATS = ['grooming', 'skincare', 'hair', 'fitness', 'posture', 'style', 'habits'];
export const OPTIONS = {
  gender: ['male', 'female', 'other'],
  age_range: ['18 to 24', '25 to 34', '35 to 44', '45 plus'],
  main_goal: ['Better jawline', 'Better skin', 'Better hair', 'Overall glow up', 'Social confidence'],
};
export const DISCLAIMER = 'Scores are AI estimates for self-improvement. They do not define your worth and are not medical advice.';
// Score tone: high scores use the accent, the middle uses the light brand tone, low scores stay neutral.
export const tone = s => s >= 7 ? 'hi' : s >= 5 ? 'mid' : 'lo';
export const fmtDate = d => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtTime = d => new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
