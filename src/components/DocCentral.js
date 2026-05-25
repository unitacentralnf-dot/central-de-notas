import { getObras, getDocumentsByObra } from '../services/dataService.js';
import { setGlobalObra } from '../main.js';

export async function renderDocCentral(container, currentRole, activeObraId) {
  // Shimmer inicial
  container.innerHTML = `
    <div class="shimmer-container">
      <div class="shimmer-card header-shimmer" style="height: 50px; margin-bottom: 20px;"></div>
      <div class="shimmer-grid" style="grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px;">
        <div class="shimmer-card" style="height: 40px;"></div>
        <div class="shimmer-card" style="height: 40px;"></div>
        <div class="shimmer-card" style="height: 40px;"></div>
      </div>
      <div class="shimmer-card" style="height: 250px;"></div>
    </div>
  `;

  const obras = await getObras();
  const activeObra = obras.find(o => o.id === activeObraId) || obras[0];
  
  if (!activeObra) {
    container.innerHTML = `
      <div class="section-panel text-center" style="padding: 40px;">
        <p style="color: hsl(var(--text-dim));">Nenhuma obra cadastrada. Selecione ou crie uma obra primeiro.</p>
      </div>
    `;
    return;
  }

  // Buscar todos os documentos da obra ativa
  const allDocs = await getDocumentsByObra(activeObra.id);

  // Estados Locais (em memória)
  let filterType = 'all'; // all, xml, pdf, boleto, comprovante
  let searchQuery = '';

  function renderList() {
    // Filtrar documentos
    let filtered = allDocs;
    if (filterType !== 'all') {
      filtered = filtered.filter(d => d.type === filterType);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(q) || 
        d.issuer.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      );
    }

    const docListContainer = document.getElementById('doc-timeline-container');
    if (!docListContainer) return;

    if (filtered.length === 0) {
      docListContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: hsl(var(--text-dim));">
          <p style="font-size: 0.95rem;">Nenhum documento encontrado com os filtros selecionados.</p>
        </div>
      `;
      return;
    }

    const fmtCurrency = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const fmtDate = (dStr) => {
      const [y, m, d] = dStr.split('-');
      return `${d}/${m}/${y}`;
    };

    docListContainer.innerHTML = `
      <div class="doc-timeline">
        ${filtered.map(doc => {
          let dotColor = 'primary'; // danger, success, warning, info
          let iconClass = 'pdf';
          let iconSvg = '';

          if (doc.type === 'xml') {
            dotColor = 'warning';
            iconClass = 'xml';
            // Ícone XML
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>`;
          } else if (doc.type === 'pdf') {
            dotColor = 'danger';
            iconClass = 'pdf';
            // Ícone PDF / DANFE
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>`;
          } else if (doc.type === 'boleto') {
            dotColor = 'info';
            iconClass = 'boleto';
            // Ícone de Código de Barras / Boleto
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v14.25c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 18V4.875ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v14.25c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 18V4.875Z" /></svg>`;
          } else if (doc.type === 'comprovante') {
            dotColor = 'success';
            iconClass = 'comprovante';
            // Ícone de check / Recibo
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" /></svg>`;
          }

          return `
            <div class="doc-timeline-item">
              <span class="doc-timeline-dot ${dotColor}"></span>
              
              <div class="doc-card-rich">
                <div class="doc-card-left">
                  <div class="doc-icon-container ${iconClass}">
                    ${iconSvg}
                  </div>
                  <div class="doc-details">
                    <h3>${doc.name}</h3>
                    <p style="font-weight: 500; color: hsl(var(--text-main)); font-size: 0.82rem;">${doc.issuer}</p>
                    <div class="doc-meta">
                      <span>Categoria: <strong>${doc.category}</strong></span>
                      <span>•</span>
                      <span>Valor: <strong>${fmtCurrency(doc.value)}</strong></span>
                      <span>•</span>
                      <span>Data: <strong>${fmtDate(doc.date)}</strong></span>
                      <span>•</span>
                      <span>Tamanho: ${doc.size}</span>
                    </div>
                  </div>
                </div>

                <div class="doc-actions">
                  <button class="btn btn-secondary btn-sm action-view-doc" data-id="${doc.id}" data-name="${doc.name}" style="padding: 6px 10px;">Visualizar</button>
                  <button class="btn btn-primary btn-sm action-download-doc" data-id="${doc.id}" data-name="${doc.name}" style="padding: 6px 10px;">Baixar</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Vincular Ações dos Botões da Lista
    const toast = (msg, success = true) => {
      const el = document.createElement('div');
      el.style.position = 'fixed';
      el.style.bottom = '24px';
      el.style.right = '24px';
      el.style.backgroundColor = success ? 'hsl(var(--color-success))' : 'hsl(var(--color-danger))';
      el.style.color = 'white';
      el.style.padding = '12px 24px';
      el.style.borderRadius = 'var(--radius-md)';
      el.style.boxShadow = 'var(--shadow-md)';
      el.style.zIndex = '9999';
      el.style.fontSize = '0.9rem';
      el.style.fontWeight = '600';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.gap = '8px';
      el.innerHTML = `<span>${success ? '✅' : '❌'}</span> ${msg}`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2500);
    };

    docListContainer.querySelectorAll('.action-view-doc').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const docName = e.currentTarget.getAttribute('data-name');
        toast(`Abrindo visualizador para: ${docName}...`);
      });
    });

    docListContainer.querySelectorAll('.action-download-doc').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const docName = e.currentTarget.getAttribute('data-name');
        toast(`Download concluído: ${docName}`);
      });
    });
  }

  // HTML da View
  container.innerHTML = `
    <div class="doc-central-view animate-fade-in">
      <div class="section-panel" style="margin-bottom: 24px;">
        <div class="panel-header" style="flex-wrap: wrap; gap: 16px; justify-content: space-between; align-items: center;">
          <div>
            <h2 class="panel-title" style="font-size: 1.15rem;">Central de Documentos da Obra: <span style="color: hsl(var(--color-primary));">${activeObra.name}</span></h2>
            <p style="font-size: 0.8rem; color: hsl(var(--text-muted)); margin-top: 4px;">CNPJ: ${activeObra.cnpj} | Endereço: ${activeObra.address}</p>
          </div>
          
          <div style="display: flex; gap: 10px; align-items: center;">
            <span style="font-size: 0.8rem; color: hsl(var(--text-dim)); font-weight: 600;">FILTRAR OBRA:</span>
            <select id="docObraSelect" class="profile-select" style="padding-block: 6px;">
              ${obras.map(o => `<option value="${o.id}" ${o.id === activeObra.id ? 'selected' : ''}>${o.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Filtros e Caixa de Busca -->
        <div class="doc-filters" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-light);">
          <div style="display: flex; gap: 8px; flex-wrap: wrap; flex-grow: 1;">
            <button class="btn btn-secondary btn-sm filter-doc-btn active" data-type="all">Todos</button>
            <button class="btn btn-secondary btn-sm filter-doc-btn" data-type="xml" style="border-left-color: #f59e0b;">Notas XML</button>
            <button class="btn btn-secondary btn-sm filter-doc-btn" data-type="pdf" style="border-left-color: #ef4444;">DANFE PDF</button>
            <button class="btn btn-secondary btn-sm filter-doc-btn" data-type="boleto" style="border-left-color: #3b82f6;">Boletos</button>
            <button class="btn btn-secondary btn-sm filter-doc-btn" data-type="comprovante" style="border-left-color: #10b981;">Comprovantes</button>
          </div>

          <div class="search-box-container" style="position: relative; width: 280px;">
            <input type="text" id="doc-search-input" class="form-control" placeholder="Buscar por fornecedor, nome..." style="padding-block: 6px; padding-left: 36px; font-size: 0.85rem;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: hsl(var(--text-dim));">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Container Dinâmico da Linha do Tempo -->
      <div class="section-panel" style="margin-bottom: 0;">
        <h3 style="font-size: 0.88rem; font-weight: 700; text-transform: uppercase; color: hsl(var(--text-muted)); letter-spacing: 0.5px; margin-bottom: 16px;">Linha do tempo documental (DANFE, XML, boletos e pagamentos)</h3>
        <div id="doc-timeline-container">
          <!-- Renderizado via JS -->
        </div>
      </div>
    </div>
  `;

  // Renderizar Lista
  renderList();

  // Evento de seleção de obra
  const selectObra = document.getElementById('docObraSelect');
  if (selectObra) {
    selectObra.addEventListener('change', async (e) => {
      const selectedId = e.target.value;
      setGlobalObra(selectedId); // Atualiza no seletor global reativo do main.js
      await renderDocCentral(container, currentRole, selectedId);
    });
  }

  // Evento de clique nos filtros
  const filterBtns = container.querySelectorAll('.filter-doc-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      filterType = e.currentTarget.getAttribute('data-type');
      renderList();
    });
  });

  // Evento de busca
  const searchInput = document.getElementById('doc-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderList();
    });
  }
}
