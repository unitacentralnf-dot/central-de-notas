import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verifica se as variáveis de ambiente essenciais foram fornecidas.
// Não depende de valores placeholder específicos.
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('sua-url-do-supabase'));

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
