import { supabase } from './supabaseClient.js';
import { getIntegrationModes } from './integrationModes.js';
import { invokeEdge } from './edgeFunctions.js';

if (!supabase) {
  console.error("ERRO CRÍTICO: Cliente Supabase não inicializado. Verifique seu arquivo .env.");
}

export async function getDDABills(obraId = null) {
  let query = supabase.from('boletos_dda').select('*').order('created_at', { ascending: false });
  if (obraId) {
    query = query.eq('obra_id', obraId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar boletos DDA:', error);
    return [];
  }

  return data.map(b => ({
    id: b.id,
    obraId: b.obra_id,
    emissorNome: b.emissor_nome,
    emissorCnpj: b.emissor_cnpj,
    valor: parseFloat(b.valor),
    dataVencimento: b.data_vencimento,
    linhaDigitavel: b.linha_digitavel,
    status: b.status_dda.toLowerCase(),
    nfeVinculadaId: b.nfe_vinculada_id,
    contaFixaVinculadaId: b.conta_fixa_vinculada_id
  }));
}

export async function linkDDAToNFe(ddaId, nfeId) {
  const { error } = await supabase.from('boletos_dda').update({
    status_dda: 'vinculado_nfe',
    nfe_vinculada_id: nfeId
  }).eq('id', ddaId);

  if (error) {
    console.error('Erro ao vincular DDA a NFe:', error);
    return false;
  }
  return true;
}

export async function linkDDAToFixedBill(ddaId, ruleId) {
  const { error } = await supabase.from('boletos_dda').update({
    status_dda: 'vinculado_conta_fixa',
    conta_fixa_vinculada_id: ruleId
  }).eq('id', ddaId);

  if (error) {
    console.error('Erro ao vincular DDA a Conta Fixa:', error);
    return false;
  }
  return true;
}

export async function syncDDABaaS(obraId) {
  const modes = getIntegrationModes();
  if (modes.dda === 'disabled') {
    throw new Error('Integração DDA está desativada. Ative em Integrações.');
  }
  // Enquanto não há Edge Function/credenciais, fixtures mantém o sistema operacional
  if (modes.dda === 'edge') {
    const res = await invokeEdge('dda-sync', { obraId });
    return res;
  }
  if (modes.dda !== 'fixtures') {
    throw new Error('Modo DDA inválido. Ajuste em Integrações.');
  }

  return new Promise(resolve => {
    setTimeout(async () => {
      const novoBoleto = {
        obra_id: obraId,
        emissor_nome: 'FORNECEDOR DDA SYNC S/A',
        emissor_cnpj: '99.888.777/0001-66',
        valor: parseFloat((Math.random() * 5000 + 500).toFixed(2)),
        data_vencimento: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
        linha_digitavel: '23793.38128 60000.000000 93000.000000 1 89450000' + Math.floor(Math.random()*10000),
        status_dda: 'Pendente'
      };

      const { data, error } = await supabase.from('boletos_dda').insert([novoBoleto]).select();
      if (error) {
        console.error('Erro ao sync DDA:', error);
        resolve(null);
      } else {
        resolve(data[0]);
      }
    }, 2000);
  });
}
