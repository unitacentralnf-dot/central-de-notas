import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = !!(supabaseUrl && supabaseUrl.indexOf('sua-url-do-supabase') === -1 && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Nunca exponha service_role no client. Operações admin devem ir via Edge Functions.
export const supabaseAdmin = null;

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase não configurado ou chaves padrão detectadas. Configure o arquivo .env com as chaves reais.'
  );
} else {
  console.log('Supabase configurado (client: anon key; admin: Edge Functions)');
}
