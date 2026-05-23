import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verifica se as chaves existem para alertar o desenvolvedor de forma amigável
const isSupabaseConfigured = !!(supabaseUrl && supabaseUrl.indexOf('sua-url-do-supabase') === -1 && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase não configurado ou chaves padrão detectadas. A aplicação está rodando em MODO MOCK híbrido utilizando LocalStorage. Para conectar a um banco real, crie e configure o arquivo .env com as chaves reais.'
  );
}
