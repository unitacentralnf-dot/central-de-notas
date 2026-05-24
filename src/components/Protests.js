import { getObras, saveObra, addNotification, getProtestsByObra, resolveProtestsForObra, checkCnpjStatus, scanProtestsByObra } from '../services/dataService.js';

let activeObraId = '';
let scanResult = null; 

export async function renderProtests(container, currentRole, initialObraId = '') {
  container.innerHTML = `
    <div class="shimmer-container">
      <div class="shimmer-card header-shimmer" style="width: 250px;"></div>
      <div class="shimmer-card shimmer-table"></div>
    </div>
  `;

  if (initialObraId) activeObraId = initialObraId;
  const obras = await getObras();
  if (!activeObraId && obras.length > 0) {
    activeObraId = obras[0].id;
  }

  const selectedObra = obras.find(o => o.id === activeObraId);
  const isAdm = currentRole === 'adm';

  // Se já houver status, carrega o detalhe real do banco de dados Supabase
  let initialDetailsHtml = '';
  if (selectedObra) {
    if (selectedObra.protestStatus === 'dirty') {
      const realProtests = await getProtestsByObra(activeObraId);
      const activeProtests = realProtests.filter(p => p.status === 'Ativo');
      initialDetailsHtml = activeProtests.map(p => `
        <div style="background-color: hsl(var(--bg-input)); border: 1px solid var(--border-light); padding: 16px; border-radius: var(--radius-sm); font-size: 0.85rem; line-height: 1.4;">
           <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-weight: 600; color: hsl(var(--text-main));">
            <span>Credor: ${p.creditor}</span>
            <span style="color: hsl(var(--color-danger));">${p.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
          <div style="color: hsl(var(--text-muted)); font-size: 0.8rem;">
            <div>Cartório: <strong>${p.notary}</strong></div>
            <div>Data Protesto: <strong>${new Date(p.date).toLocaleDateString('pt-BR')}</strong></div>
            <div>Status Cadastral: <strong style="color: hsl(var(--color-danger));">${p.status}</strong></div>
          </div>
        </div>
      `).join('');
    }
  }

  const html = `
    <div class="protests-view animate-fade-in">
      <div class="layout-split">
        <!-- Coluna Esquerda: Controle de Varredura -->
        <div class="section-panel" style="margin-bottom: 0;">
          <div class="panel-header">
            <h2 class="panel-title">Regularidade Fiscal (Protestos por CNPJ)</h2>
          </div>
          
          <div class="obra-info-banner" style="background: hsl(var(--bg-input)); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 14px 18px; display: flex; align-items: center; gap: 14px; margin-bottom: 8px;">
            <div style="width: 40px; height: 40px; border-radius: var(--radius-sm); background: linear-gradient(135deg, hsl(var(--color-primary) / 0.2), hsl(var(--color-primary) / 0.05)); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 20px; height: 20px; color: hsl(var(--color-primary));">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <div>
              <div style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: hsl(var(--color-primary)); margin-bottom: 2px;">Obra em Varredura</div>
              <div style="font-weight: 700; color: hsl(var(--text-main)); font-size: 1rem;">${selectedObra ? selectedObra.name : 'Nenhuma obra selecionada'}</div>
              ${selectedObra ? `<div style="font-size: 0.78rem; color: hsl(var(--text-muted)); font-family: monospace;">CNPJ: ${selectedObra.cnpj}</div>` : ''}
            </div>
            <div style="margin-left: auto; font-size: 0.75rem; color: hsl(var(--text-dim)); text-align: right;">
              Troque a obra pelo<br/>seletor global no topo ↑
            </div>
          </div>

          <!-- Caixa de Ação de Varredura -->
          <div id="scan-trigger-area" style="margin-top: 32px;">
            <div style="background-color: rgba(255, 255, 255, 0.02); border: 1px dashed var(--border-light); padding: 32px; border-radius: var(--radius-lg); text-align: center;">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" style="width: 64px; height: 64px; color: hsl(var(--text-muted)); margin-bottom: 16px; margin-inline: auto;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
              </svg>
               <h3 style="color: hsl(var(--text-main)); font-size: 1.1rem; margin-bottom: 8px;">Varredura de Protestos (Dev/Fixtures)</h3>
               <p style="font-size: 0.85rem; color: hsl(var(--text-muted)); max-width: 420px; margin-inline: auto; margin-bottom: 24px;">
                 Em desenvolvimento, o sistema roda em <strong>Fixtures</strong> para manter tudo operacional sem credenciais.
                 Quando você escolher o provedor (CENPROT/IEPTB/Serasa etc.), essa mesma ação vai chamar a Edge Function.
               </p>
               <button class="btn btn-primary" id="btn-start-scan">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 16px; height: 16px;">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                 Iniciar Varredura (Protestos)
               </button>
            </div>
          </div>
          
          <!-- Histórico de Consultas da Obra -->
          <div style="margin-top: 32px; border-top: 1px solid var(--border-light); padding-top: 24px;">
            <h3 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: hsl(var(--text-muted)); margin-bottom: 12px;">Histórico de Varreduras da Obra</h3>
            <div style="font-size: 0.85rem; color: hsl(var(--text-dim));" id="protest-last-check-time">
              ${selectedObra && selectedObra.lastProtestCheck 
                ? `Última varredura realizada em: <strong>${new Date(selectedObra.lastProtestCheck).toLocaleString('pt-BR')}</strong>`
                : 'Nenhuma varredura registrada para esta obra desde a ativação do sistema.'
              }
            </div>
          </div>
        </div>

        <!-- Coluna Direita: Painel de Resultados & Regularização -->
        <div class="section-panel" style="margin-bottom: 0;" id="protest-results-panel">
          ${selectedObra ? renderStatusPanelHtml(selectedObra, initialDetailsHtml, isAdm) : ''}
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Vinculação de Eventos
  // Botão de Iniciar Varredura
  const btnStartScan = document.getElementById('btn-start-scan');
  if (btnStartScan) {
    btnStartScan.addEventListener('click', () => {
      runScanSimulation(container, currentRole);
    });
  }

  // Seletor de comprovante e envio (caso renderize o dirty)
  bindDirtyFormEvents(container, currentRole);
}

// Simulação Visual da Varredura
async function runScanSimulation(container, currentRole) {
  const scanArea = document.getElementById('scan-trigger-area');
  const resultsPanel = document.getElementById('protest-results-panel');
  if (!scanArea || !resultsPanel) return;

  scanArea.innerHTML = `
    <div class="scan-box" style="height: 180px;">
      <div class="scan-line" style="background: linear-gradient(to right, transparent, hsl(var(--color-info)), transparent); box-shadow: 0 0 12px hsl(var(--color-info));"></div>
      <div class="scanning-text" style="color: hsl(var(--color-info));">CONSULTANDO DADOS CADASTRAIS DO CNPJ (CNPJ.ws)...</div>
    </div>
  `;

  const globalObraSelect = document.getElementById('globalObraSelect');
  if (globalObraSelect) {
    globalObraSelect.setAttribute('disabled', 'true');
  }

  // 1) Consulta cadastral (CNPJ.ws) via dataService (cache)
  const obras = await getObras();
  const selectedObra = obras.find(o => o.id === activeObraId);

  if (selectedObra) {
    try {
      const result = await checkCnpjStatus(selectedObra.cnpj);

      // Guarda dados cadastrais para o painel (direita)
      scanResult = result;

      // 2) Varredura de protestos (fixtures/edge)
      await scanProtestsByObra(activeObraId);

      // "protestStatus" deve refletir protestos reais (tabela protestos / API cartório),
      // não a situação cadastral do CNPJ.
      const realProtests = await getProtestsByObra(activeObraId);
      const hasActiveProtests = (realProtests || []).some(p => p.status === 'Ativo');

      selectedObra.lastProtestCheck = new Date().toISOString();
      selectedObra.protestStatus = hasActiveProtests ? 'dirty' : 'clean';

      await saveObra(selectedObra);
      addNotification('info', `LOG: Consulta CNPJ.ws concluída para ${selectedObra.cnpj} — Situação: ${result.situacao}`);
    } catch (err) {
      console.error('Falha na consulta CNPJ:', err);
      addNotification('error', `ERRO: Falha ao consultar CNPJ — ${err.message}`);

      // Fallback: mantém status baseado apenas no que já existe no banco
      const realProtests = await getProtestsByObra(activeObraId);
      const hasActiveProtests = (realProtests || []).some(p => p.status === 'Ativo');
      selectedObra.lastProtestCheck = new Date().toISOString();
      selectedObra.protestStatus = hasActiveProtests ? 'dirty' : 'clean';
      await saveObra(selectedObra);
    }
  }

  if (globalObraSelect) {
    globalObraSelect.removeAttribute('disabled');
  }

  await renderProtests(container, currentRole, activeObraId);
}

// Vincula eventos do formulário de resolução de protesto (Upload de anuência)
function bindDirtyFormEvents(container, currentRole) {
  const btnResolve = document.getElementById('btn-submit-resolution');
  if (btnResolve) {
    btnResolve.addEventListener('click', async () => {
      const fileInput = document.getElementById('protest-voucher-file');
      if (!fileInput.value) {
        alert('Por favor, selecione um arquivo de comprovante/anuência.');
        return;
      }
      
      const success = await resolveProtestsForObra(activeObraId);
      if (success) {
        addNotification('success', `LOG: Anuência anexada e restrições limpas no Supabase para a Obra selecionada.`);
        alert('Comprovante enviado com sucesso! O status do CNPJ foi atualizado para REGULAR no banco de dados do Supabase.');
        await renderProtests(container, currentRole, activeObraId);
      } else {
        alert('Ocorreu um erro ao tentar limpar as restrições no banco.');
      }
    });
  }
}

// Renderiza HTML do painel de resultados (Coluna direita)
function renderStatusPanelHtml(obra, detailsHtml, isAdm) {
  const isDirty = obra.protestStatus === 'dirty';
  
  if (!isDirty) {
    const cnpjInfo = scanResult?.situacao ? `
      <div style="margin-top: 20px; background: hsl(var(--bg-input)); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px; text-align: left; max-width: 380px; margin-inline: auto;">
        <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: hsl(var(--text-dim)); margin-bottom: 8px;">Dados da Consulta CNPJ.ws</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.78rem;">
          <span style="color: hsl(var(--text-muted));">Situação:</span>
          <span style="color: hsl(var(--color-success)); font-weight: 600;">${scanResult.situacao}</span>
          <span style="color: hsl(var(--text-muted));">Razão Social:</span>
           <span style="color: hsl(var(--text-main));">${scanResult.razaoSocial}</span>
           ${scanResult.cnae ? `<span style="color: hsl(var(--text-muted));">CNAE:</span><span style="color: hsl(var(--text-main));">${scanResult.cnae}</span>` : ''}
           ${scanResult.municipio ? `<span style="color: hsl(var(--text-muted));">Município:</span><span style="color: hsl(var(--text-main));">${scanResult.municipio}/${scanResult.uf}</span>` : ''}
          <span style="color: hsl(var(--text-muted));">Atualização:</span>
           <span style="color: hsl(var(--text-main));">${scanResult.ultimaAtualizacao}</span>
        </div>
      </div>
    ` : '';

    return `
      <div class="panel-header">
        <h2 class="panel-title">Resultado da Análise</h2>
      </div>
      <div style="padding: 0 22px 8px; font-size: 0.72rem; color: hsl(var(--text-dim));">
        Fontes: Cadastro <strong>CNPJ.ws</strong> (cache) · Protestos <strong>Supabase</strong> (tabela <code>protestos</code>)
      </div>
      <div class="animate-fade-in" style="text-align: center; padding: 40px 20px;">
        <div style="width: 80px; height: 80px; background-color: rgba(16, 185, 129, 0.1); border: 2px solid hsl(var(--color-success)); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; margin-inline: auto; margin-bottom: 24px; color: hsl(var(--color-success));">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" style="width: 42px; height: 42px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h3 style="color: hsl(var(--text-main)); font-size: 1.4rem; margin-bottom: 8px;">CNPJ Totalmente Regular</h3>
        <p style="color: hsl(var(--text-muted)); font-size: 0.9rem; max-width: 320px; margin-inline: auto; line-height: 1.4;">
          Nenhum protesto de título foi identificado para a obra <strong>${obra.name}</strong> nas consultas mais recentes.
        </p>
        ${cnpjInfo}
      </div>
    `;
  }

  // Se tiver protesto ativo
  const cnpjInfo = scanResult?.situacao ? `
    <div style="background: hsl(var(--bg-input)); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 14px; margin-bottom: 24px;">
      <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: hsl(var(--text-dim)); margin-bottom: 6px;">Situação Cadastral CNPJ.ws</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; font-size: 0.78rem;">
        <span style="color: hsl(var(--text-muted));">Situação:</span>
        <span style="color: hsl(var(--color-danger)); font-weight: 600;">${scanResult.situacao}</span>
        <span style="color: hsl(var(--text-muted));">Razão Social:</span>
        <span style="color: hsl(var(--text-main));">${scanResult.razaoSocial}</span>
      </div>
    </div>
  ` : '';

  return `
    <div class="panel-header">
      <h2 class="panel-title" style="color: hsl(var(--color-danger));">⚠️ Restrições Fiscais Encontradas</h2>
    </div>
    <div style="padding: 0 22px 8px; font-size: 0.72rem; color: hsl(var(--text-dim));">
      Fontes: Cadastro <strong>CNPJ.ws</strong> (cache) · Protestos <strong>Supabase</strong> (tabela <code>protestos</code>)
    </div>
    
    <div class="animate-fade-in">
      ${cnpjInfo}
      <div style="background-color: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); padding: 16px; border-radius: var(--radius-md); text-align: center; color: hsl(var(--color-danger)); font-weight: 600; margin-bottom: 24px; font-size: 0.9rem; line-height: 1.4;">
        Atenção: Existem protestos ativos que podem inviabilizar o crédito comercial da obra e travar fornecedores de insumos críticos.
      </div>

      <!-- Detalhamento dos Protestos -->
      <h3 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: hsl(var(--text-main)); margin-bottom: 12px;">Lista de Títulos Protestados</h3>
      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
        ${detailsHtml}
      </div>

      <!-- Painel de Envio de Anuência -->
      <div style="border-top: 1px solid var(--border-light); padding-top: 20px;">
        <h3 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: hsl(var(--text-main)); margin-bottom: 8px;">Regularização no Sistema</h3>
        <p style="font-size: 0.8rem; color: hsl(var(--text-muted)); margin-bottom: 16px; line-height: 1.4;">
          Para remover o status de alerta do CNPJ da obra, anexe a **Carta de Anuência** ou o **Comprovante de Quitação** autenticado em cartório.
        </p>

        ${isAdm ? `
          <div class="form-group">
            <label class="form-label" style="font-size: 0.75rem;" for="protest-voucher-file">Selecionar Comprovante PDF / Imagem</label>
            <input type="file" id="protest-voucher-file" class="form-control" accept=".pdf,.png,.jpg">
          </div>
          <button class="btn btn-primary" id="btn-submit-resolution" style="width: 100%;">
            Enviar Comprovante e Limpar Restrição
          </button>
        ` : `
          <div style="background-color: hsl(var(--bg-input)); padding: 12px; border-radius: var(--radius-md); font-size: 0.8rem; color: hsl(var(--text-muted)); border: 1px solid var(--border-light); text-align: center;">
            🔒 Apenas o **Administrador (ADM) / Financeiro** possui permissão para enviar comprovantes de regularização de CNPJ.
          </div>
        `}
      </div>
    </div>
  `;
}
