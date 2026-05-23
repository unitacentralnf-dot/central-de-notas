import { getObras, getBillsForPeriod, getNotifications, getRules, dispatchManualAlert, runCronCheckAlerts } from '../services/dataService.js';
import { setGlobalObra } from '../main.js';

export async function renderDashboard(container, currentRole, activeObraId) {
  // Executar a verificação de alertas
  await runCronCheckAlerts();

  const obras = await getObras();
  const hoje = new Date();
  const mesStr = '05'; // Maio fixado para o protótipo
  const anoStr = '2026';
  
  const bills = await getBillsForPeriod(mesStr, anoStr);
  const notifications = await getNotifications();
  const rules = await getRules();

  // 1. Calcular Métricas para os Cards
  const totalObras = obras.length;
  const obrasComProtesto = obras.filter(o => o.protestStatus === 'dirty').length;
  
  // Faturas pendentes (nao_chegou ou recebida mas não lançada/paga)
  const faturasPendentes = bills.filter(b => b.status === 'nao_chegou' || b.status === 'recebida').length;
  const faturasVencidas = bills.filter(b => {
    if (b.status === 'paga' || b.status === 'lancada') return false;
    const dueDay = b.vencimentoPadrao;
    return dueDay < 23; // Hoje simulado como dia 23
  }).length;

  // Custo Real + Estimado das que já foram lançadas/pagas
  const totalCustoMes = bills.reduce((acc, curr) => {
    const val = curr.valorReal !== null ? curr.valorReal : curr.valorEstimado;
    return acc + val;
  }, 0);
  
  const totalCustoPago = bills.reduce((acc, curr) => {
    if (curr.status === 'paga' || curr.status === 'lancada') {
      return acc + (curr.valorReal || curr.valorEstimado);
    }
    return acc;
  }, 0);

  // Formatar moeda BRL
  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // HTML Principal
  let html = `
    <div class="dashboard-view animate-fade-in">
      <!-- Grid de Indicadores Principais -->
      <section class="summary-grid" aria-label="Métricas Rápidas">
        <!-- Card 1: Saúde Fiscal -->
        <div class="card-premium ${obrasComProtesto > 0 ? 'danger' : 'success'}">
          <div class="card-header">
            <span class="card-title">Situação Fiscal (CNPJ)</span>
            <div class="card-icon ${obrasComProtesto > 0 ? 'danger' : 'success'}">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
              </svg>
            </div>
          </div>
          <div class="card-value">
            ${obrasComProtesto === 0 ? 'Regular' : `${obrasComProtesto} em Alerta`}
          </div>
          <div class="card-footer ${obrasComProtesto > 0 ? 'danger' : 'success'}">
            <span class="highlight">${totalObras - obrasComProtesto}/${totalObras}</span> obras regularizadas
          </div>
        </div>

        <!-- Card 2: Contas Pendentes -->
        <div class="card-premium ${faturasVencidas > 0 ? 'danger' : (faturasPendentes > 0 ? 'warning' : 'success')}">
          <div class="card-header">
            <span class="card-title">Faturas Pendentes (Maio/26)</span>
            <div class="card-icon ${faturasVencidas > 0 ? 'danger' : (faturasPendentes > 0 ? 'warning' : 'success')}">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
          </div>
          <div class="card-value">${faturasPendentes} Contas</div>
          <div class="card-footer ${faturasVencidas > 0 ? 'danger' : 'warning'}">
            <span class="highlight">${faturasVencidas} faturas</span> vencidas ou fora do prazo
          </div>
        </div>

        <!-- Card 3: Custos do Mês -->
        <div class="card-premium primary">
          <div class="card-header">
            <span class="card-title">Comprometimento Financeiro</span>
            <div class="card-icon primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h.007v.008H3.75V4.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3 15.75h.007v.008H3v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
          </div>
          <div class="card-value">${fmt(totalCustoPago)}</div>
          <div class="card-footer">
            Total provisionado no mês: <span class="highlight">${fmt(totalCustoMes)}</span>
          </div>
        </div>
      </section>

      <!-- Layout Split: Obras e Central de Notificações -->
      <div class="layout-split">
        <!-- Coluna Esquerda: Obras Cadastradas -->
        <div class="section-panel" style="margin-bottom: 0;">
          <div class="panel-header">
            <h2 class="panel-title">Acompanhamento por Obra (Maio/2026)</h2>
          </div>
          
          <div class="table-responsive">
            <table class="table-premium" aria-label="Tabela de faturas e regularidade por obra">
              <thead>
                <tr>
                  <th>Obra / Localização</th>
                  <th>CNPJ</th>
                  <th>Situação CNPJ</th>
                  <th>Faturas do Mês</th>
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
                  const badgeClass = isDirty ? 'badge-danger ping-pulse' : 'badge-success';
                  const badgeText = isDirty ? 'Protestos Ativos' : 'CNPJ Regular';

                  return `
                    <tr>
                      <td>
                        <div style="font-weight: 600; color: white;">${obra.name}</div>
                        <div style="font-size: 0.8rem; color: hsl(var(--text-dim));">${obra.address}</div>
                      </td>
                      <td style="font-family: monospace; font-size: 0.85rem;">${obra.cnpj}</td>
                      <td>
                        <span class="badge ${badgeClass}">
                          <span class="badge-dot"></span>
                          ${badgeText}
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
                        <button class="btn btn-secondary btn-sm nav-to-bills" data-obra="${obra.id}">Faturas</button>
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
            <h2 class="panel-title">Atividades & Alertas</h2>
          </div>
          
          <p style="font-size: 0.85rem; color: hsl(var(--text-muted)); margin-bottom: 16px;">
            Histórico das últimas notificações de vencimento enviadas pelo sistema.
          </p>

          <div class="log-container">
            ${notifications.length === 0 ? '<div class="log-item" style="color: hsl(var(--text-dim));">Nenhuma notificação registrada.</div>' : ''}
            ${notifications.map(n => {
              const dt = new Date(n.timestamp);
              const timeStr = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              
              let typeClass = 'log-info';
              if (n.type === 'warning') typeClass = 'log-warning';
              if (n.type === 'danger') typeClass = 'log-danger';
              if (n.type === 'success') typeClass = 'log-success';

              return `
                <div class="log-item">
                  <span class="log-time">[${timeStr}]</span>
                  <span class="log-text ${typeClass}">${n.message}</span>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Seção de Ação Rápida para Consultores -->
          ${currentRole !== 'adm' ? `
            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-light);">
              <h3 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: hsl(var(--text-muted)); margin-bottom: 12px;">Ações Rápidas de Cobrança</h3>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${bills.filter(b => b.status === 'nao_chegou').map(b => {
                  const rule = rules.find(r => r.id === b.ruleId);
                  const obra = obras.find(o => o.id === b.obraId);
                  if (!rule || !obra) return '';
                  return `
                    <div style="background-color: hsl(var(--bg-input)); padding: 10px; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                      <div style="font-size: 0.8rem;">
                        <span style="color: white; font-weight: 600;">${rule.name}</span>
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
  // 1. Botão de ir para faturas filtrando por obra
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

  // 2. Disparar cobrança direta manual
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
