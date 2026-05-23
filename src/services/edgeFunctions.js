import { supabase } from './supabaseClient.js';

export async function invokeEdge(fnName, body) {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { data, error } = await supabase.functions.invoke(fnName, {
    body: body || {},
  });

  if (error) {
    // Normalize common cases
    const msg = error.message || 'Erro ao chamar Edge Function';
    throw new Error(`[edge:${fnName}] ${msg}`);
  }
  return data;
}
