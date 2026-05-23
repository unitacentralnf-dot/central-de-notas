import { supabase } from '../supabaseClient.js';
const db = () => supabase;
import config from '../config.js';
import { getIntegrationModes } from '../integrationModes.js';
import { invokeEdge } from '../edgeFunctions.js';
import {
  mockGetObras, mockSaveObra, mockDeleteObra,
  mockGetRules, mockSaveRule, mockDeleteRule,
  mockGetBills, mockSaveBill,
  mockGetNFes, mockManifestNFe,
  mockGetNotifications, mockDispatchManualAlert, mockRunCronCheckAlerts,
  mockGetHistoricalData,
  mockInitializeData, mockAddNotification,
  mockGetProtestsByObra, mockResolveProtestsForObra,
  mockScanProtestsByObra,
  mockLoginUser, mockSubmitAccessRequest,
  mockGetAccessRequests, mockUpdateAccessRequest,
  mockGetUsuarios, mockCreateUsuario, mockUpdateUsuario, mockDeleteUsuario,
} from './mockProvider.js';

// -------------------------------------------------------------------
// CNPJ.ws — Consulta Cadastral Real
// Docs: https://publica.cnpj.ws
// Gratuita, sem autenticação, 3 req/min (respeitar rate limit)
// -------------------------------------------------------------------
function mapCnpjData(data, cleanCnpj) {
  return {
    cnpj: cleanCnpj,
    razaoSocial: data.razao_social || data.nome_fantasia || 'N/D',
    situacao: data.situacao_cadastral || 'DESCONHECIDA',
    ultimaAtualizacao: data.data_situacao_cadastral
      ? data.data_situacao_cadastral.split('T')[0]
      : new Date().toISOString().split('T')[0],
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
}

export async function realCheckCnpjStatus(cnpj) {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  if (cleanCnpj.length !== 14) {
    throw new Error('CNPJ inválido. Deve conter 14 dígitos.');
  }

  // 1. Verifica cache no Supabase
  try {
    const { data: cached, error } = await db()
      .from('cnpj_cache')
      .select('*')
      .eq('cnpj', cleanCnpj)
      .single();

    if (!error && cached) {
      const cacheAge = Date.now() - new Date(cached.ultima_consulta).getTime();
      const cacheValido = cacheAge < 24 * 60 * 60 * 1000; // 24h

      if (cacheValido) {
        console.log(`[CNPJ.cache] Dados encontrados em cache para ${cleanCnpj}`);
        return mapCnpjData(cached.response_data, cleanCnpj);
      }
      console.log(`[CNPJ.cache] Cache expirado para ${cleanCnpj}, consultando API...`);
    }
  } catch (e) {
    console.warn('[CNPJ.cache] Erro ao consultar cache:', e.message);
  }

  // 2. Consulta CNPJ.ws API externa
  const url = `https://publica.cnpj.ws/cnpj/${cleanCnpj}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        const notFound = {
          cnpj: cleanCnpj,
          razaoSocial: 'CNPJ NÃO ENCONTRADO',
          situacao: 'INEXISTENTE',
          ultimaAtualizacao: new Date().toISOString().split('T')[0],
        };
        // Cacheia resultado negativo por 7 dias
        await salvarCache(cleanCnpj, {
          situacao_cadastral: 'INEXISTENTE',
          razao_social: 'CNPJ NÃO ENCONTRADO',
        });
        return notFound;
      }
      if (response.status === 429) {
        console.warn('CNPJ.ws: Rate limit atingido (3 req/min). Tente novamente em alguns instantes.');
        throw new Error('Rate limit exceeded');
      }
      throw new Error(`CNPJ.ws HTTP ${response.status}`);
    }

    const data = await response.json();

    // 3. Salva no cache
    await salvarCache(cleanCnpj, data);

    console.log(`[CNPJ.ws] Dados atualizados para ${cleanCnpj}`);
    return mapCnpjData(data, cleanCnpj);
  } catch (err) {
    console.error('Erro ao consultar CNPJ.ws:', err);
    throw err;
  }
}

async function salvarCache(cnpj, data) {
  try {
    await db().from('cnpj_cache').upsert({
      cnpj,
      razao_social: data.razao_social || data.nome_fantasia || null,
      situacao: data.situacao_cadastral || null,
      data_abertura: data.data_abertura ? data.data_abertura.split('T')[0] : null,
      porte: data.porte || null,
      natureza_juridica: data.natureza_juridica || null,
      cnae: data.cnae_fiscal_descricao || null,
      logradouro: data.logradouro || null,
      bairro: data.bairro || null,
      municipio: data.municipio || null,
      uf: data.uf || null,
      cep: data.cep || null,
      telefone: data.telefone1 || null,
      email: data.email || null,
      response_data: data,
      ultima_consulta: new Date().toISOString(),
    }, { onConflict: 'cnpj' });
  } catch (e) {
    console.warn('[CNPJ.cache] Erro ao salvar cache:', e.message);
  }
}

// -------------------------------------------------------------------
// PROVEDOR REAL
// -------------------------------------------------------------------
// Aqui entram as chamadas reais para as APIs quando estiverem prontas.
// Enquanto isso, delegamos para o mockProvider.
// Para ativar, troque VITE_DATA_PROVIDER=real no .env e configure as
// credenciais das APIs em config.js.
//
// Integracoes planejadas (ver api_roadmap.md):
//   - Focus NFe: consulta Sefaz, manifesto, download XML
//   - CNPJ.ws: consulta cadastro CNPJ e protestos
//   - PlugOCR: leitura de boletos PDF
//   - Asaas: DDA / boletos bancarios
// -------------------------------------------------------------------

export async function realGetObras() {
  // TODO: Integrar com dados do ERP ou manter no Supabase
  return mockGetObras();
}

export async function realSaveObra(obra) {
  return mockSaveObra(obra);
}

export async function realDeleteObra(id) {
  return mockDeleteObra(id);
}

export async function realGetRules() {
  return mockGetRules();
}

export async function realSaveRule(rule) {
  return mockSaveRule(rule);
}

export async function realDeleteRule(id) {
  return mockDeleteRule(id);
}

export async function realGetBills() {
  return mockGetBills();
}

export async function realSaveBill(bill) {
  return mockSaveBill(bill);
}

export async function realGetNFes() {
  return mockGetNFes();
}

export async function realSyncSefaz(obraId) {
  const modes = getIntegrationModes();
  if (modes.nfe === 'disabled') {
    throw new Error('Integração NF-e está desativada. Ative em Integrações.');
  }

  if (modes.nfe === 'edge') {
    // Edge Function will handle provider choice + secrets server-side.
    const res = await invokeEdge('nfe-sync', { obraId });
    return res?.added || [];
  }

  const token = config.apis?.focusNFe?.token;
  if (!token) {
    if (modes.nfe !== 'fixtures') {
      throw new Error('Sem token FocusNFe e modo NF-e não está em Fixtures. Ajuste em Integrações.');
    }
    console.warn('[realSyncSefaz] Sem token FocusNFe. Usando fixtures do Supabase.');
    return mockImplSyncSefazFallback(obraId);
  }
  // TODO: Implementar chamada real à API do Focus NFe
  // const baseUrl = config.apis.focusNFe.baseUrl;
  // const response = await fetch(`${baseUrl}/nfe?cnpj=...`, {
  //   headers: { 'Authorization': 'Basic ' + btoa(token + ':') }
  // });
  throw new Error(`Focus NFe token encontrado, mas integração ainda não implementada.`);
}

async function mockImplSyncSefazFallback(obraId) {
  // Reusa a mesma estratégia do mockProvider: insere NF-es exemplo
  const fornecedores = [
    { nome: 'CIMENTO FORTE LTDA', cnpj: '12.345.678/0001-90' },
    { nome: 'ACO ESTRUTURAL SA', cnpj: '98.765.432/0001-10' },
    { nome: 'LOCACAO DE MAQUINAS BR', cnpj: '44.555.666/0001-22' },
  ];
  const now = Date.now();
  const novos = Array.from({ length: 3 }).map((_, i) => {
    const f = fornecedores[i % fornecedores.length];
    const valor = parseFloat((Math.random() * 45000 + 1200).toFixed(2));
    const dia = new Date(now - i * 86400000).toISOString().split('T')[0];
    const chave = String(Math.floor(Math.random() * 1e44)).padStart(44, '0').slice(0, 44);
    return {
      obra_id: obraId,
      chave_acesso: chave,
      fornecedor: f.nome,
      cnpj_fornecedor: f.cnpj,
      valor,
      data_emissao: dia,
      status_manifesto: 'Pendente',
      status_sefaz: 'Autorizada',
    };
  });
  const { data, error } = await db().from('notas_fiscais').insert(novos).select();
  if (error) throw error;
  return data;
}

export async function realManifestNFe(nfeId, type) {
  return mockManifestNFe(nfeId, type);
}

export async function realLaunchNFe(nfeId, costCenter) {
  throw new Error('Lançamento contábil não implementado. Integração com sistema contábil não configurada.');
}

export async function realGetNotifications() {
  return mockGetNotifications();
}

export async function realDispatchManualAlert(billId, senderName) {
  // TODO: Integrar com WhatsApp / e-mail real
  return mockDispatchManualAlert(billId, senderName);
}

export async function realRunCronCheckAlerts() {
  return mockRunCronCheckAlerts();
}

export async function realSimulateOCR(category, estimatedValue) {
  const token = config.apis?.plugOcr?.token;
  if (!token) {
    throw new Error(
      'PlugOCR API não configurada. Defina VITE_PLUGOCR_TOKEN no .env ' +
      'com sua chave de API do PlugOCR.'
    );
  }
  throw new Error('PlugOCR token encontrado, mas integração ainda não implementada.');
}

export async function realGetHistoricalData(ruleId) {
  return mockGetHistoricalData(ruleId);
}

export function realInitializeData() {
  mockInitializeData();
}

export function realAddNotification(type, message) {
  // TODO: Integrar com sistema de notificacoes real (toast, push)
  mockAddNotification(type, message);
}

export async function realGetProtestsByObra(obraId) {
  // Exemplo de chamada real (quando configurada):
  // const response = await fetch(`${config.apis.cnpjWs.baseUrl}/${cnpj}`);
  // const data = await response.json();
  // ...mapear para o formato do sistema...
  console.warn('[realGetProtestsByObra] CNPJ.ws ainda nao integrado. Usando Supabase.');
  return mockGetProtestsByObra(obraId);
}

export async function realScanProtestsByObra(obraId) {
  const modes = getIntegrationModes();
  if (modes.protests === 'disabled') {
    throw new Error('Integração de protestos está desativada. Ative em Integrações.');
  }
  if (modes.protests !== 'fixtures') {
    throw new Error('Integração de protestos via Edge Function ainda não configurada. Use Fixtures em Integrações.');
  }
  // Em real-mode sem credenciais: mantém operacional via fixtures (Supabase)
  return mockScanProtestsByObra(obraId);
}

export async function realResolveProtestsForObra(obraId) {
  return mockResolveProtestsForObra(obraId);
}

export async function realLoginUser(email, senha) {
  return mockLoginUser(email, senha); // já usa Supabase Auth internamente
}

export async function realSubmitAccessRequest({ nome, email, obra, mensagem }) {
  return mockSubmitAccessRequest({ nome, email, obra, mensagem });
}

export async function realGetAccessRequests() {
  return mockGetAccessRequests();
}

export async function realUpdateAccessRequest(id, updates) {
  return mockUpdateAccessRequest(id, updates);
}

export async function realGetUsuarios() {
  return mockGetUsuarios();
}

export async function realCreateUsuario({ nome, email, senha, role, obraId }) {
  // TODO: Usar Supabase Auth para criar usuario com hash
  return mockCreateUsuario({ nome, email, senha, role, obraId });
}

export async function realUpdateUsuario(id, updates) {
  return mockUpdateUsuario(id, updates);
}

export async function realDeleteUsuario(id) {
  return mockDeleteUsuario(id);
}
