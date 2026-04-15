import { createClient } from '@supabase/supabase-js';

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const supabaseConfig = {
  urlPresent: Boolean(supabaseUrl),
  keyPresent: Boolean(supabaseAnonKey),
};

console.info(`[supabase] Supabase URL present: ${supabaseConfig.urlPresent ? 'yes' : 'no'}`);
console.info(`[supabase] Supabase key present: ${supabaseConfig.keyPresent ? 'yes' : 'no'}`);
console.info(`[supabase] Supabase URL length: ${supabaseUrl.length}`);

if (!supabaseConfig.urlPresent || !supabaseConfig.keyPresent) {
  console.warn('Supabase configuration is missing. Check frontend environment variables and redeploy.');
}

export const supabase = (supabaseConfig.urlPresent && supabaseConfig.keyPresent)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
