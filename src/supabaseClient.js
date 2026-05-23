import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'sua_url_do_supabase_aqui') {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
