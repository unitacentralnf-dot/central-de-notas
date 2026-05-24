// src/api/contas_fixas.js
// CRUD endpoints for "contas_fixas" using Supabase client (vanilla JS)

// Assumes a global `supabase` instance is initialized in src/services/supabase.js

export async function getContasFixas(obraId) {
  const { data, error } = await supabase
    .from('contas_fixas')
    .select('*')
    .eq('obra_id', obraId);
  if (error) throw error;
  return data;
}

export async function createContaFixa(conta) {
  const { data, error } = await supabase.from('contas_fixas').insert([conta]);
  if (error) throw error;
  return data[0];
}

export async function updateContaFixa(id, updates) {
  const { data, error } = await supabase
    .from('contas_fixas')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
  return data[0];
}

export async function deleteContaFixa(id) {
  const { error } = await supabase.from('contas_fixas').delete().eq('id', id);
  if (error) throw error;
  return true;
}
