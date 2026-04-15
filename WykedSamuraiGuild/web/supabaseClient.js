import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function normalizeEnvValue(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed === 'undefined' || trimmed === 'null') return '';
  return trimmed;
}

const envSupabaseUrl = normalizeEnvValue(import.meta.env?.VITE_SUPABASE_URL);
const envSupabaseAnonKey = normalizeEnvValue(import.meta.env?.VITE_SUPABASE_ANON_KEY);

// Runtime fallback for static deployments (e.g. Render static site without Vite build-time env injection).
const runtimeSupabaseUrl = normalizeEnvValue(
  window.WSG_SUPABASE_URL || document.querySelector('meta[name="wsg-supabase-url"]')?.content,
);
const runtimeSupabaseAnonKey = normalizeEnvValue(
  window.WSG_SUPABASE_ANON_KEY || document.querySelector('meta[name="wsg-supabase-anon-key"]')?.content,
);

const SUPABASE_URL = envSupabaseUrl || runtimeSupabaseUrl;
const SUPABASE_ANON_KEY = envSupabaseAnonKey || runtimeSupabaseAnonKey;

export const supabaseConfig = {
  urlPresent: Boolean(SUPABASE_URL),
  keyPresent: Boolean(SUPABASE_ANON_KEY),
  usingViteEnvUrl: Boolean(envSupabaseUrl),
  usingViteEnvKey: Boolean(envSupabaseAnonKey),
};

console.info(`[supabase] Supabase URL present: ${supabaseConfig.urlPresent ? 'yes' : 'no'}`);
console.info(`[supabase] Supabase key present: ${supabaseConfig.keyPresent ? 'yes' : 'no'}`);
console.info(`[supabase] Supabase URL from Vite env: ${supabaseConfig.usingViteEnvUrl ? 'yes' : 'no'}`);
console.info(`[supabase] Supabase key from Vite env: ${supabaseConfig.usingViteEnvKey ? 'yes' : 'no'}`);

if (!supabaseConfig.urlPresent || !supabaseConfig.keyPresent) {
  console.warn('[supabase] Missing Supabase URL or anon key. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend runtime env.');
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
