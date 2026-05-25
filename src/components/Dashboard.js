import { getObras, getBillsForPeriod, getNotifications, getRules, dispatchManualAlert, runCronCheckAlerts, getNFes, getProtestsByObra } from '../services/dataService.js';
import { setGlobalObra, navigateToView } from '../main.js';

export async function renderDashboard(container, currentRole, activeObraId) {
  container.innerHTML = `
    <div class="shimmer-container">
      <div class="shimmer-card header-shimmer" style="height: 60px; margin-bottom: 24px;"></div>
      <div class="shimmer-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 24px;">
        <div class="shimmer-card" style="height: 80px;"></div>
        <div class="shimmer-card" style="height: 80px;"></div>
        <div class="shimmer-card" style="height: 80px;"></div>
        <div class="shimmer-card" style="height: 80px;"></div>
      </div>
      <div class="shimmer-grid">
        <div class="shimmer-card" style="height: 180px;"></div>
        <div class="shimmer-card" style="height: 180px;"></div>
        <div class="shimmer-card" style="height: 180px;"></div>
      </div>
    </div>
  `;

  await runCronCheckAlerts();

  // Carregar Dados Paralelamente para Performance
  const [obras, bills, notifications, rules, nfes] = await Promise.all([
    getObras(),
    getBillsForPeriod(
      String(new Date().getMonth() + 1).padStart(2, '0'),
      String(new Date().getFullYear())
    ),
    getNotifications(),
    getRules(),
    getNFes()
  ]);

  const hoje = new Date();
  const mesStr = String(hoje.getMonth() + 1).padStart(2, '0');
  const anoStr = String(hoje.getFullYear());
  const hojeDia = hoje.getDate();
  const hojeIso = hoje.toISOString().split('T')[0];

  // Buscar todos os protestos das obras para consolidar valores no card
  const protestosList = await Promise.all(obras.map(o => getProtestsByObra(o.id)));
  const todosProtestos = protestosList.flat();
  const protestosAtivos = todosProtestos.filter(p => p.status === 'Ativo');
  const totalValorProtestos = protestosAtivos.reduce((acc, p) => acc + p.value, 0);
  const countProtestosAtivos = protestosAtivos.length;

  // 1. Calcular Métricas para a Barra Superior Real-Time
  const totalObras = obras.length;
  const obrasComProtesto = obras.filter(o => o.protestStatus === 'dirty').length;
  
  // NFs Recebidas Hoje
  const nfesHoje = nfes.filter(n => n.issueDate === hojeIso);
  const countNfesHoje = nfesHoje.length;
  const totalValorNfesHoje = nfesHoje.reduce((acc, n) => acc + n.value, 0);

  // OCR Processados (Simulado baseado nas faturas digitalizadas ou valor estático de atividade no mês)
  const ocrCountMes = 14; 

  // Pendências Críticas: Contas não pagas vencidas há mais de 3 dias
  const pendenciasCriticas = bills.filter(b => {
    if (b.status === 'paga' || b.status === 'lancada') return false;
    return b.vencimentoPadrao < (hojeDia - 3);
  });
  const countPendenciasCriticas = pendenciasCriticas.length;

  // 2. Calcular Métricas de Densidade dos Cards
  const faturasPendentes = bills.filter(b => b.status === 'nao_chegou' || b.status === 'recebida').length;
  const faturasVencidas = bills.filter(b => {
    if (b.status === 'paga' || b.status === 'lancada') return false;
    return b.vencimentoPadrao < hojeDia;
  }).length;

  // Valores de Faturas
  const totalValorPendente = bills.filter(b => b.status === 'nao_chegou' || b.status === 'recebida')
    .reduce((acc, b) => acc + (b.valorReal || b.valorEstimado), 0);

  const totalValorVencido = bills.filter(b => {
    if (b.status === 'paga' || b.status === 'lancada') return false;
    return b.vencimentoPadrao < hojeDia;
  }).reduce((acc, b) => acc + (b.valorReal || b.valorEstimado), 0);

  // Gasto do mês
  const totalCustoMes = bills.reduce((acc, curr) => acc + (curr.valorReal !== null ? curr.valorReal : curr.valorEstimado), 0);
  const totalCustoPago = bills.reduce((acc, curr) => {
    if (curr.status === 'paga' || curr.status === 'lancada') {
      return acc + (curr.valorReal || curr.valorEstimado);
    }
    return acc;
  }, 0);

  const percentConsumido = totalCustoMes > 0 ? Math.round((totalCustoPago / totalCustoMes) * 100) : 0;

  // Formatar moeda BRL
  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // HTML Principal
  let html = `
    <div class="dashboard-view animate-fade-in">
      
      <!-- Linha Superior: Central Operacional Real-Time -->
      <section class="realtime-strip" aria-label="Status Operacional em Tempo Real">
        
        <div class="realtime-card">
          <div class="realtime-info">
            <span class="realtime-label">NFs Recebidas Hoje</span>
            <span class="realtime-value">
              <span class="realtime-indicator ${countNfesHoje > 0 ? 'pulse' : ''}" style="background-color: ${countNfesHoje > 0 ? 'hsl(var(--color-success))' : 'hsl(var(--text-dim))'};"></span>
              ${countNfesHoje} <span style="font-size: 0.75rem; font-weight: 500; color: hsl(var(--text-muted));">(${fmt(totalValorNfesHoje)})</span>
            </span>
          </div>
          <div class="realtime-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 18px; height: 18px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
        </div>

        <div class="realtime-card">
          <div class="realtime-info">
            <span class="realtime-label">Processado via OCR</span>
            <span class="realtime-value">
              <span class="badge-automation" style="margin-right: 4px;">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 21l8.913-6.254a48.907 48.907 0 0 1-5.117-2.297l5.213-3.654A48.901 48.901 0 0 0 9 11.25l.813 4.654Z" />
                </svg>
                IA
              </span>
              ${ocrCountMes} <span style="font-size: 0.75rem; font-weight: 500; color: hsl(var(--text-muted));">docs</span>
            </span>
          </div>
          <div class="realtime-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 18px; height: 18px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-.75m-6-6h12m-12 4.5h12m-12-9h12" />
            </svg>
          </div>
        </div>

        <div class="realtime-card">
          <div class="realtime-info">
            <span class="realtime-label">Protestos Ativos</span>
            <span class="realtime-value" style="color: ${countProtestosAtivos > 0 ? 'hsl(var(--color-danger))' : 'inherit'};">
              ${countProtestosAtivos} <span style="font-size: 0.75rem; font-weight: 500; color: hsl(var(--text-muted));">(${fmt(totalValorProtestos)})</span>
            </span>
          </div>
          <div class="realtime-icon-wrapper" style="${countProtestosAtivos > 0 ? 'color: hsl(var(--color-danger)); background: rgba(239, 68, 68, 0.1);' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 18px; height: 18px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
          </div>
        </div>

        <div class="realtime-card">
          <div class="realtime-info">
            <span class="realtime-label">Atrasos Críticos</span>
            <span class="realtime-value" style="color: ${countPendenciasCriticas > 0 ? 'hsl(var(--color-danger))' : 'inherit'};">
              ${countPendenciasCriticas} <span style="font-size: 0.75rem; font-weight: 500; color: hsl(var(--text-muted));">vencidos > 3d</span>
            </span>
          </div>
          <div class="realtime-icon-wrapper" style="${countPendenciasCriticas > 0 ? 'color: hsl(var(--color-danger)); background: rgba(239, 68, 68, 0.1);' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 18px; height: 18px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
        </div>

      </section>

      <!-- Grid de Indicadores Principais -->
      <section class="summary-grid" aria-label="Métricas de Alta Densidade">
        
        <!-- Card 1: Saúde Fiscal -->
        <div class="card-premium ${obrasComProtesto > 0 ? 'danger ping-pulse' : 'success'}" id="card-fiscal" style="cursor: pointer;">
          <div class="card-header">
            <span class="card-title">Situação Fiscal (CNPJ)</span>
            <div class="card-icon ${obrasComProtesto > 0 ? 'danger' : 'success'}">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
              </svg>
            </div>
          </div>
          <div class="card-value">
            ${obrasComProtesto === 0 ? 'Regular' : `${obrasComProtesto} Obra${obrasComProtesto > 1 ? 's' : ''} com Risco`}
          </div>
          <div class="card-footer ${obrasComProtesto > 0 ? 'danger' : 'success'}" style="margin-top: 10px; font-weight: 500;">
            ${obrasComProtesto > 0 
              ? `<span style="font-weight: 700;">${fmt(totalValorProtestos)}</span> sob protesto ativo`
              : `<span class="highlight">${totalObras}/${totalObras}</span> CNPJ regularizados no cartório`
            }
          </div>
        </div>

        <!-- Card 2: Contas Pendentes -->
        <div class="card-premium ${faturasVencidas > 0 ? 'danger ping-pulse' : (faturasPendentes > 0 ? 'warning' : 'success')}" id="card-faturas" style="cursor: pointer;">
          <div class="card-header">
            <span class="card-title">Contas Pendentes (Mês Corrente)</span>
            <div class="card-icon ${faturasVencidas > 0 ? 'danger' : (faturasPendentes > 0 ? 'warning' : 'success')}">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
          </div>
          <div class="card-value">${faturasPendentes} Contas</div>
          
          <!-- Densidade Operacional Extra no Card -->
          <div style="font-size: 0.8rem; color: hsl(var(--text-muted)); margin-top: 6px; display: flex; flex-direction: column; gap: 2px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Total provisionado:</span>
              <strong style="color: hsl(var(--text-main));">${fmt(totalValorPendente)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; color: ${faturasVencidas > 0 ? 'hsl(var(--color-danger))' : 'inherit'};">
              <span>Vencidas ou em atraso:</span>
              <strong>${faturasVencidas} (${fmt(totalValorVencido)})</strong>
            </div>
          </div>
        </div>

        <!-- Card 3: Custos do Mês (Comprometimento) -->
        <div class="card-premium primary" id="card-financeiro" style="cursor: pointer;">
          <div class="card-header">
            <span class="card-title">Comprometimento Financeiro</span>
            <div class="card-icon primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h.007v.008H3.75V4.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3 15.75h.007v.008H3v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
          </div>
          <div class="card-value">${fmt(totalCustoPago)}</div>
          
          <!-- Progresso Visual e Tendência -->
          <div class="mini-chart-container">
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: hsl(var(--text-muted));">
              <span>Consumo da Provisão:</span>
              <strong style="color: hsl(var(--text-main));">${percentConsumido}%</strong>
            </div>
            <div class="mini-chart-bar-bg">
              <div class="mini-chart-bar-fill" style="width: ${percentConsumido}%;"></div>
            </div>
            <div class="trend-container">
              <span style="font-size: 0.72rem; color: hsl(var(--text-dim));">Total Mês: ${fmt(totalCustoMes)}</span>
              <span class="trend-badge down">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 10px; height: 10px;">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
                -4.2% vs mês ant.
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Layout Split: Obras e Central de Notificações -->
      <div class="layout-split">
        <!-- Coluna Esquerda: Obras Cadastradas -->
        <div class="section-panel" style="margin-bottom: 0;">
          <div class="panel-header">
            <h2 class="panel-title">Acompanhamento & Semáforo de Obras (${mesStr}/${anoStr})</h2>
          </div>
          
          <div class="table-responsive">
            <table class="table-premium" aria-label="Tabela de faturas e regularidade por obra">
              <thead>
                <tr>
                  <th>Obra / Localização</th>
                  <th>CNPJ</th>
                  <th style="text-align: center;">Semáforo Operacional</th>
                  <th>Faturas pagas</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${obras.map(obra => {
                  const obraBills = bills.filter(b => b.obraId === obra.id);
                  const pagasCount = obraBills.filter(b => b.status === 'paga' || b.status === 'lancada').length;
                  const totalCount = obraBills.length;
                  const percentPagas = totalCount > 0 ? Math.round((pagasCount / totalCount) * 100) : 0;
                  
                  const isDirty = obra.protestStatus === 'dirty';
                  
                  // Calcular regras do Semáforo Operacional por Obra
                  const obraVencidas = obraBills.filter(b => {
                    if (b.status === 'paga' || b.status === 'lancada') return false;
                    return b.vencimentoPadrao < hojeDia;
                  }).length;
                  
                  const obraUrgentes = obraBills.filter(b => {
                    if (b.status === 'paga' || b.status === 'lancada') return false;
                    const restamDias = b.vencimentoPadrao - hojeDia;
                    return restamDias >= 0 && restamDias <= 2;
                  }).length;

                  let semaforoClass = 'green';
                  let semaforoText = 'Tudo OK';
                  if (isDirty || obraVencidas > 0) {
                    semaforoClass = 'red';
                    semaforoText = isDirty ? 'Crítico (Protesto)' : 'Crítico (Atraso)';
                  } else if (obraUrgentes > 0 || (totalCount > 0 && pagasCount < totalCount)) {
                    semaforoClass = 'yellow';
                    semaforoText = obraUrgentes > 0 ? 'Atenção (Urgente)' : 'Atenção (Pendente)';
                  }

                  return `
                    <tr>
                      <td>
                        <div style="font-weight: 600; color: hsl(var(--text-main));">${obra.name}</div>
                        <div style="font-size: 0.8rem; color: hsl(var(--text-dim));">${obra.address}</div>
                      </td>
                      <td style="font-family: monospace; font-size: 0.85rem;">${obra.cnpj}</td>
                      <td style="text-align: center;">
                        <span class="status-light ${semaforoClass}">
                          <span class="status-light-dot"></span>
                          ${semaforoText}
                        </span>
                      </td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <div style="font-size: 0.9rem; font-weight: 600;">${pagasCount}/${totalCount}</div>
                          <div style="background-color: hsl(var(--bg-input)); width: 60px; height: 6px; border-radius: var(--radius-full); overflow: hidden;">
                            <div style="background-color: hsl(var(--color-primary)); width: ${percentPagas}%; height: 100%;"></div>
                          </div>
                          <span style="font-size: 0.75rem; color: hsl(var(--text-dim));">${percentPagas}%</span>
                        </div>
                      </td>
                      <td>
                        <div style="display: flex; gap: 6px;">
                          <button class="btn btn-secondary btn-sm nav-to-bills" data-obra="${obra.id}" title="Ver Faturas">Faturas</button>
                          <button class="btn btn-secondary btn-sm nav-to-docs" data-obra="${obra.id}" style="background-color: rgba(99,102,241,0.06); border-color: rgba(99,102,241,0.15);" title="Ver Timeline de Documentos">Timeline</button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Coluna Direita: Alertas Recentes -->
        <div class="section-panel" style="margin-bottom: 0;">
          <div class="panel-header">
            <h2 class="panel-title">Atividades & Varreduras da IA</h2>
          </div>
          
          <p style="font-size: 0.85rem; color: hsl(var(--text-muted)); margin-bottom: 16px;">
            Histórico de capturas automáticas da SEFAZ, leituras de OCR e monitoramento fiscal.
          </p>

          <div class="log-container" style="max-height: 380px; overflow-y: auto;">
            ${notifications.length === 0 ? '<div class="log-item" style="color: hsl(var(--text-dim));">Nenhuma atividade registrada hoje.</div>' : ''}
            ${notifications.map(n => {
              const dt = new Date(n.timestamp);
              const timeStr = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              
              let typeClass = 'log-info';
              if (n.type === 'warning') typeClass = 'log-warning';
              if (n.type === 'danger') typeClass = 'log-danger';
              if (n.type === 'success') typeClass = 'log-success';

              return `
                <div class="log-item" style="padding-block: 10px; border-bottom: 1px solid var(--border-light);">
                  <span class="log-time" style="font-weight: 600;">[${timeStr}]</span>
                  <span class="log-text ${typeClass}" style="line-height: 1.4; display: inline; font-size: 0.82rem;">${n.message}</span>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Seção de Ação Rápida para Consultores -->
          ${currentRole !== 'adm' ? `
            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-light);">
              <h3 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: hsl(var(--text-muted)); margin-bottom: 12px;">Cobranças Rápidas de Contas Fixas</h3>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${bills.filter(b => b.status === 'nao_chegou').map(b => {
                  const rule = rules.find(r => r.id === b.ruleId);
                  const obra = obras.find(o => o.id === b.obraId);
                  if (!rule || !obra) return '';
                  return `
                    <div style="background-color: hsl(var(--bg-input)); padding: 10px; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                      <div style="font-size: 0.8rem;">
                        <span style="color: hsl(var(--text-main)); font-weight: 600;">${rule.name}</span>
                        <div style="color: hsl(var(--text-dim)); font-size: 0.75rem;">Obra: ${obra.name} | Vence: dia ${b.vencimentoPadrao}</div>
                      </div>
                      <button class="btn btn-danger btn-sm manual-alert-btn" data-bill="${b.id}" style="padding: 4px 8px; font-size: 0.75rem;">Cobrar ADM</button>
                    </div>
                  `;
                }).join('')}
                ${bills.filter(b => b.status === 'nao_chegou').length === 0 ? '<div style="font-size: 0.8rem; color: hsl(var(--text-dim)); text-align: center;">Nenhuma conta pendente para cobrar.</div>' : ''}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Vinculação de Eventos
  // 1. Cliques nos cards principais para navegar
  const cardFiscal = container.querySelector('#card-fiscal');
  if (cardFiscal) {
    cardFiscal.addEventListener('click', () => navigateToView('protests'));
  }
  const cardFaturas = container.querySelector('#card-faturas');
  if (cardFaturas) {
    cardFaturas.addEventListener('click', () => navigateToView('fixed-bills'));
  }
  const cardFinanceiro = container.querySelector('#card-financeiro');
  if (cardFinanceiro) {
    cardFinanceiro.addEventListener('click', () => navigateToView('doc-central'));
  }

  // 2. Botão de ir para faturas filtrando por obra
  container.querySelectorAll('.nav-to-bills').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const obraId = e.currentTarget.getAttribute('data-obra');
      const menuBills = document.getElementById('nav-fixed-bills');
      if (menuBills) {
        setGlobalObra(obraId); // Atualiza o seletor global reativo
        menuBills.click();
      }
    });
  });

  // 3. Botão de ir para Timeline de Documentos da Obra
  container.querySelectorAll('.nav-to-docs').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const obraId = e.currentTarget.getAttribute('data-obra');
      const menuDocs = document.getElementById('nav-doc-central');
      if (menuDocs) {
        setGlobalObra(obraId); // Atualiza o seletor global
        menuDocs.click();
      }
    });
  });

  // 4. Disparar cobrança direta manual
  container.querySelectorAll('.manual-alert-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const billId = e.currentTarget.getAttribute('data-bill');
      let senderName = 'Consultor';
      if (currentRole === 'ggo') senderName = 'GGO / Diretor';
      if (currentRole === 'engenheiro') senderName = 'Engenheiro';
      if (currentRole === 'financeiro') senderName = 'Financeiro';

      const success = await dispatchManualAlert(billId, senderName);
      if (success) {
        // Recarregar a tela para atualizar o log e os botões
        await renderDashboard(container, currentRole, activeObraId);
      }
    });
  });
}
