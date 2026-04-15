import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function cleanEnvValue(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  return (lower === 'undefined' || lower === 'null') ? '' : trimmed;
}

function readSupabaseConfig() {
  const url = cleanEnvValue(
    window.WSG_SUPABASE_URL
      || window.VITE_SUPABASE_URL
      || document.querySelector('meta[name="wsg-supabase-url"]')?.getAttribute('content'),
  );

  const anonKey = cleanEnvValue(
    window.WSG_SUPABASE_ANON_KEY
      || window.VITE_SUPABASE_ANON_KEY
      || document.querySelector('meta[name="wsg-supabase-anon-key"]')?.getAttribute('content'),
  );

  return { url, anonKey };
}

const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = readSupabaseConfig();

export const supabaseConfig = {
  urlPresent: Boolean(SUPABASE_URL),
  keyPresent: Boolean(SUPABASE_ANON_KEY),
  ready: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
  source: 'window/meta-runtime',
  initError: '',
};

console.info(`[supabase] Supabase URL present: ${supabaseConfig.urlPresent ? 'yes' : 'no'}`);
console.info(`[supabase] Supabase key present: ${supabaseConfig.keyPresent ? 'yes' : 'no'}`);

if (!supabaseConfig.ready) {
  console.warn('[supabase] Missing Supabase URL or anon key. Set wsg-supabase-url and wsg-supabase-anon-key (or window.WSG_SUPABASE_*) in web/index.html.');
}

let supabaseClient = null;
if (supabaseConfig.ready) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (error) {
    supabaseConfig.initError = error instanceof Error ? error.message : String(error);
    console.error('[supabase] Failed to initialize client.', error);
  }
}

export const supabase = supabaseClient;

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
