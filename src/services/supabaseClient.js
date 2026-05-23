import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

const isSupabaseConfigured = !!(supabaseUrl && supabaseUrl.indexOf('sua-url-do-supabase') === -1 && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Cliente com service_role para operações admin (criar usuários, etc.)
export const supabaseAdmin = isSupabaseConfigured && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase não configurado ou chaves padrão detectadas. Configure o arquivo .env com as chaves reais.'
  );
}
