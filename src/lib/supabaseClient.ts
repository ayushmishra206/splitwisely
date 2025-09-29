import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url) {
  throw new Error('VITE_SUPABASE_URL is not defined');
}

if (!anonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is not defined');
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'splitwisely-auth'
  }
});
