import { getObras, getNFesByObra, syncSefaz, manifestNFe, launchNFe } from '../services/dataService.js';

export async function renderNFe(container, currentRole, activeObraId) {
  const obras = await getObras();
  if (!activeObraId && obras.length > 0) {
    activeObraId = obras[0].id;
  }

  const selectedObra = obras.find(o => o.id === activeObraId);
  const nfes = await getNFesByObra(activeObraId);
  const isAdm = currentRole === 'adm';

  const totalNFe = nfes.length;
  const valorTotal = nfes.reduce((acc, n) => acc + n.value, 0);
  const aManifestar = nfes.filter(n => n.manifestStatus === 'pendente').length;

  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const html = `
    <div class="nfe-view animate-fade-in">
      <!-- Filtros e Sincronização -->
      <div class="filter-bar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div style="font-size: 0.95rem; color: hsl(var(--text-muted)); font-weight: 500;">
          Obra Integrada: <strong style="color: white;">${selectedObra ? selectedObra.name : 'Nenhuma'}</strong> <span style="font-size: 0.8rem; color: hsl(var(--text-dim)); font-family: monospace; margin-left: 6px;">(CNPJ: ${selectedObra ? selectedObra.cnpj : ''})</span>
        </div>

        <button class="btn btn-primary" id="btn-sync-sefaz">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 16px; height: 16px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Consultar Novas NFs (Sefaz)
        </button>
      </div>

      <!-- Painel de Métricas da NFe -->
      <section class="summary-grid" style="margin-bottom: 24px;" aria-label="Métricas de Notas Fiscais">
        <div class="card-premium success" style="padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.8rem; font-weight: 600; color: hsl(var(--text-muted)); text-transform: uppercase;">Total de Notas</span>
            <span style="font-size: 1.25rem;">📊</span>
          </div>
          <div style="font-size: 1.5rem; font-weight: 700; color: white; margin-top: 8px;">${totalNFe} NF-es</div>
          <div style="font-size: 0.75rem; color: hsl(var(--text-dim)); margin-top: 4px;">Recebidas da Sefaz</div>
        </div>

        <div class="card-premium primary" style="padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.8rem; font-weight: 600; color: hsl(var(--text-muted)); text-transform: uppercase;">Valor Total Acumulado</span>
            <span style="font-size: 1.25rem;">💰</span>
          </div>
          <div style="font-size: 1.5rem; font-weight: 700; color: white; margin-top: 8px;">${fmt(valorTotal)}</div>
          <div style="font-size: 0.75rem; color: hsl(var(--text-dim)); margin-top: 4px;">Volume financeiro</div>
        </div>

        <div class="card-premium ${aManifestar > 0 ? 'warning' : 'success'}" style="padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.8rem; font-weight: 600; color: hsl(var(--text-muted)); text-transform: uppercase;">Notas a Manifestar</span>
            <span style="font-size: 1.25rem;">⚖️</span>
          </div>
          <div style="font-size: 1.5rem; font-weight: 700; color: white; margin-top: 8px;">${aManifestar} Pendentes</div>
          <div style="font-size: 0.75rem; color: hsl(var(--text-dim)); margin-top: 4px;">Exige ação imediata</div>
        </div>
      </section>

      <!-- Container de Sincronização Animada -->
      <div id="sync-animation-container" style="display: none; margin-bottom: 24px;">
        <div class="scan-box" style="height: 120px;">
          <div class="scan-line" style="background: linear-gradient(to right, transparent, hsl(var(--color-primary)), transparent); box-shadow: 0 0 12px hsl(var(--color-primary));"></div>
          <div class="scanning-text" id="sync-status-text">CONECTANDO AO WEBSERVICE DA SEFAZ...</div>
        </div>
      </div>

      <!-- Painel Tabela de Notas Fiscais -->
      <div class="section-panel" style="margin-top: 24px;">
        <div class="panel-header">
          <h2 class="panel-title">Documentos Fiscais Eletrônicos (NFe) Recebidos</h2>
          ${!isAdm ? '<span style="font-size: 0.8rem; color: hsl(var(--text-dim)); font-weight: 500;">🔒 Apenas ADM pode manifestar ou lançar faturas</span>' : ''}
        </div>

        <div class="table-responsive">
          <table class="table-premium" aria-label="Tabela de Notas Fiscais Recebidas">
            <thead>
              <tr>
                <th>Nº da Nota / Série</th>
                <th>Fornecedor (Emitente)</th>
                <th>Valor Total</th>
                <th>Emissão</th>
                <th>Manifesto Destinatário</th>
                <th>Status Financeiro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${nfes.map(n => {
                let badgeManifest = 'badge-warning';
                let textManifest = 'Pendente';
                if (n.manifestStatus === 'confirmado') {
                  badgeManifest = 'badge-success';
                  textManifest = 'Confirmada';
                } else if (n.manifestStatus === 'desconhecido') {
                  badgeManifest = 'badge-danger';
                  textManifest = 'Desconhecida';
                } else if (n.manifestStatus === 'nao_realizado') {
                  badgeManifest = 'badge-danger';
                  textManifest = 'Não Realizada';
                }

                let badgeLaunch = n.launchStatus === 'lancada' ? 'badge-success' : 'badge-warning';
                let textLaunch = n.launchStatus === 'lancada' ? `Lançada (${n.costCenter})` : 'A Lançar';

                return `
                  <tr>
                    <td>
                      <div style="font-weight: 600; color: white;">NF-e nº ${n.number}</div>
                      <div style="font-size: 0.75rem; color: hsl(var(--text-dim));">Série: ${n.serie} | Chave: ...${n.accessKey ? n.accessKey.slice(-8) : ''}</div>
                    </td>
                    <td>
                      <div style="font-weight: 500; color: white;">${n.issuer}</div>
                      <div style="font-size: 0.75rem; color: hsl(var(--text-dim)); font-family: monospace;">CNPJ: ${n.issuerCnpj}</div>
                    </td>
                    <td style="font-weight: 700; color: white;">${fmt(n.value)}</td>
                    <td>${new Date(n.issueDate).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <span class="badge ${badgeManifest}">
                        <span class="badge-dot"></span>
                        ${textManifest}
                      </span>
                    </td>
                    <td>
                      <span class="badge ${badgeLaunch}">
                        <span class="badge-dot"></span>
                        ${textLaunch}
                      </span>
                    </td>
                    <td>
                      <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-sm btn-nfe-detail" data-id="${n.id}">Itens</button>
                        ${isAdm && n.manifestStatus === 'pendente' 
                          ? `<button class="btn btn-primary btn-sm btn-nfe-manifest" data-id="${n.id}">Manifestar</button>` 
                          : ''
                        }
                        ${isAdm && n.manifestStatus === 'confirmado' && n.launchStatus === 'pendente'
                          ? `<button class="btn btn-success btn-sm btn-nfe-launch" data-id="${n.id}">Lançar</button>`
                          : ''
                        }
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
              ${nfes.length === 0 ? '<tr><td colspan="7" style="text-align: center; color: hsl(var(--text-dim)); padding: 24px;">Nenhuma nota fiscal encontrada para esta obra na Sefaz.</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Vinculação de Eventos
  // 1. Sincronização Sefaz

  document.getElementById('btn-sync-sefaz').addEventListener('click', () => {
    triggerSefazSync(container, currentRole);
  });

  // 3. Botão Detalhes dos Itens
  container.querySelectorAll('.btn-nfe-detail').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      openNfeDetailModal(id, nfes);
    });
  });

  // 4. Botão Manifestar (ADM)
  if (isAdm) {
    container.querySelectorAll('.btn-nfe-manifest').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openNfeManifestModal(id, container, currentRole, nfes, activeObraId);
      });
    });

    container.querySelectorAll('.btn-nfe-launch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openNfeLaunchModal(id, container, currentRole, nfes, activeObraId);
      });
    });
  }
}

// Simulação de Sincronização com Webservice Sefaz
async function triggerSefazSync(container, currentRole) {
  const syncBox = document.getElementById('sync-animation-container');
  const btnSync = document.getElementById('btn-sync-sefaz');
  const statusText = document.getElementById('sync-status-text');
  
  if (!syncBox || !btnSync) return;

  btnSync.setAttribute('disabled', 'true');
  syncBox.style.display = 'block';

  // Passo 1: Autenticação
  statusText.textContent = 'CONSULTANDO CERTIFICADO DIGITAL DA UNITA E BUSCANDO NFES NA SEFAZ...';
  await new Promise(r => setTimeout(r, 1000));
  
  // Passo 2: Importação
  statusText.textContent = 'BAIXANDO ARQUIVOS XML E IMPORTANDO ITENS DE NOTA...';
  await new Promise(r => setTimeout(r, 1000));
  
  // Passo 3: Conclusão
  const added = await syncSefaz(activeObraId);
  
  syncBox.style.display = 'none';
  btnSync.removeAttribute('disabled');

  if (added && added.length > 0) {
    alert('Sincronização Concluída! Novas notas fiscais eletrônicas identificadas e importadas.');
  } else {
    alert('Sincronização Concluída. Nenhuma nova nota fiscal foi emitida.');
  }

  await renderNFe(container, currentRole, activeObraId);
}


// Modal: Detalhes da Nota Fiscal e seus itens comprados
function openNfeDetailModal(nfeId, nfes) {
  const modal = document.getElementById('global-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalFooter = document.getElementById('modal-footer');

  const nfe = nfes.find(n => n.id === nfeId);
  if (!nfe) return;

  modalTitle.textContent = `NF-e nº ${nfe.number} - Itens e Chave de Acesso`;

  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  modalBody.innerHTML = `
    <div>
      <div style="font-size: 0.8rem; background-color: hsl(var(--bg-input)); border: 1px solid var(--border-light); padding: 12px; border-radius: var(--radius-sm); margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
        <div>
          <span style="font-weight:600; color: white;">Chave de Acesso Sefaz (44 dígitos):</span><br>
          <span id="nfe-access-key-text" style="font-family: monospace; font-size: 0.85rem; letter-spacing: 0.5px; color: hsl(var(--color-primary)); word-break: break-all;">${nfe.accessKey}</span>
        </div>
        <button class="btn btn-secondary btn-sm" id="btn-copy-key" style="white-space: nowrap; padding: 6px 10px;">Copiar Chave</button>
      </div>

      <h4 style="color: white; margin-bottom: 12px; font-size: 0.9rem; text-transform: uppercase;">Itens da Nota Fiscal</h4>
      
      <table class="table-premium" aria-label="Itens da Nota Fiscal">
        <thead>
          <tr>
            <th>Código</th>
            <th>Descrição / Produto</th>
            <th>Qtd.</th>
            <th>Un.</th>
            <th>Preço Un.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${nfe.items.map(item => `
            <tr>
              <td style="font-family: monospace; font-size: 0.8rem;">${item.code}</td>
              <td style="color: white; font-weight: 500;">${item.name}</td>
              <td>${item.qty}</td>
              <td>${item.unit}</td>
              <td>${fmt(item.price)}</td>
              <td style="font-weight: 700; color: white;">${fmt(item.qty * item.price)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="text-align: right; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-light); font-size: 1.1rem; font-weight: 700; color: white;">
        Valor Líquido da Nota: ${fmt(nfe.value)}
      </div>
    </div>
  `;

  modalFooter.innerHTML = `
    <button class="btn btn-secondary" id="btn-close-modal">Fechar</button>
  `;

  // Copiar chave de acesso
  const btnCopy = modalBody.querySelector('#btn-copy-key');
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(nfe.accessKey).then(() => {
        btnCopy.textContent = 'Copiado!';
        btnCopy.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
        btnCopy.style.color = 'hsl(var(--color-success))';
        setTimeout(() => {
          btnCopy.textContent = 'Copiar Chave';
          btnCopy.style.backgroundColor = '';
          btnCopy.style.color = '';
        }, 2000);
      });
    });
  }

  modal.classList.add('active');

  const close = () => modal.classList.remove('active');
  document.getElementById('btn-close-modal').addEventListener('click', close);
  document.getElementById('close-modal-btn').addEventListener('click', close);
}

// Modal: Manifesto do Destinatário (ADM)
function openNfeManifestModal(nfeId, viewContainer, currentRole, nfes, activeObraId) {
  const modal = document.getElementById('global-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalFooter = document.getElementById('modal-footer');

  const nfe = nfes.find(n => n.id === nfeId);
  if (!nfe) return;

  modalTitle.textContent = `Manifestar Destinatário: NF-e nº ${nfe.number}`;

  modalBody.innerHTML = `
    <div>
      <p style="font-size: 0.9rem; color: hsl(var(--text-muted)); margin-bottom: 20px; line-height: 1.4;">
        Você está efetuando o manifesto de recebimento comercial para a nota fiscal emitida por <strong>${nfe.issuer}</strong> no valor de <strong>R$ ${nfe.value.toFixed(2)}</strong>. Escolha a opção correspondente:
      </p>

      <form id="manifest-form">
        <div class="form-group">
          <label class="form-label" for="manifest-option-select">Tipo de Manifesto</label>
          <select id="manifest-option-select" class="form-control" required>
            <option value="confirmado" selected>Confirmar Operação (Mercadoria recebida e aceita no canteiro)</option>
            <option value="desconhecido">Desconhecer Operação (A obra não comprou nada deste fornecedor)</option>
            <option value="nao_realizado">Operação Não Realizada (Compra acordada mas mercadoria não foi entregue)</option>
          </select>
        </div>
        
        <p style="font-size: 0.8rem; color: hsl(var(--text-dim)); line-height: 1.4; margin-top: 12px;">
          * Nota: O manifesto é enviado diretamente à Secretaria da Fazenda de forma definitiva e servirá para respaldar a obra juridicamente.
        </p>
      </form>
    </div>
  `;

  modalFooter.innerHTML = `
    <button class="btn btn-secondary" id="btn-close-modal">Cancelar</button>
    <button class="btn btn-primary" id="btn-submit-manifest">Enviar Manifesto Sefaz</button>
  `;

  modal.classList.add('active');

  const close = () => modal.classList.remove('active');
  document.getElementById('btn-close-modal').addEventListener('click', close);
  document.getElementById('close-modal-btn').addEventListener('click', close);

  document.getElementById('btn-submit-manifest').addEventListener('click', async () => {
    const status = document.getElementById('manifest-option-select').value;
    const success = await manifestNFe(nfeId, status);
    if (success) {
      close();
      await renderNFe(viewContainer, currentRole, activeObraId);
    }
  });
}


// Modal: Lançar Nota no Financeiro (ADM)
function openNfeLaunchModal(nfeId, viewContainer, currentRole, nfes, activeObraId) {
  const modal = document.getElementById('global-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalFooter = document.getElementById('modal-footer');

  const nfe = nfes.find(n => n.id === nfeId);
  if (!nfe) return;

  modalTitle.textContent = `Lançar Financeiro: NF-e nº ${nfe.number}`;

  modalBody.innerHTML = `
    <div>
      <p style="font-size: 0.9rem; color: hsl(var(--text-muted)); margin-bottom: 20px; line-height: 1.4;">
        Fornecedor: <strong>${nfe.issuer}</strong><br>
        Valor: <strong>R$ ${nfe.value.toFixed(2)}</strong><br>
        Para lançar esta nota fiscal de materiais no Contas a Pagar da obra, classifique o centro de custo de destino do orçamento:
      </p>

      <form id="launch-nfe-form">
        <div class="form-group">
          <label class="form-label" for="nfe-cost-select">Classificação de Custo / Destino</label>
          <select id="nfe-cost-select" class="form-control" required>
            <option value="CIMENTO / CONCRETO" selected>Estrutura - Cimento / Concreto</option>
            <option value="AÇO ESTRUTURAL">Estrutura - Aço CA-50/60</option>
            <option value="MADEIRAS / FÔRMAS">Madeiras e Fôrmas de Obra</option>
            <option value="BRITA / AREIA">Insumos Básicos - Brita e Areia</option>
            <option value="TIJOLOS / ALVENARIA">Vedação - Tijolos / Blocos</option>
            <option value="OUTROS MATERIAIS">Outros Materiais e Insumos</option>
          </select>
        </div>
      </form>
    </div>
  `;

  modalFooter.innerHTML = `
    <button class="btn btn-secondary" id="btn-close-modal">Cancelar</button>
    <button class="btn btn-success" id="btn-submit-launch-nfe">Confirmar Lançamento ERP</button>
  `;

  modal.classList.add('active');

  const close = () => modal.classList.remove('active');
  document.getElementById('btn-close-modal').addEventListener('click', close);
  document.getElementById('close-modal-btn').addEventListener('click', close);

  document.getElementById('btn-submit-launch-nfe').addEventListener('click', async () => {
    const costCenter = document.getElementById('nfe-cost-select').value;
    const success = await launchNFe(nfeId, costCenter);
    if (success) {
      close();
      await renderNFe(viewContainer, currentRole, activeObraId);
    }
  });
}
