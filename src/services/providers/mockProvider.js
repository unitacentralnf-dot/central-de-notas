import { supabase } from '../supabaseClient.js';
import { getIntegrationModes } from '../integrationModes.js';

const db = () => supabase;

export async function mockGetObras() {
  const { data, error } = await db().from('obras').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Erro ao buscar obras:', error);
    return [];
  }
  const { data: protestosData } = await db().from('protestos').select('obra_id').eq('status', 'Ativo');
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

export async function mockSaveObra(obra) {
  const { data, error } = await db().from('obras').upsert({
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

export async function mockDeleteObra(id) {
  const { error } = await db().from('obras').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function mockGetRules() {
  const { data, error } = await db().from('contas_fixas').select('*');
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
    leadTimeDays: 10,
    emailsAlert: '',
    phonesAlert: ''
  }));
}

export async function mockSaveRule(rule) {
  const { data, error } = await db().from('contas_fixas').upsert({
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

export async function mockDeleteRule(id) {
  const { error } = await db().from('contas_fixas').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function mockGetBills() {
  const { data, error } = await db().from('faturas').select('*, contas_fixas(obra_id)');
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
      mes, ano,
      status: f.status,
      valorReal: f.status !== 'nao_chegou' ? parseFloat(f.valor) : null,
      valorEstimado: parseFloat(f.valor),
      vencimentoReal: f.data_vencimento,
      vencimentoPadrao: new Date(f.data_vencimento).getDate(),
      codigoBarras: null,
      comprovante: null,
      alertDispatched: false
    };
  });
}

export async function mockSaveBill(bill) {
  const { data, error } = await db().from('faturas').upsert({
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

export async function mockGetNFes() {
  const { data, error } = await db().from('notas_fiscais').select('*');
  if (error) {
    console.error('Erro ao buscar notas fiscais:', error);
    return [];
  }
  return data.map(n => ({
    id: n.id,
    number: n.chave_acesso.substring(25, 34),
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
    items: []
  }));
}

export async function mockSyncSefaz(obraId) {
  const modes = getIntegrationModes();
  if (modes.nfe === 'disabled') {
    throw new Error('Integração NF-e está desativada. Ative em Integrações.');
  }
  if (modes.nfe !== 'fixtures') {
    throw new Error('Integração NF-e via Edge Function ainda não configurada. Use Fixtures em Integrações.');
  }

  // Fixtures: gera algumas NF-es de exemplo para manter o sistema operacional em desenvolvimento
  if (!obraId) throw new Error('Obra não informada para sync SEFAZ.');

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

export async function mockManifestNFe(nfeId, type) {
  let status_manifesto = 'Sem Manifesto';
  if (type === 'confirmacao') status_manifesto = 'Confirmada';
  if (type === 'desconhecimento') status_manifesto = 'Desconhecida';
  if (type === 'nao_realizada') status_manifesto = 'Nao Realizada';
  const { error } = await db().from('notas_fiscais').update({ status_manifesto }).eq('id', nfeId);
  return !error;
}

export async function mockLaunchNFe(nfeId, costCenter) {
  throw new Error('Lançamento contábil não implementado. API de integração contábil não configurada.');
}

export async function mockGetNotifications() {
  return [];
}

export async function mockDispatchManualAlert(billId, senderName) {
  console.log(`Alerta manual disparado por ${senderName} para a fatura ${billId}`);
  return true;
}

export async function mockRunCronCheckAlerts() {
  return 0;
}

export async function mockSimulateOCR(category, estimatedValue) {
  throw new Error('PlugOCR API não configurada. Configure VITE_PLUGOCR_TOKEN no .env');
}

export async function mockGetHistoricalData(ruleId) {
  const { data } = await db().from('faturas').select('*').eq('conta_fixa_id', ruleId).in('status', ['Pago', 'lancada', 'paga']);
  if (!data) return [];
  return data.map(f => {
    const [ano, mes] = f.mes_referencia.split('-');
    return { mes, ano, valorReal: parseFloat(f.valor) };
  });
}

export function mockInitializeData() {
  console.log('📡 Supabase: client anon key (admin via Edge Functions)');
  console.log('Dados inicializados (Nuvem/Supabase)');
}

export function mockAddNotification(type, message) {
  console.log(`[Notification - ${type}] ${message}`);
}

export async function mockCheckCnpjStatus(cnpj) {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  if (cleanCnpj.length !== 14) {
    throw new Error('CNPJ inválido. Deve conter 14 dígitos.');
  }

  try {
    const { data: cached, error } = await db()
      .from('cnpj_cache')
      .select('*')
      .eq('cnpj', cleanCnpj)
      .single();

    if (!error && cached) {
      const cacheAge = Date.now() - new Date(cached.ultima_consulta).getTime();
      if (cacheAge < 24 * 60 * 60 * 1000) {
        console.log(`[CNPJ.cache] Dados encontrados em cache para ${cleanCnpj}`);
        const d = cached.response_data;
        return {
          cnpj: cleanCnpj,
          razaoSocial: d.razao_social || d.nome_fantasia || cached.razao_social || 'N/D',
          situacao: d.situacao_cadastral || cached.situacao || 'DESCONHECIDA',
          ultimaAtualizacao: d.data_situacao_cadastral?.split('T')[0] || '',
          dataAbertura: d.data_abertura?.split('T')[0] || '',
          porte: d.porte || '',
          naturezaJuridica: d.natureza_juridica || '',
          cnae: d.cnae_fiscal_descricao || '',
          logradouro: d.logradouro || '',
          bairro: d.bairro || '',
          municipio: d.municipio || '',
          uf: d.uf || '',
          cep: d.cep || '',
          telefone: d.telefone1 || '',
          email: d.email || '',
          protestStatus: (d.situacao_cadastral || cached.situacao) === 'ATIVA' ? 'clean' : 'dirty',
        };
      }
    }
  } catch (e) {
    console.warn('[CNPJ.cache] Erro ao consultar cache:', e.message);
  }

  throw new Error('CNPJ não encontrado em cache. Ative VITE_DATA_PROVIDER=real para consultar CNPJ.ws');
}

export async function mockGetProtestsByObra(obraId) {
  if (!obraId) return [];
  const { data, error } = await db().from('protestos').select('*').eq('obra_id', obraId);
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

export async function mockResolveProtestsForObra(obraId) {
  if (!obraId) return false;
  const { error } = await db()
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

export async function mockScanProtestsByObra(obraId) {
  const modes = getIntegrationModes();
  if (modes.protests === 'disabled') {
    throw new Error('Integração de protestos está desativada. Ative em Integrações.');
  }
  if (modes.protests !== 'fixtures') {
    throw new Error('Integração de protestos via Edge Function ainda não configurada. Use Fixtures em Integrações.');
  }

  if (!obraId) throw new Error('Obra não informada para varredura.');

  // Fixtures: insere 0-2 protestos ativos aleatórios para esta obra
  const count = Math.random() < 0.55 ? 0 : (Math.random() < 0.75 ? 1 : 2);
  if (count === 0) return { inserted: 0 };

  const cartorios = ['1º Tabelionato - SP', '2º Tabelionato - SP', 'Cartório Central - SP'];
  const credores = ['BANCO XYZ', 'FORNECEDOR ALFA', 'DISTRIBUIDORA BETA'];

  const items = Array.from({ length: count }).map(() => ({
    obra_id: obraId,
    cartorio: cartorios[Math.floor(Math.random() * cartorios.length)],
    valor: parseFloat((Math.random() * 9000 + 300).toFixed(2)),
    data_protesto: new Date(Date.now() - 86400000 * (Math.floor(Math.random() * 60) + 1)).toISOString().split('T')[0],
    status: 'Ativo',
    credor: credores[Math.floor(Math.random() * credores.length)],
  }));

  const { error } = await db().from('protestos').insert(items);
  if (error) throw error;
  return { inserted: items.length };
}

export async function mockLoginUser(email, senha) {
  if (!email || !senha) return null;

  let userRecord = null;
  let authUserId = null;

  // 1. Tenta autenticar via Supabase Auth
  if (supabase) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email, password: senha,
    });
    if (!authError && authData?.user) {
      authUserId = authData.user.id;
    }
  }

  // 2. Busca o registro na tabela usuarios (por email, coluna sempre existe)
  const { data, error } = await db()
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .single();

  if (data && !error) {
    userRecord = data;
  }

  // 3. Se achou no banco, retorna (Auth é bônus, não requisito)
  if (userRecord) {
    return {
      id: userRecord.id,
      authUserId,
      name: userRecord.nome,
      email: userRecord.email,
      role: userRecord.role,
      initials: userRecord.avatar_iniciais,
      obraId: null,
      welcome: `Olá, ${userRecord.nome.split(' ')[0]}! Bem-vindo de volta.`
    };
  }

  console.error('Usuário não encontrado na tabela usuarios:', email);
  return null;
}

export async function mockSubmitAccessRequest({ nome, email, obra, mensagem }) {
  try {
    const { error } = await db().from('solicitacoes_acesso').insert([{
      nome, email,
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

export async function mockGetAccessRequests() {
  const { data, error } = await db()
    .from('solicitacoes_acesso')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Erro ao buscar solicitações:', error);
    return [];
  }
  return data.map(r => ({
    id: r.id, nome: r.nome, email: r.email,
    obraSolicitada: r.obra_solicitada,
    mensagem: r.mensagem, status: r.status,
    createdAt: r.created_at,
  }));
}

export async function mockUpdateAccessRequest(id, updates) {
  const { error } = await db()
    .from('solicitacoes_acesso')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
  return true;
}

export async function mockGetUsuarios() {
  const { data, error } = await db()
    .from('usuarios')
    .select('*')
    .order('nome', { ascending: true });
  if (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
  return data.map(u => ({
    id: u.id, nome: u.nome, email: u.email,
    role: u.role, initials: u.avatar_iniciais,
    obraId: null,
    obraNome: 'Todas as Obras (Master/Diretor)',
    createdAt: u.created_at,
  }));
}

export async function mockCreateUsuario({ nome, email, senha, role, obraId }) {
  const iniciais = nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();

  // Segurança: criação de usuários deve ser via Edge Function (service_role), não no browser.
  // Mantém operacional em dev: cria apenas o perfil local (sem senha) se já existir no Auth.
  const { data, error } = await db().from('usuarios').upsert({
    nome,
    email,
    role,
    avatar_iniciais: iniciais,
  }, { onConflict: 'email' }).select();
  if (error) throw error;
  return data?.[0] || null;
}

export async function mockUpdateUsuario(id, updates) {
  const dbUpdates = { ...updates };
  delete dbUpdates.obraId;
  const { error } = await db().from('usuarios').update(dbUpdates).eq('id', id);
  if (error) throw error;
  return true;
}

export async function mockDeleteUsuario(id) {
  const { error } = await db().from('usuarios').delete().eq('id', id);
  if (error) throw error;
  return true;
}
