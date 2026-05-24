// src/api/faturas.js
// CRUD and listing for "faturas" using Supabase client

export async function getFaturasByObra(obraId) {
  const { data, error } = await supabase
    .from('faturas')
    .select('*')
    .eq('obra_id', obraId);
  if (error) throw error;
  return data;
}

export async function createFatura(fatura) {
  const { data, error } = await supabase.from('faturas').insert([fatura]);
  if (error) throw error;
  return data[0];
}

export async function updateFatura(id, updates) {
  const { data, error } = await supabase
    .from('faturas')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
  return data[0];
}

export async function deleteFatura(id) {
  const { error } = await supabase.from('faturas').delete().eq('id', id);
  if (error) throw error;
  return true;
}
