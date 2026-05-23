import { supabase } from './supabaseClient.js';
import provider from './providers/index.js';

if (!supabase) {
  console.error("ERRO CRÍTICO: Cliente Supabase não inicializado. Verifique seu arquivo .env.");
} else {
  console.log("🚀 Arquitetura 100% Nuvem: Conectado ao banco de dados Supabase.");
}

// --- MÓDULO OBRAS ---
export async function getObras() { return provider.mockGetObras(); }
export async function saveObra(obra) { return provider.mockSaveObra(obra); }
export async function deleteObra(id) { return provider.mockDeleteObra(id); }

// --- MÓDULO REGRAS (RECORRÊNCIAS) ---
export async function getRules() { return provider.mockGetRules(); }
export async function saveRule(rule) { return provider.mockSaveRule(rule); }
export async function deleteRule(id) { return provider.mockDeleteRule(id); }

export async function getRulesByObra(obraId) {
  if (!obraId) return [];
  const rules = await getRules();
  return rules.filter(r => r.obraId === obraId);
}

// --- MÓDULO FATURAS MENSAIS ---
export async function getBills() { return provider.mockGetBills(); }
export async function saveBill(bill) { return provider.mockSaveBill(bill); }

export async function getBillsForPeriod(mes, ano, obraId = '') {
  const bills = await getBills();
  let filtered = bills.filter(b => b.mes === mes && b.ano === ano);
  if (obraId) {
    filtered = filtered.filter(b => b.obraId === obraId);
  }
  return filtered;
}

// --- NOTAS FISCAIS (NFE) ---
export async function getNFes() { return provider.mockGetNFes(); }
export async function syncSefaz(obraId) { return provider.mockSyncSefaz(obraId); }
export async function manifestNFe(nfeId, type) { return provider.mockManifestNFe(nfeId, type); }
export async function launchNFe(nfeId, costCenter) { return provider.mockLaunchNFe(nfeId, costCenter); }

export async function getNFesByObra(obraId) {
  if (!obraId) return [];
  const nfes = await getNFes();
  return nfes.filter(n => n.obraId === obraId);
}

// --- ALERTAS E NOTIFICAÇÕES ---
export async function getNotifications() { return provider.mockGetNotifications(); }
export async function dispatchManualAlert(billId, senderName) { return provider.mockDispatchManualAlert(billId, senderName); }
export async function runCronCheckAlerts() { return provider.mockRunCronCheckAlerts(); }
export async function simulateOCR(category, estimatedValue) { return provider.mockSimulateOCR(category, estimatedValue); }
export async function getHistoricalData(ruleId) { return provider.mockGetHistoricalData(ruleId); }
export function initializeData() { provider.mockInitializeData(); }
export function addNotification(type, message) { provider.mockAddNotification(type, message); }

// --- MÓDULO PROTESTOS ---
export async function checkCnpjStatus(cnpj) {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  if (cleanCnpj.length !== 14) throw new Error('CNPJ inválido.');
  try {
    const res = await fetch(`https://publica.cnpj.ws/cnpj/${cleanCnpj}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      if (res.status === 404) return { cnpj: cleanCnpj, situacao: 'INEXISTENTE', protestStatus: 'clean' };
      if (res.status === 429) throw new Error('Rate limit CNPJ.ws (3 req/min).');
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return {
      cnpj: data.cnpj,
      razaoSocial: data.razao_social || data.nome_fantasia || 'N/D',
      situacao: data.situacao_cadastral || 'DESCONHECIDA',
      ultimaAtualizacao: data.data_situacao_cadastral?.split('T')[0] || new Date().toISOString().split('T')[0],
      dataAbertura: data.data_abertura?.split('T')[0] || '',
      porte: data.porte || '',
      naturezaJuridica: data.natureza_juridica || '',
      cnae: data.cnae_fiscal_descricao || '',
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      municipio: data.municipio || '',
      uf: data.uf || '',
      cep: data.cep || '',
      telefone: data.telefone1 || '',
      email: data.email || '',
      protestStatus: data.situacao_cadastral === 'ATIVA' ? 'clean' : 'dirty',
    };
  } catch (err) {
    console.error('Erro CNPJ.ws:', err);
    throw err;
  }
}
export async function getProtestsByObra(obraId) { return provider.mockGetProtestsByObra(obraId); }
export async function resolveProtestsForObra(obraId) { return provider.mockResolveProtestsForObra(obraId); }

// --- MÓDULO AUTENTICAÇÃO ---
export async function loginUser(email, senha) { return provider.mockLoginUser(email, senha); }
export async function submitAccessRequest(data) { return provider.mockSubmitAccessRequest(data); }
export async function getAccessRequests() { return provider.mockGetAccessRequests(); }
export async function updateAccessRequest(id, updates) { return provider.mockUpdateAccessRequest(id, updates); }

// --- MÓDULO USUÁRIOS (MASTER) ---
export async function getUsuarios() { return provider.mockGetUsuarios(); }
export async function createUsuario(data) { return provider.mockCreateUsuario(data); }
export async function updateUsuario(id, updates) { return provider.mockUpdateUsuario(id, updates); }
export async function deleteUsuario(id) { return provider.mockDeleteUsuario(id); }
