import { supabase } from './supabaseClient.js';

if (!supabase) {
  console.error("ERRO CRÍTICO: Cliente Supabase não inicializado. Verifique seu arquivo .env.");
} else {
  console.log("🚀 Arquitetura 100% Nuvem: Conectado ao banco de dados Supabase.");
}

// --- MÓDULO OBRAS ---
export async function getObras() {
  const { data, error } = await supabase.from('obras').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Erro ao buscar obras:', error);
    return [];
  }
  
  // Buscar protestos ativos para definir o protestStatus das obras dinamicamente
  const { data: protestosData } = await supabase.from('protestos').select('obra_id').eq('status', 'Ativo');
  const obrasComProtestos = new Set((protestosData || []).map(p => p.obra_id));

  return data.map(o => ({
    id: o.id,
    name: o.nome,
    cnpj: o.cnpj,
    address: o.endereco,
    protestStatus: obrasComProtestos.has(o.id) ? 'dirty' : 'clean', 
    lastProtestCheck: o.created_at
  }));
}

export async function saveObra(obra) {
  const { data, error } = await supabase.from('obras').upsert({
    id: obra.id || undefined,
    nome: obra.name,
    cnpj: obra.cnpj,
    endereco: obra.address
  }).select();
  if (error) throw error;
  return {
    id: data[0].id,
    name: data[0].nome,
    cnpj: data[0].cnpj,
    address: data[0].endereco,
    protestStatus: 'clean',
    lastProtestCheck: null
  };
}

export async function deleteObra(id) {
  const { error } = await supabase.from('obras').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// --- MÓDULO REGRAS (RECORRÊNCIAS) ---
export async function getRules() {
  const { data, error } = await supabase.from('contas_fixas').select('*');
  if (error) {
    console.error('Erro ao buscar contas fixas:', error);
    return [];
  }
  return data.map(r => ({
    id: r.id,
    obraId: r.obra_id,
    name: r.nome,
    category: r.tipo,
    dueDay: r.dia_vencimento,
    estimatedValue: parseFloat(r.valor_medio),
    leadTimeDays: 10, // hardcoded for now, could be added to schema later
    emailsAlert: '',
    phonesAlert: ''
  }));
}

export async function getRulesByObra(obraId) {
  if (!obraId) return [];
  const rules = await getRules();
  return rules.filter(r => r.obraId === obraId);
}

export async function saveRule(rule) {
  const { data, error } = await supabase.from('contas_fixas').upsert({
    id: rule.id || undefined,
    obra_id: rule.obraId,
    nome: rule.name,
    tipo: rule.category,
    dia_vencimento: parseInt(rule.dueDay),
    valor_medio: parseFloat(rule.estimatedValue)
  }).select();
  if (error) throw error;
  return {
    id: data[0].id,
    obraId: data[0].obra_id,
    name: data[0].nome,
    category: data[0].tipo,
    dueDay: data[0].dia_vencimento,
    estimatedValue: parseFloat(data[0].valor_medio),
    leadTimeDays: 10
  };
}

export async function deleteRule(id) {
  const { error } = await supabase.from('contas_fixas').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// --- MÓDULO FATURAS MENSAIS ---
export async function getBills() {
  const { data, error } = await supabase.from('faturas').select('*, contas_fixas(obra_id)');
  if (error) {
    console.error('Erro ao buscar faturas:', error);
    return [];
  }
  return data.map(f => {
    const [ano, mes] = f.mes_referencia.split('-');
    return {
      id: f.id,
      ruleId: f.conta_fixa_id,
      obraId: f.contas_fixas?.obra_id,
      mes: mes,
      ano: ano,
      status: f.status,
      valorReal: f.status !== 'nao_chegou' ? parseFloat(f.valor) : null,
      valorEstimado: parseFloat(f.valor),
      vencimentoReal: f.data_vencimento,
      vencimentoPadrao: new Date(f.data_vencimento).getDate(),
      codigoBarras: null, // Pode ser adicionado na tabela de faturas depois
      comprovante: null,
      alertDispatched: false
    };
  });
}

export async function saveBill(bill) {
  const { data, error } = await supabase.from('faturas').upsert({
    id: bill.id || undefined,
    conta_fixa_id: bill.ruleId,
    mes_referencia: `${bill.ano}-${bill.mes}`,
    valor: bill.valorReal || bill.valorEstimado,
    data_vencimento: bill.vencimentoReal || `${bill.ano}-${bill.mes}-${String(bill.vencimentoPadrao).padStart(2,'0')}`,
    status: bill.status
  }).select();
  
  if (error) throw error;
  return data[0];
}

// Retorna as faturas do mês filtradas por obra (se houver)
export async function getBillsForPeriod(mes, ano, obraId = '') {
  const bills = await getBills();
  let filtered = bills.filter(b => b.mes === mes && b.ano === ano);
  if (obraId) {
    filtered = filtered.filter(b => b.obraId === obraId);
  }
  return filtered;
}

// --- NOTAS FISCAIS (NFE) ---
export async function getNFes() {
  const { data, error } = await supabase.from('notas_fiscais').select('*');
  if (error) {
    console.error('Erro ao buscar notas fiscais:', error);
    return [];
  }
  return data.map(n => ({
    id: n.id,
    number: n.chave_acesso.substring(25, 34), // Extração simulada do número da chave
    serie: n.chave_acesso.substring(22, 25),
    issuer: n.fornecedor,
    issuerCnpj: n.cnpj_fornecedor,
    value: parseFloat(n.valor),
    issueDate: n.data_emissao,
    accessKey: n.chave_acesso,
    obraId: n.obra_id,
    manifestStatus: n.status_manifesto.toLowerCase().replace(' ', '_'),
    launchStatus: n.status_sefaz === 'Autorizada' ? 'pendente' : 'cancelada',
    costCenter: null,
    items: [] // itens poderiam vir de outra tabela
  }));
}

export async function getNFesByObra(obraId) {
  if (!obraId) return [];
  const nfes = await getNFes();
  return nfes.filter(n => n.obraId === obraId);
}

export async function syncSefaz(obraId) {
  // Simulação de consulta à sefaz que insere no Supabase
  const obras = await getObras();
  const obra = obras.find(o => o.id === obraId);
  if (!obra) return [];
  
  const novaChave = '4126' + String(Date.now()).substring(0, 8) + '00019955001' + Math.floor(Math.random()*999999999).toString().padStart(9,'0') + '1000' + Math.floor(Math.random()*9999).toString().padStart(4,'0');
  
  const novaNota = {
    obra_id: obraId,
    chave_acesso: novaChave,
    fornecedor: 'FORNECEDOR SEFAZ SYNC LTDA',
    cnpj_fornecedor: '12.345.678/0001-99',
    valor: parseFloat((Math.random() * 5000 + 100).toFixed(2)),
    data_emissao: new Date().toISOString().split('T')[0],
    status_sefaz: 'Autorizada',
    status_manifesto: 'Sem Manifesto'
  };
  
  await supabase.from('notas_fiscais').insert([novaNota]);
  return await getNFesByObra(obraId);
}

export async function manifestNFe(nfeId, type) {
  let status_manifesto = 'Sem Manifesto';
  if (type === 'confirmacao') status_manifesto = 'Confirmada';
  if (type === 'desconhecimento') status_manifesto = 'Desconhecida';
  if (type === 'nao_realizada') status_manifesto = 'Nao Realizada';
  
  const { error } = await supabase.from('notas_fiscais').update({ status_manifesto }).eq('id', nfeId);
  return !error;
}

export async function launchNFe(nfeId, costCenter) {
  // No modelo simplificado, apenas atualizamos a NFe. Em um cenário real, inseriríamos em uma tabela de Contas a Pagar
  console.log(`NFe ${nfeId} lançada no centro de custo ${costCenter}`);
  return true;
}

// --- ALERTAS E NOTIFICAÇÕES MOCK ---
export async function getNotifications() {
  return [
    {
      id: 'notif-1',
      timestamp: new Date().toISOString(),
      type: 'info',
      message: 'Sistema atualizado para Arquitetura SaaS (Supabase Ativo).'
    }
  ];
}

export async function dispatchManualAlert(billId, senderName) {
  console.log(`Alerta manual disparado por ${senderName} para a fatura ${billId}`);
  return true;
}

export async function runCronCheckAlerts() {
  return 0; // Removido processamento pesado síncrono
}

export async function simulateOCR(category, estimatedValue) {
  const variation = (Math.random() * 0.3) - 0.08; 
  const realValue = parseFloat((estimatedValue * (1 + variation)).toFixed(2));
  const randBlock = () => Math.floor(10000 + Math.random() * 90000);
  const code = `836200000${Math.floor(realValue).toString().padStart(4, '0')}00${randBlock()}00${randBlock()}00${randBlock()}00${randBlock()}`;
  const dueDay = category === 'Energia' ? 10 : (category === 'Água' ? 15 : 20);
  const dueRealDate = `2026-05-${dueDay.toString().padStart(2, '0')}`;

  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ realValue, barcode: code, dueRealDate });
    }, 1500);
  });
}

// Retorna dados históricos para gráficos
export async function getHistoricalData(ruleId) {
  const { data } = await supabase.from('faturas').select('*').eq('conta_fixa_id', ruleId).in('status', ['Pago', 'lancada', 'paga']);
  if (!data) return [];
  return data.map(f => {
    const [ano, mes] = f.mes_referencia.split('-');
    return { mes, ano, valorReal: parseFloat(f.valor) };
  });
}

export function initializeData() {
  console.log('Dados inicializados (Nuvem/Supabase)');
}

export function addNotification(type, message) {
  console.log(`[Notification - ${type}] ${message}`);
  // Pode ser implementado posteriormente no UI
}

// --- MÓDULO PROTESTOS REAIS ---
export async function getProtestsByObra(obraId) {
  if (!obraId) return [];
  const { data, error } = await supabase.from('protestos').select('*').eq('obra_id', obraId);
  if (error) {
    console.error('Erro ao buscar protestos:', error);
    return [];
  }
  return data.map(p => ({
    id: p.id,
    obraId: p.obra_id,
    creditor: p.credor,
    value: parseFloat(p.valor),
    date: p.data_protesto,
    notary: p.cartorio,
    status: p.status,
    reason: 'Duplicata de Venda Mercantil não Paga'
  }));
}

export async function resolveProtestsForObra(obraId) {
  if (!obraId) return false;
  const { error } = await supabase
    .from('protestos')
    .update({ status: 'Regularizado' })
    .eq('obra_id', obraId)
    .eq('status', 'Ativo');
    
  if (error) {
    console.error('Erro ao regularizar protestos no Supabase:', error);
    return false;
  }
  return true;
}

// --- MÓDULO AUTENTICAÇÃO REAL ---
export async function loginUser(email, senha) {
  if (!email || !senha) return null;
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .eq('senha', senha)
    .single();
    
  if (error || !data) {
    console.error('Erro de autenticação no Supabase:', error);
    return null;
  }
  return {
    id: data.id,
    name: data.nome,
    email: data.email,
    role: data.role,
    initials: data.avatar_iniciais,
    obraId: data.obra_id,
    welcome: `Olá, ${data.nome.split(' ')[0]}! Bem-vindo de volta.`
  };
}

// --- MÓDULO SOLICITAÇÕES DE ACESSO ---
export async function submitAccessRequest({ nome, email, obra, mensagem }) {
  try {
    const { error } = await supabase.from('solicitacoes_acesso').insert([{
      nome,
      email,
      obra_solicitada: obra,
      mensagem: mensagem || '',
      status: 'pendente'
    }]);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Erro ao enviar solicitação:', err);
    return false;
  }
}

export async function getAccessRequests() {
  const { data, error } = await supabase
    .from('solicitacoes_acesso')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Erro ao buscar solicitações:', error);
    return [];
  }
  return data.map(r => ({
    id: r.id,
    nome: r.nome,
    email: r.email,
    obraSolicitada: r.obra_solicitada,
    mensagem: r.mensagem,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function updateAccessRequest(id, updates) {
  const { error } = await supabase
    .from('solicitacoes_acesso')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
  return true;
}

// --- MÓDULO USUÁRIOS (MASTER) ---
export async function getUsuarios() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*, obras(nome)')
    .order('nome', { ascending: true });
  if (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
  return data.map(u => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    role: u.role,
    initials: u.avatar_iniciais,
    obraId: u.obra_id,
    obraNome: u.obras ? u.obras.nome : 'Todas as Obras (Master/Diretor)',
    createdAt: u.created_at,
  }));
}

export async function createUsuario({ nome, email, senha, role, obraId }) {
  const iniciais = nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  const { data, error } = await supabase.from('usuarios').insert([{
    nome,
    email,
    senha,
    role,
    avatar_iniciais: iniciais,
    obra_id: obraId || null
  }]).select();
  if (error) throw error;
  return data[0];
}

export async function updateUsuario(id, updates) {
  const dbUpdates = { ...updates };
  if (updates.hasOwnProperty('obraId')) {
    dbUpdates.obra_id = updates.obraId;
    delete dbUpdates.obraId;
  }
  const { error } = await supabase.from('usuarios').update(dbUpdates).eq('id', id);
  if (error) throw error;
  return true;
}

export async function deleteUsuario(id) {
  const { error } = await supabase.from('usuarios').delete().eq('id', id);
  if (error) throw error;
  return true;
}
