import { supabase } from '../supabaseClient.js';
import config from '../config.js';
import {
  mockGetObras, mockSaveObra, mockDeleteObra,
  mockGetRules, mockSaveRule, mockDeleteRule,
  mockGetBills, mockSaveBill,
  mockGetNFes, mockSyncSefaz, mockManifestNFe, mockLaunchNFe,
  mockGetNotifications, mockDispatchManualAlert, mockRunCronCheckAlerts,
  mockSimulateOCR, mockGetHistoricalData,
  mockInitializeData, mockAddNotification,
  mockGetProtestsByObra, mockResolveProtestsForObra,
  mockLoginUser, mockSubmitAccessRequest,
  mockGetAccessRequests, mockUpdateAccessRequest,
  mockGetUsuarios, mockCreateUsuario, mockUpdateUsuario, mockDeleteUsuario,
} from './mockProvider.js';

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
  // Exemplo de chamada real (quando configurada):
  // const token = config.apis.focusNFe.token;
  // if (!token) return mockSyncSefaz(obraId);
  // const response = await fetch(`${config.apis.focusNFe.baseUrl}/nfe?cnpj=...`, {
  //   headers: { 'Authorization': 'Basic ' + btoa(token + ':') }
  // });
  // const data = await response.json();
  // ...mapear e salvar no Supabase...
  console.warn('[realSyncSefaz] Focus NFe API ainda nao integrada. Usando mock.');
  return mockSyncSefaz(obraId);
}

export async function realManifestNFe(nfeId, type) {
  return mockManifestNFe(nfeId, type);
}

export async function realLaunchNFe(nfeId, costCenter) {
  return mockLaunchNFe(nfeId, costCenter);
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
  // Exemplo de chamada real (quando configurada):
  // const token = config.apis.plugOcr.token;
  // if (!token) return mockSimulateOCR(category, estimatedValue);
  // const formData = new FormData();
  // formData.append('file', pdfFile);
  // const response = await fetch('https://api.plugocr.com.br/v1/extract', {
  //   method: 'POST',
  //   headers: { 'api-key': token },
  //   body: formData
  // });
  console.warn('[realSimulateOCR] PlugOCR ainda nao integrado. Usando mock.');
  return mockSimulateOCR(category, estimatedValue);
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
