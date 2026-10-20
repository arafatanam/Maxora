import { createClient } from '@supabase/supabase-js';
export const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
export async function getUser(req) {
  const t = (req.headers.get('authorization') || '').replace('Bearer ', '');
  if (!t) return null;
  const { data } = await admin().auth.getUser(t);
  return data?.user || null;
}
export async function isPaid(email) {
  const { data } = await admin().from('subscriptions').select('status,current_period_end').eq('user_email', email).maybeSingle();
  return !!data && ['active', 'trialing'].includes(data.status) && new Date(data.current_period_end) > new Date();
}
