import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');
export const sb = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'x', {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

export async function api(path, body) {
  const { data: { session } } = await sb.auth.getSession();
  let r;
  try {
    r = await fetch(API_URL + '/api/' + path, {
      method: body ? 'POST' : 'GET',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + (session?.access_token || '') },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error(`Could not reach the backend at ${API_URL}. Confirm the backend is running and reachable from this device. ${e.message}`);
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || 'Something went wrong.'), { status: r.status });
  return j;
}
