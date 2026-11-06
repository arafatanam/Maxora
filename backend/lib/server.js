import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Each install of the app (browser or phone) creates a random UUID and sends it on every request.
// It is the only identity: there are no accounts.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function deviceId(req) {
  const id = (req.headers.get('x-device-id') || '').trim().toLowerCase();
  return UUID.test(id) ? id : null;
}

// Vercel overwrites x-forwarded-for with the real client address, so the first entry is trustworthy there.
export function clientIp(req) {
  const fwd = req.headers.get('x-forwarded-for');
  return (fwd && fwd.split(',')[0].trim()) || req.headers.get('x-real-ip') || 'local';
}

// Limits are per IP address, counted in fixed windows.
// scan:    completed scans. Only a successful analysis counts, so a rejected photo never costs a scan.
// analyze: AI analysis attempts, including failures. Caps AI cost when someone retries in a loop.
// upload:  photo upload sessions. Caps storage use from uploads that are never analyzed.
// coach:   Coach Vee messages.
// burst:   every API request. Stops scripted hammering of cheap endpoints.
export const LIMITS = {
  scan: { max: 5, window: 86400, label: 'scans' },
  analyze: { max: 10, window: 86400, label: 'analysis attempts' },
  upload: { max: 15, window: 86400, label: 'photo uploads' },
  coach: { max: 40, window: 86400, label: 'Coach Vee messages' },
  burst: { max: 120, window: 60, label: 'requests' },
};

const ipHash = ip => createHash('sha256').update(`${process.env.IP_HASH_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || ''}:${ip}`).digest('hex').slice(0, 32);
function windowFor(bucket, ip) {
  const { window } = LIMITS[bucket];
  const start = Math.floor(Date.now() / 1000 / window) * window;
  return { key: `${bucket}:${ipHash(ip)}:${start}`, reset: new Date((start + window) * 1000).toISOString() };
}

// Adds one hit. Returns { ok, remaining, max, reset }.
export async function hit(bucket, ip) {
  const { max } = LIMITS[bucket], { key, reset } = windowFor(bucket, ip);
  const { data, error } = await admin().rpc('hit_rate_limit', { p_key: key, p_expires: reset });
  if (error) throw new Error(`Rate limiter unavailable: ${error.message}. Run backend/supabase/migrations/2026-11-06-free-no-auth.sql in Supabase.`);
  return { ok: data <= max, remaining: Math.max(0, max - data), max, reset };
}

// Reads the current count without adding a hit.
export async function peek(bucket, ip) {
  const { max } = LIMITS[bucket], { key, reset } = windowFor(bucket, ip);
  const { data } = await admin().from('rate_limits').select('count').eq('key', key).maybeSingle();
  return { remaining: Math.max(0, max - (data?.count || 0)), max, reset };
}
