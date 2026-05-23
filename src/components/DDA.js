import { getDDABills, syncDDABaaS, linkDDAToNFe, linkDDAToFixedBill } from '../services/ddaService.js';
import { getObras, getNFesByObra, getRulesByObra } from '../services/dataService.js';

export async function renderDDA(container, currentRole, activeObraId) {
  const obras = await getObras();
  if (!activeObraId && obras.length > 0) {
    activeObraId = obras[0].id;
  }
  const selectedObra = obras.find(o => o.id === activeObraId);
  const boletosDda = await getDDABills(activeObraId);
  const nfes = await getNFesByObra(activeObraId);
  const rules = await getRulesByObra(activeObraId);
  const isAdm = currentRole === 'adm';

  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Recomendação inteligente (Match)
  function suggestMatch(dda) {
    // Tenta achar NFe com o mesmo CNPJ
    const nfeMatch = nfes.find(n => n.issuerCnpj === dda.emissorCnpj && n.value === dda.valor);
    if (nfeMatch) return { type: 'nfe', obj: nfeMatch, confidence: 'Alta' };
    
    // Tenta achar Conta Fixa com valor aproximado e mesmo mês
    const ruleMatch = rules.find(r => Math.abs(r.estimatedValue - dda.valor) < (r.estimatedValue * 0.2));
    if (ruleMatch) return { type: 'rule', obj: ruleMatch, confidence: 'Média (Conta Fixa)' };
    
    return null;
  }

  const pendentes = boletosDda.filter(b => b.status === 'pendente');
  const processados = boletosDda.filter(b => b.status !== 'pendente');

  const html = `
    <div class="dda-view animate-fade-in">
      <div class="filter-bar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div style="font-size: 0.95rem; color: hsl(var(--text-muted)); font-weight: 500;">
          Caixa de Entrada DDA (Obra): <strong style="color: white;">${selectedObra ? selectedObra.name : 'Nenhuma'}</strong> <span style="font-size: 0.8rem; color: hsl(var(--text-dim)); font-family: monospace; margin-left: 6px;">(CNPJ: ${selectedObra ? selectedObra.cnpj : ''})</span>
        </div>

        <button class="btn btn-primary" id="btn-sync-dda">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 16px; height: 16px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
          </svg>
          Sincronizar Rede Bancária
        </button>
      </div>

      <div id="sync-animation-dda" style="display: none; margin-bottom: 24px;">
        <div class="scan-box" style="height: 120px;">
          <div class="scan-line" style="background: linear-gradient(to right, transparent, hsl(var(--color-primary)), transparent); box-shadow: 0 0 12px hsl(var(--color-primary));"></div>
          <div class="scanning-text" id="sync-status-text">ACESSANDO CÂMARA INTERBANCÁRIA DE PAGAMENTOS (CIP)...</div>
        </div>
      </div>

      <div class="layout-split">
        <!-- Coluna Esquerda: Pendentes -->
        <div class="section-panel" style="margin-bottom: 0;">
          <div class="panel-header">
            <h2 class="panel-title">Boletos Pendentes de Triagem</h2>
            ${!isAdm ? '<span style="font-size: 0.8rem; color: hsl(var(--text-dim)); font-weight: 500;">🔒 Apenas ADM pode vincular</span>' : ''}
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${pendentes.length === 0 ? '<div style="color: hsl(var(--text-dim)); font-size: 0.85rem; padding: 20px; text-align: center;">Nenhum boleto DDA pendente encontrado.</div>' : ''}
            ${pendentes.map(b => {
              const match = suggestMatch(b);
              let matchHtml = '';
              if (match) {
                const isNfe = match.type === 'nfe';
                matchHtml = `
                  <div style="margin-top: 12px; padding: 8px; background-color: rgba(16, 185, 129, 0.1); border-left: 3px solid hsl(158, 82%, 46%); border-radius: 4px; font-size: 0.8rem;">
                    <strong style="color: hsl(158, 82%, 46%);">Sugestão de Vínculo:</strong> 
                    Encontrado ${isNfe ? 'NF-e correspondente' : 'Regra de Conta Fixa compatível'} (${match.confidence}).
                    <div style="margin-top: 8px;">
                      <button class="btn btn-primary btn-sm btn-link-dda" data-id="${b.id}" data-match-type="${match.type}" data-match-id="${match.obj.id}" ${!isAdm ? 'disabled' : ''}>
                        ${isNfe ? 'Vincular à NFe e Lançar' : 'Vincular à Conta Fixa'}
                      </button>
                    </div>
                  </div>
                `;
              }

              return `
                <div class="card-premium" style="display: flex; flex-direction: column; gap: 8px; padding: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                      <div style="font-weight: 600; color: white;">${b.emissorNome}</div>
                      <div style="font-size: 0.75rem; color: hsl(var(--text-dim)); font-family: monospace;">CNPJ: ${b.emissorCnpj}</div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-weight: 700; color: hsl(var(--color-primary)); font-size: 1.1rem;">${fmt(b.valor)}</div>
                      <div style="font-size: 0.75rem; color: hsl(var(--text-muted));">Vence: ${new Date(b.dataVencimento).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>
                  <div style="font-family: monospace; font-size: 0.7rem; color: hsl(var(--text-dim)); background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 4px; letter-spacing: 0.5px;">
                    ${b.linhaDigitavel}
                  </div>
                  ${matchHtml}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Coluna Direita: Vinculados -->
        <div class="section-panel" style="margin-bottom: 0;">
          <div class="panel-header">
            <h2 class="panel-title">Boletos Processados (SaaS)</h2>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${processados.length === 0 ? '<div style="color: hsl(var(--text-dim)); font-size: 0.85rem; padding: 20px; text-align: center;">Nenhum boleto processado.</div>' : ''}
            ${processados.map(b => {
              let badgeText = b.status === 'vinculado_nfe' ? 'Vinculado NFe' : 'Vinculado Fixo';
              return `
                <div style="padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-light); border-radius: var(--radius-md);">
                  <div style="display: flex; justify-content: space-between;">
                    <div style="font-weight: 500; font-size: 0.85rem; color: white;">${b.emissorNome}</div>
                    <span class="badge badge-success"><span class="badge-dot"></span>${badgeText}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                    <div style="font-size: 0.85rem; color: hsl(var(--text-muted));">${fmt(b.valor)}</div>
                    <div style="font-size: 0.75rem; color: hsl(var(--text-dim));">${new Date(b.dataVencimento).toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  const btnSync = container.querySelector('#btn-sync-dda');
  const animContainer = container.querySelector('#sync-animation-dda');
  if (btnSync && animContainer) {
    btnSync.addEventListener('click', async () => {
      btnSync.disabled = true;
      animContainer.style.display = 'block';
      await syncDDABaaS(activeObraId);
      await renderDDA(container, currentRole, activeObraId);
    });
  }

  // Botões de Vincular
  container.querySelectorAll('.btn-link-dda').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const ddaId = e.currentTarget.getAttribute('data-id');
      const matchType = e.currentTarget.getAttribute('data-match-type');
      const matchId = e.currentTarget.getAttribute('data-match-id');
      
      if (matchType === 'nfe') {
        await linkDDAToNFe(ddaId, matchId);
      } else {
        await linkDDAToFixedBill(ddaId, matchId);
      }
      
      await renderDDA(container, currentRole, activeObraId);
    });
  });
}
