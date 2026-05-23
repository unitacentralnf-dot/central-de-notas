import { 
  getObras, getRules, getBillsForPeriod, saveRule, deleteRule, saveBill, 
  getHistoricalData, simulateOCR, dispatchManualAlert, addNotification 
} from '../services/dataService.js';

let activeTab = 'monthly'; // 'monthly' ou 'rules'
let activeMes = '05'; // Maio fixado para o protótipo
let activeAno = '2026';
let selectedHistoryRuleId = '';

export async function renderFixedBills(container, currentRole, activeObraId) {
  // Inicializa filtro de obra com o valor temporário se houver (vindo do clique no dashboard)
  const tempFilter = localStorage.getItem('temp_filter_obra');
  if (tempFilter) {
    activeObraId = tempFilter;
    localStorage.removeItem('temp_filter_obra');
    activeTab = 'monthly';
  }

  const obras = await getObras();
  if (!activeObraId && obras.length > 0) {
    activeObraId = obras[0].id;
  }

  const html = `
    <div class="fixed-bills-view animate-fade-in">
      <!-- Abas de Navegação -->
      <div class="tabs-navigation">
        <button class="tab-btn ${activeTab === 'monthly' ? 'active' : ''}" id="tab-monthly-btn">Acompanhamento Mensal</button>
        <button class="tab-btn ${activeTab === 'rules' ? 'active' : ''}" id="tab-rules-btn">Regras & Histórico de Consumo</button>
      </div>

      <!-- Área de Conteúdo da Aba Ativa -->
      <div id="tab-content-container">
        <!-- Renderizado dinamicamente -->
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Vinculação de Abas
  document.getElementById('tab-monthly-btn').addEventListener('click', async () => {
    activeTab = 'monthly';
    document.getElementById('tab-monthly-btn').classList.add('active');
    document.getElementById('tab-rules-btn').classList.remove('active');
    await renderActiveTabContent(currentRole, activeObraId);
  });

  document.getElementById('tab-rules-btn').addEventListener('click', async () => {
    activeTab = 'rules';
    document.getElementById('tab-rules-btn').classList.add('active');
    document.getElementById('tab-monthly-btn').classList.remove('active');
    await renderActiveTabContent(currentRole, activeObraId);
  });

  await renderActiveTabContent(currentRole, activeObraId);
}

async function renderActiveTabContent(currentRole, activeObraId) {
  const container = document.getElementById('tab-content-container');
  if (!container) return;

  if (activeTab === 'monthly') {
    await renderMonthlyView(container, currentRole, activeObraId);
  } else {
    await renderRulesView(container, currentRole, activeObraId);
  }
}

// --- ABA 1: ACOMPANHAMENTO MENSAL ---
async function renderMonthlyView(container, currentRole, activeObraId) {
  const obras = await getObras();
  const selectedObra = obras.find(o => o.id === activeObraId);
  const bills = await getBillsForPeriod(activeMes, activeAno, activeObraId);
  const rules = await getRules();

  const fmt = (v) => v ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';

  // Separar faturas por colunas do Kanban
  const colNaoChegou = bills.filter(b => b.status === 'nao_chegou');
  const colRecebida = bills.filter(b => b.status === 'recebida');
  const colLancadaPaga = bills.filter(b => b.status === 'lancada' || b.status === 'paga');

  const html = `
    <!-- Barra de Filtros -->
    <div class="filter-bar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div style="font-size: 0.95rem; color: hsl(var(--text-muted)); font-weight: 500;">
        Obra Integrada: <strong style="color: white;">${selectedObra ? selectedObra.name : 'Nenhuma'}</strong> <span style="font-size: 0.8rem; color: hsl(var(--text-dim)); font-family: monospace; margin-left: 6px;">${selectedObra ? `(CNPJ: ${selectedObra.cnpj})` : ''}</span>
      </div>
      
      <div class="filter-item">
        <label class="form-label" style="font-size: 0.75rem;">Mês/Ano Referência</label>
        <select id="filter-period" class="filter-select" aria-label="Filtrar por período">
          <option value="05/2026" ${activeMes === '05' && activeAno === '2026' ? 'selected' : ''}>Maio / 2026</option>
          <option value="06/2026" ${activeMes === '06' && activeAno === '2026' ? 'selected' : ''}>Junho / 2026</option>
        </select>
      </div>
    </div>


    <!-- Kanban Grid -->
    <div class="kanban-grid" aria-label="Quadro de acompanhamento das contas">
      <!-- Coluna 1: Não Chegou / Pendente -->
      <div class="kanban-column" id="col-nao-chegou">
        <div class="kanban-column-header">
          <span class="kanban-column-title" style="color: hsl(var(--color-warning));">
            <span class="badge-dot" style="background-color: hsl(var(--color-warning)); width: 8px; height: 8px;"></span>
            Não Chegou / Atrasadas
          </span>
          <span class="kanban-column-count">${colNaoChegou.length}</span>
        </div>
        <div class="kanban-cards">
          ${colNaoChegou.map(b => {
            const rule = rules.find(r => r.id === b.ruleId);
            if (!rule) return '';
            const obra = obras.find(o => o.id === b.obraId);
            
            // Lógica para aviso visual de cobrança (se passou do dia de vencimento menos a tolerância)
            const dueDay = b.vencimentoPadrao;
            const isVencida = dueDay < 23; // Hoje simulado como dia 23

            return `
              <div class="bill-card card-actionable" data-id="${b.id}" data-action="upload">
                <div class="bill-card-header">
                  <div>
                    <div class="bill-card-name">${rule.name}</div>
                    <div class="bill-card-cat">${rule.category}</div>
                  </div>
                  ${isVencida ? '<span class="badge badge-danger btn-sm ping-pulse" style="padding: 2px 6px; font-size: 0.65rem;">VENCIDA</span>' : ''}
                </div>
                <div class="bill-card-details">
                  <div>Vencimento Padrão: <strong>Dia ${dueDay}</strong></div>
                  <div>Orçamento Estimado: <strong>${fmt(b.valorEstimado)}</strong></div>
                  ${obra ? `<div style="font-size: 0.75rem; color: hsl(var(--text-dim)); margin-top: 4px;">Obra: ${obra.name}</div>` : ''}
                </div>
                <div class="bill-card-footer">
                  <span style="font-size: 0.75rem; color: hsl(var(--text-dim));">Ação: ${currentRole === 'adm' ? 'Anexar Fatura' : 'Visualizar'}</span>
                  ${currentRole !== 'adm' ? `<button class="btn btn-danger btn-sm manual-cobrar-btn" data-bill="${b.id}" style="padding: 2px 6px; font-size: 0.7rem; border-radius: var(--radius-sm);">Cobrar ADM</button>` : ''}
                </div>
              </div>
            `;
          }).join('')}
          ${colNaoChegou.length === 0 ? '<div style="color: hsl(var(--text-dim)); font-size: 0.85rem; text-align: center; padding: 20px;">Nenhuma conta nesta coluna.</div>' : ''}
        </div>
      </div>

      <!-- Coluna 2: Recebida (A Lançar) -->
      <div class="kanban-column" id="col-recebida">
        <div class="kanban-column-header">
          <span class="kanban-column-title" style="color: hsl(var(--color-info));">
            <span class="badge-dot" style="background-color: hsl(var(--color-info)); width: 8px; height: 8px;"></span>
            Recebida (A Lançar no Contas a Pagar)
          </span>
          <span class="kanban-column-count">${colRecebida.length}</span>
        </div>
        <div class="kanban-cards">
          ${colRecebida.map(b => {
            const rule = rules.find(r => r.id === b.ruleId);
            if (!rule) return '';
            
            const dueDay = b.vencimentoPadrao;
            const dtReal = b.vencimentoReal ? new Date(b.vencimentoReal).toLocaleDateString('pt-BR') : `Dia ${dueDay}`;
            
            // Verificar anomalia de consumo
            const isAnomaly = b.valorReal > (b.valorEstimado * 1.2);

            return `
              <div class="bill-card card-actionable" data-id="${b.id}" data-action="process">
                <div class="bill-card-header">
                  <div>
                    <div class="bill-card-name">${rule.name}</div>
                    <div class="bill-card-cat">${rule.category}</div>
                  </div>
                  ${isAnomaly ? '<span class="badge badge-warning" style="padding: 2px 6px; font-size: 0.65rem;">CONSUMO ALTO</span>' : ''}
                </div>
                <div class="bill-card-details">
                  <div>Vencimento: <strong>${dtReal}</strong></div>
                  <div>Orçado: <strong>${fmt(b.valorEstimado)}</strong></div>
                  <div style="color: white;">Real Lido: <strong>${fmt(b.valorReal)}</strong></div>
                </div>
                <div class="bill-card-footer">
                  <span style="font-size: 0.75rem; color: hsl(var(--text-dim));">Ação: ${currentRole === 'adm' ? 'Lançar/Pagar' : 'Visualizar'}</span>
                  ${currentRole !== 'adm' ? `<button class="btn btn-danger btn-sm manual-cobrar-btn" data-bill="${b.id}" style="padding: 2px 6px; font-size: 0.7rem; border-radius: var(--radius-sm);">Cobrar Financeiro</button>` : ''}
                </div>
              </div>
            `;
          }).join('')}
          ${colRecebida.length === 0 ? '<div style="color: hsl(var(--text-dim)); font-size: 0.85rem; text-align: center; padding: 20px;">Nenhuma conta nesta coluna.</div>' : ''}
        </div>
      </div>

      <!-- Coluna 3: Lançada / Paga -->
      <div class="kanban-column" id="col-finalizadas">
        <div class="kanban-column-header">
          <span class="kanban-column-title" style="color: hsl(var(--color-success));">
            <span class="badge-dot" style="background-color: hsl(var(--color-success)); width: 8px; height: 8px;"></span>
            Lançada / Liquidada
          </span>
          <span class="kanban-column-count">${colLancadaPaga.length}</span>
        </div>
        <div class="kanban-cards">
          ${colLancadaPaga.map(b => {
            const rule = rules.find(r => r.id === b.ruleId);
            if (!rule) return '';
            
            const dueDay = b.vencimentoPadrao;
            const dtReal = b.vencimentoReal ? new Date(b.vencimentoReal).toLocaleDateString('pt-BR') : `Dia ${dueDay}`;
            const isPaga = b.status === 'paga';

            return `
              <div class="bill-card card-actionable" data-id="${b.id}" data-action="view-only">
                <div class="bill-card-header">
                  <div>
                    <div class="bill-card-name">${rule.name}</div>
                    <div class="bill-card-cat">${rule.category}</div>
                  </div>
                  <span class="badge ${isPaga ? 'badge-success' : 'badge-info'}" style="padding: 2px 6px; font-size: 0.65rem;">
                    ${isPaga ? 'PAGA' : 'LANÇADA'}
                  </span>
                </div>
                <div class="bill-card-details">
                  <div>Vencimento: <strong>${dtReal}</strong></div>
                  <div>Valor Pago: <strong>${fmt(b.valorReal)}</strong></div>
                </div>
                <div class="bill-card-footer">
                  <span style="font-size: 0.75rem; color: hsl(var(--text-dim));">Status finalizado</span>
                </div>
              </div>
            `;
          }).join('')}
          ${colLancadaPaga.length === 0 ? '<div style="color: hsl(var(--text-dim)); font-size: 0.85rem; text-align: center; padding: 20px;">Nenhuma conta nesta coluna.</div>' : ''}
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Evento dos Filtros
  document.getElementById('filter-period').addEventListener('change', async (e) => {
    const val = e.target.value;
    const parts = val.split('/');
    activeMes = parts[0];
    activeAno = parts[1];
    await renderMonthlyView(container, currentRole, activeObraId);
  });


  // Cobrança manual
  container.querySelectorAll('.manual-cobrar-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation(); // Evita abrir o modal do card
      const billId = e.currentTarget.getAttribute('data-bill');
      let roleName = 'Consultor';
      if (currentRole === 'ggo') roleName = 'GGO / Diretor';
      if (currentRole === 'engenheiro') roleName = 'Engenheiro';
      if (currentRole === 'financeiro') roleName = 'Financeiro';

      await dispatchManualAlert(billId, roleName);
      await renderMonthlyView(container, currentRole, activeObraId);
    });
  });

  // Clique nos cards
  container.querySelectorAll('.card-actionable').forEach(card => {
    card.addEventListener('click', (e) => {
      const billId = e.currentTarget.getAttribute('data-id');
      const action = e.currentTarget.getAttribute('data-action');
      
      if (action === 'upload') {
        openUploadModal(billId, currentRole, activeObraId, container);
      } else if (action === 'process') {
        openProcessModal(billId, currentRole, activeObraId, container);
      } else {
        openViewOnlyModal(billId);
      }
    });
  });
}

// --- ABA 2: LISTAGEM DE REGRAS E GRÁFICOS DE CONSUMO ---
async function renderRulesView(container, currentRole, activeObraId) {
  const rules = await getRulesByObra(activeObraId);
  const obras = await getObras();
  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const isAdm = currentRole === 'adm';

  const html = `
    <div class="layout-split">
      <!-- Coluna Esquerda: Listagem de Regras -->
      <div class="section-panel" style="margin-bottom: 0;">
        <div class="panel-header">
          <h2 class="panel-title">Contas Fixas Cadastradas</h2>
          ${isAdm 
            ? '<button class="btn btn-primary btn-sm" id="btn-add-rule">+ Nova Regra</button>' 
            : '<span style="font-size: 0.8rem; color: hsl(var(--text-dim)); font-weight: 500;">Modo Visualização (Somente Leitura)</span>'
          }
        </div>

        <div class="table-responsive">
          <table class="table-premium" aria-label="Lista de contas fixas cadastradas">
            <thead>
              <tr>
                <th>Conta Fixa</th>
                <th>Categoria</th>
                <th>Obra Vinculada</th>
                <th>Vencimento</th>
                <th>Estimado</th>
                <th>Antecedência Alerta</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${rules.map(rule => {
                const obra = obras.find(o => o.id === rule.obraId);
                return `
                  <tr>
                    <td><span style="font-weight: 600; color: white;">${rule.name}</span></td>
                    <td><span class="badge badge-info">${rule.category}</span></td>
                    <td>${obra ? obra.name : 'Não vinculada'}</td>
                    <td>Todo dia ${rule.dueDay}</td>
                    <td>${fmt(rule.estimatedValue)}</td>
                    <td><span style="font-weight:600; color: hsl(var(--color-warning));">${rule.leadTimeDays} dias</span></td>
                    <td>
                      <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-sm btn-view-chart" data-id="${rule.id}" style="padding: 4px 8px; font-size: 0.75rem;">Consumo</button>
                        ${isAdm ? `<button class="btn btn-danger btn-sm btn-delete-rule" data-id="${rule.id}" style="padding: 4px 8px; font-size: 0.75rem;">×</button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
              ${rules.length === 0 ? '<tr><td colspan="7" style="text-align: center; color: hsl(var(--text-dim));">Nenhuma regra cadastrada.</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Coluna Direita: Gráfico de Consumo / Histórico -->
      <div class="section-panel" style="margin-bottom: 0;" id="consumption-panel">
        <div class="panel-header">
          <h2 class="panel-title" id="chart-panel-title">Gráfico de Histórico</h2>
        </div>
        <div id="chart-content-area" style="text-align: center; padding: 40px 0;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 48px; height: 48px; color: hsl(var(--text-dim)); margin-bottom: 12px; margin-inline: auto;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          <p style="color: hsl(var(--text-muted)); font-size: 0.9rem;">Clique no botão "Consumo" ao lado de uma conta fixa para carregar o gráfico histórico e de projeções.</p>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Lógica de Nova Regra (ADM)
  if (isAdm) {
    document.getElementById('btn-add-rule').addEventListener('click', () => {
      openRuleModal(null, container, currentRole, activeObraId);
    });
  }

  // Deletar regra (ADM)
  container.querySelectorAll('.btn-delete-rule').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (confirm('Tem certeza que deseja excluir esta regra de conta fixa?')) {
        await deleteRule(id);
        await renderRulesView(container, currentRole, activeObraId);
      }
    });
  });

  // Mostrar gráfico de consumo
  container.querySelectorAll('.btn-view-chart').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      selectedHistoryRuleId = id;
      await renderChartPanel(id);
    });
  });

  // Se já tiver uma regra selecionada anteriormente, re-renderiza o gráfico
  if (selectedHistoryRuleId) {
    await renderChartPanel(selectedHistoryRuleId);
  }
}

// Renderiza o gráfico de consumo de uma regra de conta fixa
async function renderChartPanel(ruleId) {
  const chartContainer = document.getElementById('chart-content-area');
  const chartTitle = document.getElementById('chart-panel-title');
  if (!chartContainer) return;

  const rules = await getRules();
  const rule = rules.find(r => r.id === ruleId);
  if (!rule) return;

  chartTitle.textContent = `Consumo: ${rule.name}`;

  const history = await getHistoricalData(ruleId);
  
  // Próximos meses projetados
  const projMeses = [];
  const hoje = new Date();
  for(let i = 1; i <= 3; i++) {
    const futureDate = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    const mStr = String(futureDate.getMonth() + 1).padStart(2, '0');
    const aStr = String(futureDate.getFullYear());
    projMeses.push({ mes: mStr, ano: aStr, status: 'projetada', valorReal: null, valorEstimado: rule.estimatedValue });
  }

  const allBars = [...history, ...projMeses];
  
  const maxVal = Math.max(...allBars.map(b => b.valorReal || b.valorEstimado || 0), 100);

  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Calcular estatísticas
  const valoresReais = history.map(h => h.valorReal).filter(v => v !== null);
  const mediaConsumo = valoresReais.length > 0 ? (valoresReais.reduce((a, b) => a + b, 0) / valoresReais.length) : rule.estimatedValue;

  chartContainer.innerHTML = `
    <div class="chart-container animate-fade-in">
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.85rem; color: hsl(var(--text-muted));">
        <span>Histórico de Lançamentos</span>
        <span style="color: hsl(var(--color-success));">Média: ${fmt(mediaConsumo)}</span>
      </div>

      <!-- Grid de Barras -->
      <div class="chart-bar-grid">
        ${allBars.map(b => {
          const val = b.valorReal !== null ? b.valorReal : b.valorEstimado;
          const hPercent = Math.max(5, Math.round((val / maxVal) * 100));
          
          let colorClass = '';
          let barTooltipText = '';

          if (b.status === 'projetada') {
            colorClass = 'background: repeating-linear-gradient(45deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.2) 10px, rgba(99, 102, 241, 0.4) 10px, rgba(99, 102, 241, 0.4) 20px); border: 1px dashed hsl(var(--color-primary));';
            barTooltipText = `Projeção: ${fmt(val)}`;
          } else {
            // Se for histórico, verifica se tem anomalia (>20% da média)
            const isAnomaly = b.valorReal > (rule.estimatedValue * 1.2);
            if (isAnomaly) {
              colorClass = 'background: linear-gradient(to top, hsl(var(--color-danger)), hsl(var(--color-warning)));';
              barTooltipText = `Anomalia! Valor: ${fmt(val)} (${Math.round(((val - rule.estimatedValue)/rule.estimatedValue)*100)}% acima do orçado)`;
            } else {
              colorClass = 'background: linear-gradient(to top, hsl(var(--color-primary)), hsl(var(--color-info)));';
              barTooltipText = `Lançamento: ${fmt(val)}`;
            }
          }

          return `
            <div class="chart-bar-wrapper">
              <div class="chart-bar" style="height: ${hPercent}%; ${colorClass}">
                <div class="chart-bar-tooltip">${barTooltipText}</div>
              </div>
              <span class="chart-bar-label">${b.mes}/${b.ano.substring(2)}</span>
            </div>
          `;
        }).join('')}
      </div>

      <div style="display: flex; gap: 12px; justify-content: center; font-size: 0.75rem; margin-top: 16px;">
        <div style="display: flex; align-items: center; gap: 4px;">
          <span style="display: inline-block; width: 10px; height: 10px; background: linear-gradient(to top, hsl(var(--color-primary)), hsl(var(--color-info))); border-radius: 2px;"></span>
          <span>Histórico Normal</span>
        </div>
        <div style="display: flex; align-items: center; gap: 4px;">
          <span style="display: inline-block; width: 10px; height: 10px; background: linear-gradient(to top, hsl(var(--color-danger)), hsl(var(--color-warning))); border-radius: 2px;"></span>
          <span>Desvio de Consumo (&gt;20%)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 4px;">
          <span style="display: inline-block; width: 10px; height: 10px; background: rgba(99, 102, 241, 0.3); border: 1px dashed hsl(var(--color-primary)); border-radius: 2px;"></span>
          <span>Vencimentos Futuros</span>
        </div>
      </div>
      
      <p style="font-size: 0.8rem; color: hsl(var(--text-dim)); margin-top: 16px; text-align: left; line-height: 1.4;">
        * A linha tracejada de <strong>Vencimentos Futuros</strong> projeta os próximos meses com base no orçamento estimado de <strong>${fmt(rule.estimatedValue)}</strong> todo dia <strong>${rule.dueDay}</strong>.
      </p>
    </div>
  `;
}

// --- MODAIS DO MÓDULO ---

// 1. Modal para Criar/Editar Regra (ADM)
function openRuleModal(rule = null, viewContainer, currentRole, activeObraId) {
  const modal = document.getElementById('global-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalFooter = document.getElementById('modal-footer');
  const obras = getObras();

  modalTitle.textContent = rule ? 'Editar Regra de Conta Fixa' : 'Cadastrar Regra de Conta Fixa';

  modalBody.innerHTML = `
    <form id="rule-form">
      <input type="hidden" id="rule-id" value="${rule ? rule.id : ''}">
      
      <div class="form-group">
        <label class="form-label" for="rule-name-input">Nome da Conta Fixa</label>
        <input type="text" id="rule-name-input" class="form-control" placeholder="Ex: Energia Elétrica - Copel" value="${rule ? rule.name : ''}" required>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="rule-category-input">Categoria</label>
          <select id="rule-category-input" class="form-control" required>
            <option value="Energia" ${rule && rule.category === 'Energia' ? 'selected' : ''}>Energia</option>
            <option value="Água" ${rule && rule.category === 'Água' ? 'selected' : ''}>Água</option>
            <option value="Internet" ${rule && rule.category === 'Internet' ? 'selected' : ''}>Internet/Link</option>
            <option value="Aluguel" ${rule && rule.category === 'Aluguel' ? 'selected' : ''}>Aluguel</option>
            <option value="Segurança" ${rule && rule.category === 'Segurança' ? 'selected' : ''}>Segurança</option>
            <option value="Outros" ${rule && rule.category === 'Outros' ? 'selected' : ''}>Outros</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="rule-obra-input">Obra Relacionada</label>
          <select id="rule-obra-input" class="form-control" required>
            ${obras.map(o => `<option value="${o.id}" ${rule && rule.obraId === o.id ? 'selected' : ''}>${o.name}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="rule-dueDay-input">Dia Vencimento Padrão</label>
          <input type="number" id="rule-dueDay-input" class="form-control" min="1" max="31" placeholder="Ex: 10" value="${rule ? rule.dueDay : '10'}" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="rule-value-input">Valor Orçado Estimado (R$)</label>
          <input type="number" id="rule-value-input" class="form-control" step="0.01" placeholder="Ex: 2500" value="${rule ? rule.estimatedValue : ''}" required>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="rule-leadTime-input">Prazo Limite para Cobrança (Dias antes do Vencimento)</label>
        <select id="rule-leadTime-input" class="form-control" required>
          <option value="10" ${rule && rule.leadTimeDays === 10 ? 'selected' : (!rule ? 'selected' : '')}>10 dias (Padrão UNITA)</option>
          <option value="7" ${rule && rule.leadTimeDays === 7 ? 'selected' : ''}>7 dias</option>
          <option value="5" ${rule && rule.leadTimeDays === 5 ? 'selected' : ''}>5 dias</option>
          <option value="3" ${rule && rule.leadTimeDays === 3 ? 'selected' : ''}>3 dias</option>
        </select>
      </div>

      <div style="border-top: 1px dotted var(--border-light); margin-top: 16px; padding-top: 16px;">
        <h4 style="font-size: 0.8rem; text-transform: uppercase; color: white; margin-bottom: 12px;">Contatos para Alerta</h4>
        
        <div class="form-group">
          <label class="form-label" for="rule-emails-input">E-mails (Separados por vírgula)</label>
          <input type="text" id="rule-emails-input" class="form-control" placeholder="Ex: engenheiro@unita.com.br, financeiro@unita.com.br" value="${rule ? rule.emailsAlert : ''}">
        </div>

        <div class="form-group">
          <label class="form-label" for="rule-phones-input">WhatsApp (Separados por vírgula)</label>
          <input type="text" id="rule-phones-input" class="form-control" placeholder="Ex: (41) 99888-7766, (41) 99111-2233" value="${rule ? rule.phonesAlert : ''}">
        </div>
      </div>
    </form>
  `;

  modalFooter.innerHTML = `
    <button class="btn btn-secondary" id="btn-close-modal">Cancelar</button>
    <button class="btn btn-primary" id="btn-save-rule-submit">Salvar Regra</button>
  `;

  modal.classList.add('active');

  const close = () => modal.classList.remove('active');
  document.getElementById('btn-close-modal').addEventListener('click', close);
  document.getElementById('close-modal-btn').addEventListener('click', close);

  document.getElementById('btn-save-rule-submit').addEventListener('click', async () => {
    const form = document.getElementById('rule-form');
    if (!form.reportValidity()) return;

    const saved = await saveRule({
      id: document.getElementById('rule-id').value || null,
      name: document.getElementById('rule-name-input').value,
      category: document.getElementById('rule-category-input').value,
      obraId: document.getElementById('rule-obra-input').value,
      dueDay: document.getElementById('rule-dueDay-input').value,
      estimatedValue: document.getElementById('rule-value-input').value,
      leadTimeDays: document.getElementById('rule-leadTime-input').value,
      emailsAlert: document.getElementById('rule-emails-input').value,
      phonesAlert: document.getElementById('rule-phones-input').value
    });

    addNotification('info', `LOG: Regra de Conta Fixa [${saved.name}] salva com sucesso no sistema pelo Administrador.`);
    close();
    
    await renderRulesView(viewContainer, currentRole, activeObraId);
  });
}

// 2. Modal de Upload e OCR Simulado (ADM / Consultor)
async function openUploadModal(billId, currentRole, activeObraId, viewContainer) {
  const modal = document.getElementById('global-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalFooter = document.getElementById('modal-footer');
  
  const bills = await getBillsForPeriod(activeMes, activeAno, activeObraId);
  const bill = bills.find(b => b.id === billId);
  const rules = await getRules();
  const rule = rules.find(r => r.id === bill.ruleId);
  
  if (!bill || !rule) return;

  const isAdm = currentRole === 'adm';

  modalTitle.textContent = isAdm ? 'Anexar Fatura - Leitura OCR Inteligente' : 'Fatura Pendente (Modo Consulta)';

  if (!isAdm) {
    // Tela modo visualização de pendência para Engenheiro/GGO/Financeiro
    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 16px; border-radius: var(--radius-md); text-align: center; color: hsl(var(--color-danger));">
          <strong>Fatura Pendente de Lançamento</strong><br>
          Esta fatura de <strong>${rule.name}</strong> para o mês de ${activeMes}/${activeAno} ainda não foi anexada pelo ADM da Obra.
        </div>
        
        <table class="table-premium" style="margin-top: 10px;" aria-label="Detalhes da fatura pendente">
          <tr>
            <td style="font-weight: 600; width: 180px;">Valor Estimado:</td>
            <td>${bill.valorEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
          </tr>
          <tr>
            <td style="font-weight: 600;">Vencimento Previsto:</td>
            <td>Dia ${bill.vencimentoPadrao} (${bill.vencimentoPadrao}/${activeMes}/${activeAno})</td>
          </tr>
          <tr>
            <td style="font-weight: 600;">Contatos Vinculados:</td>
            <td style="font-size: 0.8rem; color: hsl(var(--text-muted));">
              E-mails: ${rule.emailsAlert || 'Nenhum'}<br>
              Whats: ${rule.phonesAlert || 'Nenhum'}
            </td>
          </tr>
        </table>
      </div>
    `;
    modalFooter.innerHTML = `
      <button class="btn btn-secondary" id="btn-close-modal">Fechar</button>
      <button class="btn btn-danger" id="btn-cobrar-adm-modal">Disparar WhatsApp de Cobrança ao ADM</button>
    `;
    modal.classList.add('active');
    
    const close = () => modal.classList.remove('active');
    document.getElementById('btn-close-modal').addEventListener('click', close);
    document.getElementById('close-modal-btn').addEventListener('click', close);
    
    document.getElementById('btn-cobrar-adm-modal').addEventListener('click', () => {
      dispatchManualAlert(billId, currentRole === 'ggo' ? 'GGO / Diretor' : (currentRole === 'financeiro' ? 'Financeiro' : 'Engenheiro'));
      close();
      const tabContainer = document.getElementById('tab-content-container');
      renderMonthlyView(tabContainer, currentRole);
    });
    return;
  }

  // Tela modo edição/alimentação para o ADM
  modalBody.innerHTML = `
    <div id="ocr-simulation-container">
      <p style="font-size: 0.85rem; color: hsl(var(--text-muted)); margin-bottom: 16px;">
        Arraste a fatura ou clique no simulador para usar a inteligência artificial para extrair os dados do boleto automaticamente.
      </p>

      <!-- Zona de Arrastar e Soltar Simulada -->
      <div class="upload-zone" id="ocr-trigger-zone" role="button" tabindex="0" aria-label="Zona de simulação de OCR">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
        </svg>
        <div class="upload-zone-text">
          Arraste o PDF da fatura aqui ou <span style="text-decoration: underline;">clique para SIMULAR LEITURA OCR</span>
        </div>
      </div>

      <!-- Formulário de Confirmação (Desabilitado inicialmente até rodar o OCR) -->
      <form id="bill-upload-form" style="margin-top: 24px;">
        <input type="hidden" id="bill-id" value="${billId}">
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="bill-value-input">Valor Real Lido (R$)</label>
            <input type="number" id="bill-value-input" class="form-control" step="0.01" required>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="bill-date-input">Data de Vencimento Real</label>
            <input type="date" id="bill-date-input" class="form-control" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="bill-barcode-input">Linha Digitável / Código de Barras</label>
          <input type="text" id="bill-barcode-input" class="form-control" placeholder="83620000000..." required>
        </div>

        <div id="anomaly-alert-container" style="display: none; margin-top: 16px;">
          <!-- Injetado dinamicamente caso o valor dê alto demais -->
        </div>
      </form>
    </div>
  `;

  modalFooter.innerHTML = `
    <button class="btn btn-secondary" id="btn-close-modal">Cancelar</button>
    <button class="btn btn-primary" id="btn-save-bill-upload" disabled>Salvar Lançamento</button>
  `;

  modal.classList.add('active');

  const close = () => modal.classList.remove('active');
  document.getElementById('btn-close-modal').addEventListener('click', close);
  document.getElementById('close-modal-btn').addEventListener('click', close);

  // Trigger Simulação OCR
  const ocrZone = document.getElementById('ocr-trigger-zone');
  
  const handleOcrClick = () => {
    // Muda a zona para estado de escaneamento
    ocrZone.innerHTML = `
      <div class="scan-box">
        <div class="scan-line"></div>
        <div class="scanning-text">LENDO BOLETO VIA IA...</div>
      </div>
    `;
    
    // Simula tempo de leitura de OCR
    setTimeout(async () => {
      const ocrResult = await simulateOCR(rule.category, bill.valorEstimado);
      
      // Volta o texto original
      ocrZone.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="color: hsl(var(--color-success));">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <div class="upload-zone-text" style="color: hsl(var(--color-success)); font-weight: 600;">
          Fatura processada com sucesso via OCR!
        </div>
      `;

      // Preenche os inputs do formulário
      const valInput = document.getElementById('bill-value-input');
      const dateInput = document.getElementById('bill-date-input');
      const barInput = document.getElementById('bill-barcode-input');
      const btnSave = document.getElementById('btn-save-bill-upload');
      
      if(valInput) valInput.value = ocrResult.realValue;
      if(dateInput) dateInput.value = ocrResult.dueRealDate;
      if(barInput) barInput.value = ocrResult.barcode;
      if(btnSave) btnSave.removeAttribute('disabled');

      // Verifica anomalia
      const anomalyContainer = document.getElementById('anomaly-alert-container');
      const isAnomaly = ocrResult.realValue > (bill.valorEstimado * 1.2);
      if (anomalyContainer) {
        if (isAnomaly) {
          const anomalyPercentage = Math.round(((ocrResult.realValue - bill.valorEstimado)/bill.valorEstimado)*100);
          anomalyContainer.style.display = 'block';
          anomalyContainer.innerHTML = `
            <div style="background-color: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); padding: 12px; border-radius: var(--radius-sm); color: hsl(var(--color-warning)); font-size: 0.8rem; line-height: 1.4;">
              ⚠️ <strong>DESVIO DE CONSUMO DETECTADO!</strong><br>
              O valor identificado (${ocrResult.realValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) é <strong>${anomalyPercentage}% superior</strong> ao orçamento de referência (${bill.valorEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}).<br>
              Recomenda-se que o engenheiro fiscalize vazamentos no local.
            </div>
          `;
        } else {
          anomalyContainer.style.display = 'none';
        }
      }
    }, 1800);
  };

  ocrZone.addEventListener('click', handleOcrClick);
  ocrZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleOcrClick();
    }
  });

  // Salvar
  document.getElementById('btn-save-bill-upload').addEventListener('click', async () => {
    const valInput = document.getElementById('bill-value-input');
    const dateInput = document.getElementById('bill-date-input');
    const barInput = document.getElementById('bill-barcode-input');

    if (!valInput.value || !dateInput.value || !barInput.value) return;

    bill.status = 'recebida';
    bill.valorReal = parseFloat(valInput.value);
    bill.vencimentoReal = dateInput.value;
    bill.codigoBarras = barInput.value;
    bill.comprovante = 'fatura_anexada_automatica.pdf';

    await saveBill(bill);
    
    // Logar atividade
    const isAnomaly = bill.valorReal > (bill.valorEstimado * 1.2);
    let logMsg = `LOG: Fatura de [${rule.name}] de Maio/2026 enviada pelo ADM da Obra. Valor Real: R$ ${bill.valorReal.toFixed(2)}.`;
    if (isAnomaly) {
      logMsg += ` ⚠️ ALERTA: Desvio de custo na obra de +${Math.round(((bill.valorReal - bill.valorEstimado)/bill.valorEstimado)*100)}%!`;
      // addNotification('warning', logMsg);
    } else {
      // addNotification('success', logMsg);
    }

    close();
    await renderMonthlyView(viewContainer, currentRole, activeObraId);
  });
}

// 3. Modal de Registrar Lançamento/Pagamento (ADM / Consultor)
async function openProcessModal(billId, currentRole, activeObraId, viewContainer) {
  const modal = document.getElementById('global-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalFooter = document.getElementById('modal-footer');
  
  const bills = await getBillsForPeriod(activeMes, activeAno, activeObraId);
  const bill = bills.find(b => b.id === billId);
  const rules = await getRules();
  const rule = rules.find(r => r.id === bill.ruleId);
  
  if (!bill || !rule) return;

  const isAdm = currentRole === 'adm';

  modalTitle.textContent = isAdm ? 'Registrar Lançamento Financeiro' : 'Fatura Recebida (Aguardando Financeiro)';

  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (!isAdm) {
    // Apenas consulta para Engenheiros/GGO/Financeiro
    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background-color: rgba(14, 165, 233, 0.1); border: 1px solid rgba(14, 165, 233, 0.2); padding: 16px; border-radius: var(--radius-md); text-align: center; color: hsl(var(--color-info));">
          <strong>Fatura Recebida & Aguardando Integração Financeira</strong><br>
          Anexada pelo ADM da Obra. Aguardando processamento no contas a pagar.
        </div>
        
        <table class="table-premium" aria-label="Informações da fatura recebida">
          <tr>
            <td style="font-weight: 600; width: 180px;">Valor Real Lido:</td>
            <td style="color: white; font-weight: 700;">${fmt(bill.valorReal)}</td>
          </tr>
          <tr>
            <td style="font-weight: 600;">Data Vencimento Real:</td>
            <td>${new Date(bill.vencimentoReal).toLocaleDateString('pt-BR')}</td>
          </tr>
          <tr>
            <td style="font-weight: 600;">Linha Digitável:</td>
            <td style="font-family: monospace; font-size: 0.8rem;">${bill.codigoBarras}</td>
          </tr>
          <tr>
            <td style="font-weight: 600;">PDF da Fatura:</td>
            <td><a href="#" style="color: hsl(var(--color-primary)); font-weight: 600; text-decoration: none;">fatura_anexada.pdf (Visualizar)</a></td>
          </tr>
        </table>
      </div>
    `;
    modalFooter.innerHTML = `
      <button class="btn btn-secondary" id="btn-close-modal">Fechar</button>
      <button class="btn btn-danger" id="btn-cobrar-fin-modal">Cobrar Financeiro (Lançamento)</button>
    `;
    modal.classList.add('active');
    
    const close = () => modal.classList.remove('active');
    document.getElementById('btn-close-modal').addEventListener('click', close);
    document.getElementById('close-modal-btn').addEventListener('click', close);
    
    document.getElementById('btn-cobrar-fin-modal').addEventListener('click', async () => {
      const msg = `COBRANÇA FINANCEIRO (${currentRole.toUpperCase()}): Fatura de [${rule.name}] já foi enviada pelo canteiro, mas ainda não consta como integrada no banco. Cobrança enviada ao Financeiro.`;
      addNotification('warning', msg);
      close();
      await renderMonthlyView(viewContainer, currentRole, activeObraId);
    });
    return;
  }

  // Formulário para o ADM atualizar status para Lançado ou Pago
  modalBody.innerHTML = `
    <div>
      <h4 style="color: white; margin-bottom: 12px;">Dados da Fatura</h4>
      
      <table class="table-premium" style="margin-bottom: 24px;" aria-label="Detalhes da fatura para lançamento">
        <tr>
          <td style="font-weight: 600; width: 150px;">Valor Real:</td>
          <td style="color: white; font-weight: 700; font-size: 1.1rem;">${fmt(bill.valorReal)}</td>
        </tr>
        <tr>
          <td style="font-weight: 600;">Vencimento:</td>
          <td>${new Date(bill.vencimentoReal).toLocaleDateString('pt-BR')}</td>
        </tr>
        <tr>
          <td style="font-weight: 600;">Linha Digitável:</td>
          <td style="font-family: monospace; font-size: 0.8rem; word-break: break-all;">${bill.codigoBarras}</td>
        </tr>
      </table>

      <form id="bill-process-form">
        <div class="form-group">
          <label class="form-label" for="bill-action-select">Mudar Status Financeiro</label>
          <select id="bill-action-select" class="form-control">
            <option value="lancada" selected>Lançada (Agendada/Lote de Contas a Pagar)</option>
            <option value="paga">Liquidada / Paga (Comprovante Anexado)</option>
          </select>
        </div>

        <div class="form-group" id="lote-field">
          <label class="form-label" for="bill-lote-input">Código/Nº Lote de Lançamento ERP</label>
          <input type="text" id="bill-lote-input" class="form-control" placeholder="Ex: LOTE-2026-05987" required>
        </div>

        <div class="form-group" id="comprovante-field" style="display: none;">
          <label class="form-label" for="bill-voucher-input">Carregar Comprovante de Pagamento (PDF/PNG)</label>
          <input type="file" id="bill-voucher-input" class="form-control" accept=".pdf,.png,.jpg">
        </div>
      </form>
    </div>
  `;

  modalFooter.innerHTML = `
    <button class="btn btn-secondary" id="btn-close-modal">Cancelar</button>
    <button class="btn btn-primary" id="btn-process-submit">Confirmar Lançamento</button>
  `;

  modal.classList.add('active');

  const close = () => modal.classList.remove('active');
  document.getElementById('btn-close-modal').addEventListener('click', close);
  document.getElementById('close-modal-btn').addEventListener('click', close);

  // Toggle Campos com base no status selecionado
  const selectStatus = document.getElementById('bill-action-select');
  const loteField = document.getElementById('lote-field');
  const compField = document.getElementById('comprovante-field');

  selectStatus.addEventListener('change', (e) => {
    if (e.target.value === 'lancada') {
      loteField.style.display = 'block';
      compField.style.display = 'none';
      document.getElementById('bill-lote-input').setAttribute('required', 'true');
    } else {
      loteField.style.display = 'none';
      compField.style.display = 'block';
      document.getElementById('bill-lote-input').removeAttribute('required');
    }
  });

  // Salvar
  document.getElementById('btn-process-submit').addEventListener('click', async () => {
    const form = document.getElementById('bill-process-form');
    if (!form.reportValidity()) return;

    const status = selectStatus.value;
    bill.status = status;
    
    if (status === 'lancada') {
      const lote = document.getElementById('bill-lote-input').value;
      bill.comprovante = `lote_erp_${lote}.txt`;
      addNotification('success', `LOG: Fatura de [${rule.name}] de Maio/2026 marcada como LANÇADA pelo ADM. Nº Lote ERP: ${lote}.`);
    } else {
      bill.comprovante = `comprovante_pagamento_maio.pdf`;
      addNotification('success', `LOG: Fatura de [${rule.name}] de Maio/2026 marcada como LIQUIDADA pelo ADM. Comprovante anexado.`);
    }

    await saveBill(bill);
    close();
    await renderMonthlyView(viewContainer, currentRole, activeObraId);
  });
}

// 4. Modal Visualização Apenas (Contas finalizadas)
async function openViewOnlyModal(billId) {
  const modal = document.getElementById('global-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalFooter = document.getElementById('modal-footer');
  
  const bills = await getBillsForPeriod(activeMes, activeAno, null); // view global de leitura
  const bill = bills.find(b => b.id === billId);
  const rules = await getRules();
  const rule = rules.find(r => r.id === bill.ruleId);
  
  if (!bill || !rule) return;

  modalTitle.textContent = 'Detalhes da Fatura Processada';

  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  modalBody.innerHTML = `
    <div>
      <div style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 16px; border-radius: var(--radius-md); text-align: center; color: hsl(var(--color-success)); margin-bottom: 20px;">
        <strong>Fatura Processada no Sistema</strong><br>
        Esta fatura foi quitada ou lançada de forma regular no sistema pelo ADM.
      </div>
      
      <table class="table-premium" aria-label="Detalhes da fatura processada">
        <tr>
          <td style="font-weight: 600; width: 180px;">Status Atual:</td>
          <td>
            <span class="badge ${bill.status === 'paga' ? 'badge-success' : 'badge-info'}">
              ${bill.status.toUpperCase()}
            </span>
          </td>
        </tr>
        <tr>
          <td style="font-weight: 600;">Valor Pago/Lançado:</td>
          <td style="color: white; font-weight: 700; font-size: 1.1rem;">${fmt(bill.valorReal)}</td>
        </tr>
        <tr>
          <td style="font-weight: 600;">Data do Vencimento:</td>
          <td>${new Date(bill.vencimentoReal).toLocaleDateString('pt-BR')}</td>
        </tr>
        <tr>
          <td style="font-weight: 600;">Código de Barras:</td>
          <td style="font-family: monospace; font-size: 0.8rem; word-break: break-all;">${bill.codigoBarras}</td>
        </tr>
        <tr>
          <td style="font-weight: 600;">Arquivo Comprovante:</td>
          <td style="font-family: monospace; font-size: 0.85rem; color: hsl(var(--color-primary));">${bill.comprovante}</td>
        </tr>
      </table>
    </div>
  `;

  modalFooter.innerHTML = `
    <button class="btn btn-secondary" id="btn-close-modal">Fechar</button>
  `;

  modal.classList.add('active');

  const close = () => modal.classList.remove('active');
  document.getElementById('btn-close-modal').addEventListener('click', close);
  document.getElementById('close-modal-btn').addEventListener('click', close);
}
