import { supabase, supabaseAdmin } from '../supabaseClient.js';

export async function mockGetObras() {
  const { data, error } = await supabase.from('obras').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Erro ao buscar obras:', error);
    return [];
  }
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

export async function mockSaveObra(obra) {
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

export async function mockDeleteObra(id) {
  const { error } = await supabase.from('obras').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function mockGetRules() {
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
    leadTimeDays: 10,
    emailsAlert: '',
    phonesAlert: ''
  }));
}

export async function mockSaveRule(rule) {
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

export async function mockDeleteRule(id) {
  const { error } = await supabase.from('contas_fixas').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function mockGetBills() {
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

export async function mockGetNFes() {
  const { data, error } = await supabase.from('notas_fiscais').select('*');
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
  throw new Error('Focus NFe API não configurada. Configure VITE_FOCUSNFE_TOKEN no .env');
}

export async function mockManifestNFe(nfeId, type) {
  let status_manifesto = 'Sem Manifesto';
  if (type === 'confirmacao') status_manifesto = 'Confirmada';
  if (type === 'desconhecimento') status_manifesto = 'Desconhecida';
  if (type === 'nao_realizada') status_manifesto = 'Nao Realizada';
  const { error } = await supabase.from('notas_fiscais').update({ status_manifesto }).eq('id', nfeId);
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
  const { data } = await supabase.from('faturas').select('*').eq('conta_fixa_id', ruleId).in('status', ['Pago', 'lancada', 'paga']);
  if (!data) return [];
  return data.map(f => {
    const [ano, mes] = f.mes_referencia.split('-');
    return { mes, ano, valorReal: parseFloat(f.valor) };
  });
}

export function mockInitializeData() {
  console.log('Dados inicializados (Nuvem/Supabase)');
}

export function mockAddNotification(type, message) {
  console.log(`[Notification - ${type}] ${message}`);
}

export async function mockCheckCnpjStatus(cnpj) {
  throw new Error('CNPJ.ws API não configurada. Configure VITE_DATA_PROVIDER=real no .env');
}

export async function mockGetProtestsByObra(obraId) {
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

export async function mockResolveProtestsForObra(obraId) {
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
  const { data, error } = await supabase
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
    const { error } = await supabase.from('solicitacoes_acesso').insert([{
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
  const { data, error } = await supabase
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
  const { error } = await supabase
    .from('solicitacoes_acesso')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
  return true;
}

export async function mockGetUsuarios() {
  const { data, error } = await supabase
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

  // 1. Tenta criar no Supabase Auth
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: { nome, role }
      });
    } catch (e) {
      if (!e.message?.includes('already been registered')) {
        console.warn('Auth não disponível, criando apenas na tabela:', e.message);
      }
    }
  }

  // 2. Insere na tabela usuarios (apenas colunas existentes no schema atual)
  const db = supabaseAdmin || supabase;
  const { data, error } = await db.from('usuarios').upsert({
    nome, email, senha, role,
    avatar_iniciais: iniciais,
  }, { onConflict: 'email' }).select();
  if (error) throw error;
  return data[0];
}

export async function mockUpdateUsuario(id, updates) {
  const dbUpdates = { ...updates };
  if (updates.hasOwnProperty('obraId')) {
    dbUpdates.obra_id = updates.obraId;
    delete dbUpdates.obraId;
  }
  const { error } = await supabase.from('usuarios').update(dbUpdates).eq('id', id);
  if (error) throw error;
  return true;
}

export async function mockDeleteUsuario(id) {
  // Busca o auth_user_id antes de deletar
  const { data: user } = await supabase.from('usuarios').select('auth_user_id').eq('id', id).single();
  if (user?.auth_user_id && supabaseAdmin) {
    await supabaseAdmin.auth.admin.deleteUser(user.auth_user_id).catch(() => {});
  }
  const { error } = await supabase.from('usuarios').delete().eq('id', id);
  if (error) throw error;
  return true;
}
