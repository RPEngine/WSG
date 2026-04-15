import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = (
  window.VITE_SUPABASE_URL
  || window.WSG_SUPABASE_URL
  || 'https://lcclgtefrkfikrnfkoua.supabase.co'
).trim();

const SUPABASE_ANON_KEY = (
  window.VITE_SUPABASE_ANON_KEY
  || window.WSG_SUPABASE_ANON_KEY
  || ''
).trim();

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[supabase] Missing Supabase URL or anon key. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend runtime env.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function toAppUser(user) {
  if (!user) return null;
  const metadata = user.user_metadata || {};
  const emailName = String(user.email || '').split('@')[0] || 'member';
  return {
    id: String(user.id || ''),
    email: user.email || '',
    username: metadata.username || emailName,
    legalName: metadata.legalName || metadata.full_name || '',
    role: metadata.role || 'member',
    organizationName: metadata.organizationName || '',
    emailConfirmedAt: user.email_confirmed_at || null,
  };
}
