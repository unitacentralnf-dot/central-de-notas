// Serviço de Gerenciamento de Estado e Dados no LocalStorage / Supabase
import { supabase } from './supabaseClient.js';

if (supabase) {
  console.log("🚀 [SaaS] Modo Híbrido Ativado: Conectado ao banco de dados Supabase.");
} else {
  console.log("⚠️ [SaaS] Modo Híbrido: Fallback para LocalStorage (Chaves do Supabase não configuradas no .env).");
}

const STORAGE_KEYS = {
  OBRAS: 'central_notas_obras',
  RULES: 'central_notas_rules',
  BILLS: 'central_notas_bills',
  NOTIFICATIONS: 'central_notas_notifications',
  PROTESTS: 'central_notas_protests',
  NFES: 'central_notas_nfes'
};

// Dados de Mock Iniciais
const INITIAL_OBRAS = [
  {
    id: 'obra-1',
    name: 'Residencial Bella Vista',
    cnpj: '12.345.678/0001-90', // CNPJ de teste com protesto
    address: 'Av. das Palmeiras, 1500 - Curitiba/PR',
    responsible: 'Eng. Pedro Henrique',
    email: 'pedro.bellavista@unita.com.br',
    phone: '(41) 99888-7766',
    protestStatus: 'clean', // 'clean', 'dirty'
    lastProtestCheck: null
  },
  {
    id: 'obra-2',
    name: 'Commercial Tower Unita',
    cnpj: '98.765.432/0001-10', // CNPJ Limpo
    address: 'Rua XV de Novembro, 500 - Joinville/SC',
    responsible: 'Enga. Mariana Souza',
    email: 'mariana.commercial@unita.com.br',
    phone: '(47) 99777-6655',
    protestStatus: 'clean',
    lastProtestCheck: null
  },
  {
    id: 'obra-3',
    name: 'Condomínio Green Park',
    cnpj: '45.678.901/0001-22', // CNPJ Limpo
    address: 'Av. das Nações, 200 - Londrina/PR',
    responsible: 'Eng. Rodrigo Alves',
    email: 'rodrigo.green@unita.com.br',
    phone: '(43) 99666-5544',
    protestStatus: 'clean',
    lastProtestCheck: null
  }
];

const INITIAL_RULES = [
  {
    id: 'rule-1',
    name: 'Energia Elétrica - Copel',
    category: 'Energia',
    dueDay: 10,
    estimatedValue: 2500.00,
    obraId: 'obra-1',
    leadTimeDays: 10, // Dias de antecedência padrão da UNITA
    emailsAlert: 'pedro.bellavista@unita.com.br, financeiro@unita.com.br',
    phonesAlert: '(41) 99888-7766, (41) 99111-2233'
  },
  {
    id: 'rule-2',
    name: 'Água e Esgoto - Sanepar',
    category: 'Água',
    dueDay: 15,
    estimatedValue: 850.00,
    obraId: 'obra-1',
    leadTimeDays: 7,
    emailsAlert: 'pedro.bellavista@unita.com.br',
    phonesAlert: '(41) 99888-7766'
  },
  {
    id: 'rule-3',
    name: 'Internet Fibra - Vivo',
    category: 'Internet',
    dueDay: 20,
    estimatedValue: 350.00,
    obraId: 'obra-1',
    leadTimeDays: 5,
    emailsAlert: 'pedro.bellavista@unita.com.br',
    phonesAlert: '(41) 99888-7766'
  },
  {
    id: 'rule-4',
    name: 'Energia Elétrica - Celesc',
    category: 'Energia',
    dueDay: 12,
    estimatedValue: 4200.00,
    obraId: 'obra-2',
    leadTimeDays: 10,
    emailsAlert: 'mariana.commercial@unita.com.br, financeiro@unita.com.br',
    phonesAlert: '(47) 99777-6655'
  },
  {
    id: 'rule-5',
    name: 'Segurança Canteiro - Khronos',
    category: 'Segurança',
    dueDay: 5,
    estimatedValue: 1800.00,
    obraId: 'obra-2',
    leadTimeDays: 3,
    emailsAlert: 'mariana.commercial@unita.com.br',
    phonesAlert: '(47) 99777-6655'
  }
];

// Faturas Históricas de Fevereiro, Março e Abril de 2026 + Mês Atual (Maio/2026)
const INITIAL_BILLS = [
  // Copel Obra 1 Histórico
  {
    id: 'bill-1-feb',
    ruleId: 'rule-1',
    obraId: 'obra-1',
    mes: '02',
    ano: '2026',
    status: 'paga',
    valorEstimado: 2500.00,
    valorReal: 2300.00,
    vencimentoPadrao: 10,
    vencimentoReal: '2026-02-10',
    codigoBarras: '836200000230000001083620000023000000108362',
    comprovante: 'comprovante_pagamento_feb.pdf',
    alertDispatched: false
  },
  {
    id: 'bill-1-mar',
    ruleId: 'rule-1',
    obraId: 'obra-1',
    mes: '03',
    ano: '2026',
    status: 'paga',
    valorEstimado: 2500.00,
    valorReal: 2450.00,
    vencimentoPadrao: 10,
    vencimentoReal: '2026-03-10',
    codigoBarras: '836200000245000001083620000024500000108362',
    comprovante: 'comprovante_pagamento_mar.pdf',
    alertDispatched: false
  },
  {
    id: 'bill-1-apr',
    ruleId: 'rule-1',
    obraId: 'obra-1',
    mes: '04',
    ano: '2026',
    status: 'paga',
    valorEstimado: 2500.00,
    valorReal: 3100.00, // Acima de 20% do estimado (R$ 2.500) -> Anomalia de consumo!
    vencimentoPadrao: 10,
    vencimentoReal: '2026-04-10',
    codigoBarras: '836200000310000001083620000031000000108362',
    comprovante: 'comprovante_pagamento_apr.pdf',
    alertDispatched: false
  },
  // Sanepar Obra 1 Histórico
  {
    id: 'bill-2-mar',
    ruleId: 'rule-2',
    obraId: 'obra-1',
    mes: '03',
    ano: '2026',
    status: 'paga',
    valorEstimado: 850.00,
    valorReal: 820.00,
    vencimentoPadrao: 15,
    vencimentoReal: '2026-03-15',
    codigoBarras: '836200000082000001583620000008200000158362',
    comprovante: 'comprovante_pagamento_sanepar_mar.pdf',
    alertDispatched: false
  },
  {
    id: 'bill-2-apr',
    ruleId: 'rule-2',
    obraId: 'obra-1',
    mes: '04',
    ano: '2026',
    status: 'paga',
    valorEstimado: 850.00,
    valorReal: 840.00,
    vencimentoPadrao: 15,
    vencimentoReal: '2026-04-15',
    codigoBarras: '836200000084000001583620000008400000158362',
    comprovante: 'comprovante_pagamento_sanepar_apr.pdf',
    alertDispatched: false
  },

  // Faturas de Maio/2026 (Mês de trabalho)
  // Copel Obra 1: Hoje é 23/05/2026, vencimento dia 10. Status: "Não Chegou" (Super Atrasada)
  {
    id: 'bill-1-may',
    ruleId: 'rule-1',
    obraId: 'obra-1',
    mes: '05',
    ano: '2026',
    status: 'nao_chegou',
    valorEstimado: 2500.00,
    valorReal: null,
    vencimentoPadrao: 10,
    vencimentoReal: null,
    codigoBarras: null,
    comprovante: null,
    alertDispatched: true // Alerta já disparado pois já passou da data
  },
  // Sanepar Obra 1: Vence dia 15. Status: "Recebida (A Lançar)", com valor real preenchido, mas não integrada no ERP/Banco
  {
    id: 'bill-2-may',
    ruleId: 'rule-2',
    obraId: 'obra-1',
    mes: '05',
    ano: '2026',
    status: 'recebida',
    valorEstimado: 850.00,
    valorReal: 910.00,
    vencimentoPadrao: 15,
    vencimentoReal: '2026-05-15',
    codigoBarras: '836200000091000001583620000009100000158362',
    comprovante: 'fatura_sanepar_maio.pdf',
    alertDispatched: false
  },
  // Internet Vivo Obra 1: Vence dia 20. Status: "Lançada" no financeiro.
  {
    id: 'bill-3-may',
    ruleId: 'rule-3',
    obraId: 'obra-1',
    mes: '05',
    ano: '2026',
    status: 'lancada',
    valorEstimado: 350.00,
    valorReal: 350.00,
    vencimentoPadrao: 20,
    vencimentoReal: '2026-05-20',
    codigoBarras: '836200000035000002083620000003500000208362',
    comprovante: 'fatura_vivo_maio.pdf',
    alertDispatched: false
  },
  // Segurança Khronos Obra 2: Vence dia 5. Status: "Paga"
  {
    id: 'bill-5-may',
    ruleId: 'rule-5',
    obraId: 'obra-2',
    mes: '05',
    ano: '2026',
    status: 'paga',
    valorEstimado: 1800.00,
    valorReal: 1800.00,
    vencimentoPadrao: 5,
    vencimentoReal: '2026-05-05',
    codigoBarras: '836200000180000000583620000018000000058362',
    comprovante: 'comprovante_segurança_maio.pdf',
    alertDispatched: false
  }
];

const INITIAL_NFES = [
  {
    id: 'nfe-1',
    number: '000.124.580',
    serie: '1',
    issuer: 'DISTRIBUIDORA DE CIMENTO PARANÁ S/A',
    issuerCnpj: '44.555.666/0001-22',
    value: 8520.00,
    issueDate: '2026-05-18T14:30:00-03:00',
    accessKey: '41260544555666000122550010001245801000284719',
    obraId: 'obra-1',
    manifestStatus: 'pendente', // 'pendente', 'confirmado', 'desconhecido', 'nao_realizado'
    launchStatus: 'pendente', // 'pendente', 'lancado'
    costCenter: null,
    items: [
      { code: '001', name: 'CIMENTO CP-II 50KG', qty: 200, unit: 'Saco', price: 42.60 }
    ]
  },
  {
    id: 'nfe-2',
    number: '000.089.471',
    serie: '1',
    issuer: 'AÇOS E FERRAGENS BRASIL LTDA',
    issuerCnpj: '11.222.333/0001-44',
    value: 24350.00,
    issueDate: '2026-05-20T09:15:00-03:00',
    accessKey: '41260511222333000144550010000894711000394828',
    obraId: 'obra-1',
    manifestStatus: 'confirmado',
    launchStatus: 'lancado',
    costCenter: 'AÇO ESTRUTURAL',
    items: [
      { code: '042', name: 'VERGÃO DE AÇO CA-50 10MM', qty: 50, unit: 'Barra', price: 487.00 }
    ]
  },
  {
    id: 'nfe-3',
    number: '000.002.541',
    serie: '3',
    issuer: 'BRITA E AREIA SÃO JOSÉ EIRELI',
    issuerCnpj: '99.888.777/0001-88',
    value: 3200.00,
    issueDate: '2026-05-15T11:00:00-03:00',
    accessKey: '42260599888777000188550030000025411000948271',
    obraId: 'obra-2',
    manifestStatus: 'pendente',
    launchStatus: 'pendente',
    costCenter: null,
    items: [
      { code: '009', name: 'AREIA MÉDIA LAVADA', qty: 20, unit: 'm³', price: 90.00 },
      { code: '010', name: 'BRITA Nº 1 comercial', qty: 10, unit: 'm³', price: 140.00 }
    ]
  }
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    timestamp: '2026-05-20T10:00:00-03:00',
    type: 'warning',
    message: 'ALERTA: Conta [Energia Elétrica - Copel] da obra Residencial Bella Vista não foi enviada pelo ADM. Vencimento padrão era 10/05/2026 (Atraso de 10 dias). Alerta enviado por WhatsApp para Eng. Pedro Henrique.',
  },
  {
    id: 'notif-2',
    timestamp: '2026-05-22T08:30:00-03:00',
    type: 'info',
    message: 'LOG: Consulta de regularidade efetuada para a obra Residencial Bella Vista. CNPJ: 12.345.678/0001-90.'
  }
];

const DATA_VERSION = '2'; // Incrementar aqui ao mudar o schema de dados

// Inicializar dados no LocalStorage se não existirem
export function initializeData() {
  // Controle de versão: se o schema mudou, limpa o cache antigo
  const storedVersion = localStorage.getItem('central_notas_version');
  if (storedVersion !== DATA_VERSION) {
    localStorage.removeItem(STORAGE_KEYS.OBRAS);
    localStorage.removeItem(STORAGE_KEYS.RULES);
    localStorage.removeItem(STORAGE_KEYS.BILLS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.PROTESTS);
    localStorage.removeItem(STORAGE_KEYS.NFES);
    localStorage.setItem('central_notas_version', DATA_VERSION);
  }

  if (!localStorage.getItem(STORAGE_KEYS.OBRAS)) {
    localStorage.setItem(STORAGE_KEYS.OBRAS, JSON.stringify(INITIAL_OBRAS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.RULES)) {
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(INITIAL_RULES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BILLS)) {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(INITIAL_BILLS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NFES)) {
    localStorage.setItem(STORAGE_KEYS.NFES, JSON.stringify(INITIAL_NFES));
  }
}


// --- MÓDULO OBRAS ---
export function getObras() {
  initializeData();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.OBRAS)) || [];
}

export function saveObra(obra) {
  const obras = getObras();
  if (obra.id) {
    const idx = obras.findIndex(o => o.id === obra.id);
    if (idx !== -1) obras[idx] = { ...obras[idx], ...obra };
  } else {
    obra.id = 'obra-' + Date.now();
    obra.protestStatus = 'clean';
    obra.lastProtestCheck = null;
    obras.push(obra);
  }
  localStorage.setItem(STORAGE_KEYS.OBRAS, JSON.stringify(obras));
  
  if (supabase) {
    // Sync async (fire and forget) com Supabase
    supabase.from('obras').upsert({ id: obra.id, nome: obra.name, cnpj: obra.cnpj, endereco: obra.address }).then(() => console.log('Sincronizado com Supabase (obras)'));
  }
  return obra;
}

export function deleteObra(id) {
  let obras = getObras();
  obras = obras.filter(o => o.id !== id);
  localStorage.setItem(STORAGE_KEYS.OBRAS, JSON.stringify(obras));
}

// --- MÓDULO REGRAS (RECORRÊNCIAS) ---
export function getRules() {
  initializeData();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.RULES)) || [];
}

export function getRulesByObra(obraId) {
  return getRules().filter(r => r.obraId === obraId);
}

export function saveRule(rule) {
  const rules = getRules();
  // Forçar conversão de tipos numéricos
  rule.dueDay = parseInt(rule.dueDay);
  rule.estimatedValue = parseFloat(rule.estimatedValue);
  rule.leadTimeDays = parseInt(rule.leadTimeDays);

  if (rule.id) {
    const idx = rules.findIndex(r => r.id === rule.id);
    if (idx !== -1) rules[idx] = { ...rules[idx], ...rule };
  } else {
    rule.id = 'rule-' + Date.now();
    rules.push(rule);
  }
  localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
  
  // Após salvar uma nova regra, se for o mês atual, gera as faturas desse mês
  const hoje = new Date();
  const mesStr = String(hoje.getMonth() + 1).padStart(2, '0');
  const anoStr = String(hoje.getFullYear());
  generateMonthlyBills(mesStr, anoStr);
  
  if (supabase) {
    supabase.from('contas_fixas').upsert({ id: rule.id, obra_id: rule.obraId, nome: rule.name, tipo: rule.category, dia_vencimento: rule.dueDay, valor_medio: rule.estimatedValue }).then(() => console.log('Sincronizado com Supabase (regras)'));
  }
  
  return rule;
}

export function deleteRule(id) {
  let rules = getRules();
  rules = rules.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
}

// --- MÓDULO FATURAS MENSAIS ---
export function getBills() {
  initializeData();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.BILLS)) || [];
}

export function saveBill(bill) {
  const bills = getBills();
  const idx = bills.findIndex(b => b.id === bill.id);
  if (idx !== -1) {
    bills[idx] = { ...bills[idx], ...bill };
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
    
    if (supabase) {
      supabase.from('faturas').upsert({ id: bill.id, conta_fixa_id: bill.ruleId, mes_referencia: `${bill.ano}-${bill.mes}`, valor: bill.valorReal || bill.valorEstimado, data_vencimento: bill.vencimentoReal || `${bill.ano}-${bill.mes}-${String(bill.vencimentoPadrao).padStart(2,'0')}`, status: bill.status }).then(() => console.log('Sincronizado com Supabase (faturas)'));
    }
    
    return bills[idx];
  }
  return null;
}

// Gera faturas para um mês/ano com base nas regras cadastradas
export function generateMonthlyBills(mes, ano) {
  const rules = getRules();
  const bills = getBills();
  let updated = false;

  rules.forEach(rule => {
    // Verifica se já existe uma fatura criada para esta regra neste mês/ano
    const exists = bills.some(b => b.ruleId === rule.id && b.mes === mes && b.ano === ano);
    if (!exists) {
      const newBill = {
        id: `bill-${rule.id}-${mes}-${ano}`,
        ruleId: rule.id,
        obraId: rule.obraId,
        mes: mes,
        ano: ano,
        status: 'nao_chegou',
        valorEstimado: rule.estimatedValue,
        valorReal: null,
        vencimentoPadrao: rule.dueDay,
        vencimentoReal: null,
        codigoBarras: null,
        comprovante: null,
        alertDispatched: false
      };
      bills.push(newBill);
      updated = true;
    }
  });

  if (updated) {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
  }
  return getBills();
}

// Retorna as faturas do mês filtradas por obra (se houver)
export function getBillsForPeriod(mes, ano, obraId = '') {
  generateMonthlyBills(mes, ano); // Garante que as faturas existam
  let bills = getBills().filter(b => b.mes === mes && b.ano === ano);
  if (obraId) {
    bills = bills.filter(b => b.obraId === obraId);
  }
  return bills;
}

// Retorna dados históricos de uma conta fixa (regra) para gráficos
export function getHistoricalData(ruleId) {
  const bills = getBills();
  return bills
    .filter(b => b.ruleId === ruleId && (b.status === 'paga' || b.valorReal !== null))
    .sort((a, b) => {
      // Ordena por ano e mês
      return (parseInt(a.ano) * 12 + parseInt(a.mes)) - (parseInt(b.ano) * 12 + parseInt(b.mes));
    });
}

// --- ALERTAS E NOTIFICAÇÕES ---
export function getNotifications() {
  initializeData();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || [];
}

export function addNotification(type, message) {
  const notifications = getNotifications();
  const newNotif = {
    id: 'notif-' + Date.now(),
    timestamp: new Date().toISOString(),
    type: type, // 'success', 'warning', 'info', 'danger'
    message: message
  };
  notifications.unshift(newNotif); // Insere no topo
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  return newNotif;
}

// Verifica se há contas próximas de vencer que ainda não chegaram ou não foram lançadas
export function runCronCheckAlerts() {
  const bills = getBills();
  const rules = getRules();
  const obras = getObras();
  const hoje = new Date(); // Simulado como 23/05/2026
  // Para fins do nosso protótipo, vamos simular que a data atual é 23/05/2026
  const currentYear = 2026;
  const currentMonth = 5; // Maio
  const currentDay = 23;
  
  let alertsDispatched = 0;

  bills.forEach(bill => {
    // Apenas faturas do mês corrente que não foram lançadas/pagas
    if (parseInt(bill.ano) === currentYear && parseInt(bill.mes) === currentMonth) {
      if (bill.status === 'nao_chegou' && !bill.alertDispatched) {
        const rule = rules.find(r => r.id === bill.ruleId);
        const obra = obras.find(o => o.id === bill.obraId);
        if (rule && obra) {
          const dueDay = bill.vencimentoPadrao;
          const daysLeft = dueDay - currentDay;
          const leadTime = rule.leadTimeDays;

          // Se a data de vencimento padrão estiver abaixo da antecedência parametrizada
          if (daysLeft <= leadTime) {
            bill.alertDispatched = true;
            alertsDispatched++;
            
            let statusText = daysLeft < 0 
              ? `VENCIDA há ${Math.abs(daysLeft)} dias` 
              : `vence em ${daysLeft} dias (prazo limite de cobrança de ${leadTime} dias atingido)`;
            
            const msg = `ALERTA CRÍTICO: Conta [${rule.name}] da obra [${obra.name}] ${statusText} e a fatura não foi enviada pelo ADM. Alerta automático enviado via WhatsApp/E-mail para: ${rule.emailsAlert || obra.email} e ${rule.phonesAlert || obra.phone}.`;
            
            addNotification('warning', msg);
          }
        }
      }
    }
  });

  if (alertsDispatched > 0) {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
  }
  
  return alertsDispatched;
}

// Forçar disparo manual de cobrança por um consultor
export function dispatchManualAlert(billId, senderName) {
  const bills = getBills();
  const bill = bills.find(b => b.id === billId);
  if (bill) {
    const rule = getRules().find(r => r.id === bill.ruleId);
    const obra = getObras().find(o => o.id === bill.obraId);
    if (rule && obra) {
      const msg = `COBRANÇA DIRETA (${senderName}): Cobrança urgente disparada para o ADM da obra [${obra.name}] referente à conta [${rule.name}]. Notificação enviada por WhatsApp para: ${rule.phonesAlert || obra.phone}.`;
      addNotification('danger', msg);
      return true;
    }
  }
  return false;
}

// --- SIMULAÇÕES PREMIUM ---

// 1. Simulação de OCR Inteligente de Fatura PDF
export function simulateOCR(category, estimatedValue) {
  // Gera valores próximos do estimado com variações reais
  const variation = (Math.random() * 0.3) - 0.08; // -8% a +22% de variação
  const realValue = parseFloat((estimatedValue * (1 + variation)).toFixed(2));
  
  // Gera linha digitável fictícia
  const randBlock = () => Math.floor(10000 + Math.random() * 90000);
  const code = `836200000${Math.floor(realValue).toString().padStart(4, '0')}00${randBlock()}00${randBlock()}00${randBlock()}00${randBlock()}`;
  
  // Define o vencimento padrão para este mês
  const dueDay = category === 'Energia' ? 10 : (category === 'Água' ? 15 : 20);
  const dueRealDate = `2026-05-${dueDay.toString().padStart(2, '0')}`;

  // Detecção de anomalia de consumo (se o valor for > 20% do estimado)
  const isAnomaly = realValue > (estimatedValue * 1.2);

  return {
    value: realValue,
    dueDate: dueRealDate,
    barcode: code,
    isAnomaly: isAnomaly,
    anomalyPercentage: Math.round(((realValue - estimatedValue) / estimatedValue) * 100)
  };
}

// 2. Simulação de Varredura de Protesto por CNPJ
export function verifyProtests(obraId) {
  const obras = getObras();
  const idx = obras.findIndex(o => o.id === obraId);
  if (idx !== -1) {
    const obra = obras[idx];
    obra.lastProtestCheck = new Date().toISOString();
    
    // CNPJ Residencial Bella Vista tem protesto na simulação
    if (obra.cnpj === '12.345.678/0001-90') {
      obra.protestStatus = 'dirty';
      obras[idx] = obra;
      localStorage.setItem(STORAGE_KEYS.OBRAS, JSON.stringify(obras));
      
      const msg = `ALERTA PREOCUPANTE: Varredura de Regularidade fiscal detectou 2 PROTESTOS ATIVOS no CNPJ ${obra.cnpj} da obra [${obra.name}]. Notificação prioritária enviada para o GGO e Financeiro.`;
      addNotification('danger', msg);
      
      return {
        status: 'dirty',
        details: [
          {
            id: 'prot-1',
            creditor: 'FORNECEDOR DE AÇO SUL S/A',
            value: 12450.00,
            date: '2026-04-12',
            notary: '2º Cartório de Protesto de Títulos de Curitiba',
            reason: 'Duplicata de Venda Mercantil não Paga'
          },
          {
            id: 'prot-2',
            creditor: 'LOCADORA DE EQUIPAMENTOS MAQMAX LTDA',
            value: 4800.00,
            date: '2026-05-02',
            notary: '5º Cartório de Protesto de Títulos de Curitiba',
            reason: 'Duplicata de Serviços'
          }
        ]
      };
    } else {
      obra.protestStatus = 'clean';
      obras[idx] = obra;
      localStorage.setItem(STORAGE_KEYS.OBRAS, JSON.stringify(obras));
      
      const msg = `LOG: Varredura de Regularidade concluída para o CNPJ ${obra.cnpj} da obra [${obra.name}]. Nenhuma restrição fiscal ou protesto ativo detectado.`;
      addNotification('success', msg);
      
      return { status: 'clean', details: [] };
    }
  }
  return null;
}

// 3. Resolução de Protesto (Envio de Anuência)
export function resolveProtest(obraId, voucherName) {
  const obras = getObras();
  const idx = obras.findIndex(o => o.id === obraId);
  if (idx !== -1) {
    const obra = obras[idx];
    obra.protestStatus = 'clean';
    obras[idx] = obra;
    localStorage.setItem(STORAGE_KEYS.OBRAS, JSON.stringify(obras));
    
    const msg = `LOG: Status do CNPJ ${obra.cnpj} da obra [${obra.name}] atualizado para REGULARIZADO. O comprovante de anuência/pagamento do protesto (${voucherName}) foi carregado pelo Financeiro.`;
    addNotification('success', msg);
    return true;
  }
  return false;
}

// --- MÓDULO NOTAS FISCAIS (NFe / Sefaz) ---
export function getNFes() {
  initializeData();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.NFES)) || [];
}

export function getNFesByObra(obraId = '') {
  const nfes = getNFes();
  if (obraId) {
    return nfes.filter(n => n.obraId === obraId);
  }
  return nfes;
}

export function saveNFe(nfe) {
  const nfes = getNFes();
  const idx = nfes.findIndex(n => n.id === nfe.id);
  if (idx !== -1) {
    nfes[idx] = { ...nfes[idx], ...nfe };
  } else {
    nfe.id = 'nfe-' + Date.now();
    nfes.push(nfe);
  }
  localStorage.setItem(STORAGE_KEYS.NFES, JSON.stringify(nfes));
  return nfe;
}

// Efetua a manifestação do destinatário
export function manifestNFe(nfeId, status) {
  const nfes = getNFes();
  const idx = nfes.findIndex(n => n.id === nfeId);
  if (idx !== -1) {
    const nfe = nfes[idx];
    nfe.manifestStatus = status;
    nfes[idx] = nfe;
    localStorage.setItem(STORAGE_KEYS.NFES, JSON.stringify(nfes));
    
    let statusText = '';
    if (status === 'confirmado') statusText = 'CONFIRMADA';
    if (status === 'desconhecido') statusText = 'DESCONHECIDA';
    if (status === 'nao_realizado') statusText = 'NÃO REALIZADA';
    
    addNotification('success', `LOG: Manifesto efetuado para a NF-e nº ${nfe.number}. Status: ${statusText} pelo ADM da Obra.`);
    return true;
  }
  return false;
}

// Efetua o lançamento financeiro da nota vinculando ao centro de custo
export function launchNFe(nfeId, costCenter) {
  const nfes = getNFes();
  const idx = nfes.findIndex(n => n.id === nfeId);
  if (idx !== -1) {
    const nfe = nfes[idx];
    nfe.launchStatus = 'lancada';
    nfe.costCenter = costCenter;
    nfes[idx] = nfe;
    localStorage.setItem(STORAGE_KEYS.NFES, JSON.stringify(nfes));
    
    addNotification('success', `LOG: Lançamento efetuado no Contas a Pagar para a NF-e nº ${nfe.number} (Valor: R$ ${nfe.value.toFixed(2)}). Classificação: ${costCenter}.`);
    return true;
  }
  return false;
}

// Simula a sincronização e puxada de novas notas da Sefaz
export function syncSefaz(obraId) {
  const obras = getObras();
  const obra = obras.find(o => o.id === obraId);
  if (!obra) return 0;
  
  const nfes = getNFes();
  
  // Verifica se já existe uma nota simulada de sincronização para evitar duplicar em cliques seguidos
  const existsSyncNfe = nfes.some(n => n.number === '000.158.940' && n.obraId === obraId);
  if (existsSyncNfe) return 0; // Nenhuma nota nova disponível
  
  // Cria uma nova nota simulada vinda da sincronização
  const newNfe = {
    id: `nfe-sync-${Date.now()}`,
    number: '000.158.940',
    serie: '1',
    issuer: 'MADEREIRA E COMPENSADOS PINHO REI LTDA',
    issuerCnpj: '22.333.444/0001-55',
    value: 5890.00,
    issueDate: new Date().toISOString(),
    accessKey: `41260522333444000155550010001589401000${Math.floor(100000 + Math.random() * 900000)}`,
    obraId: obraId,
    manifestStatus: 'pendente',
    launchStatus: 'pendente',
    costCenter: null,
    items: [
      { code: '102', name: 'MADEIRA COMPENSADA PLASTIFICADA 12MM', qty: 60, unit: 'Chapa', price: 98.16 }
    ]
  };
  
  nfes.push(newNfe);
  localStorage.setItem(STORAGE_KEYS.NFES, JSON.stringify(nfes));
  
  addNotification('info', `LOG: Sincronização Sefaz concluída para a obra [${obra.name}]. Nova nota identificada: NF-e nº ${newNfe.number} emitida por ${newNfe.issuer}.`);
  
  return 1; // 1 nova nota importada
}
