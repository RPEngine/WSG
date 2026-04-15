import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const supabaseConfig = {
  urlPresent: Boolean(supabaseUrl),
  keyPresent: Boolean(supabaseAnonKey),
};

console.info(`[supabase] Supabase URL present: ${supabaseConfig.urlPresent ? 'yes' : 'no'}`);
console.info(`[supabase] Supabase key present: ${supabaseConfig.keyPresent ? 'yes' : 'no'}`);

if (!supabaseConfig.urlPresent || !supabaseConfig.keyPresent) {
  console.warn('Supabase configuration is missing. Check frontend environment variables and redeploy.');
}

export const supabase = (supabaseConfig.urlPresent && supabaseConfig.keyPresent)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
