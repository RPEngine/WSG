import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function normalizeEnvValue(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed === 'undefined' || trimmed === 'null') return '';
  return trimmed;
}

const viteSupabaseUrl = normalizeEnvValue(import.meta.env.VITE_SUPABASE_URL);
const viteSupabaseAnonKey = normalizeEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);

// Runtime fallbacks for static deployments that inject values via window/meta.
const runtimeSupabaseUrl = normalizeEnvValue(
  window.WSG_SUPABASE_URL
  || window.VITE_SUPABASE_URL
  || document.querySelector('meta[name="wsg-supabase-url"]')?.content,
);
const runtimeSupabaseAnonKey = normalizeEnvValue(
  window.WSG_SUPABASE_ANON_KEY
  || window.VITE_SUPABASE_ANON_KEY
  || document.querySelector('meta[name="wsg-supabase-anon-key"]')?.content,
);

const SUPABASE_URL = viteSupabaseUrl || runtimeSupabaseUrl;
const SUPABASE_ANON_KEY = viteSupabaseAnonKey || runtimeSupabaseAnonKey;

export const supabaseConfig = {
  urlPresent: Boolean(SUPABASE_URL),
  keyPresent: Boolean(SUPABASE_ANON_KEY),
  usingViteEnvUrl: Boolean(viteSupabaseUrl),
  usingViteEnvKey: Boolean(viteSupabaseAnonKey),
};

console.info(`[supabase] Supabase URL present: ${supabaseConfig.urlPresent ? 'yes' : 'no'}`);
console.info(`[supabase] Supabase key present: ${supabaseConfig.keyPresent ? 'yes' : 'no'}`);
console.info(`[supabase] Supabase URL length: ${SUPABASE_URL.length}`);

if (!supabaseConfig.urlPresent || !supabaseConfig.keyPresent) {
  console.warn('[supabase] Missing Supabase URL or anon key. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend environment and redeploy.');
}

export const supabase = (supabaseConfig.urlPresent && supabaseConfig.keyPresent)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  : null;

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
