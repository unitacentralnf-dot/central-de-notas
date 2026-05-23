import { getIntegrationModes, setIntegrationMode } from '../services/integrationModes.js';
import { addNotification } from '../services/dataService.js';

function option(label, value, current) {
  return `<option value="${value}" ${current === value ? 'selected' : ''}>${label}</option>`;
}

function renderSelectRow({ key, title, desc, current }) {
  return `
    <div class="card-premium" style="padding: 18px; display: flex; gap: 14px; align-items: flex-start;">
      <div style="flex: 1;">
        <div style="font-weight: 700; color: white;">${title}</div>
        <div style="margin-top: 6px; font-size: 0.85rem; color: hsl(var(--text-muted)); line-height: 1.4;">${desc}</div>
      </div>
      <div style="min-width: 220px;">
        <select class="filter-select" data-mode-key="${key}" aria-label="Modo de integração ${title}" style="width: 100%;">
          ${option('Fixtures (Dev)', 'fixtures', current)}
          ${option('Edge Function (Produção)', 'edge', current)}
          ${option('Desativado', 'disabled', current)}
        </select>
      </div>
    </div>
  `;
}

export async function renderIntegrations(container) {
  const modes = getIntegrationModes();

  container.innerHTML = `
    <div class="animate-fade-in">
      <div class="section-panel" style="margin-bottom: 0;">
        <div class="panel-header">
          <h2 class="panel-title">Integrações (Modos de Operação)</h2>
          <span style="font-size: 0.8rem; color: hsl(var(--text-dim)); font-weight: 500;">
            Configure como o SaaS roda agora (fixtures) e como vai plugar APIs depois (Edge Functions).
          </span>
        </div>

        <div style="display: grid; gap: 12px;">
          ${renderSelectRow({
            key: 'protests',
            title: 'Protestos (Cartórios)',
            desc: 'Hoje: simulação/fixtures (popula tabela protestos). Depois: CENPROT/IEPTB/Serasa via Edge Function.',
            current: modes.protests,
          })}
          ${renderSelectRow({
            key: 'nfe',
            title: 'NF-e (SEFAZ / Recebidas)',
            desc: 'Hoje: fixtures (gera NF-es de teste). Depois: FocusNFe/Nuvem Fiscal/Tecnospeed via Edge Function.',
            current: modes.nfe,
          })}
          ${renderSelectRow({
            key: 'dda',
            title: 'DDA (CIP / Rede Bancária)',
            desc: 'Hoje: simulação/fixtures (gera boletos DDA). Depois: integração bancária via Edge Function.',
            current: modes.dda,
          })}
          ${renderSelectRow({
            key: 'ocr',
            title: 'OCR (Boletos/PDF)',
            desc: 'Hoje: desativado por padrão. Depois: PlugOCR via Edge Function.',
            current: modes.ocr,
          })}
        </div>

        <div style="margin-top: 14px; font-size: 0.8rem; color: hsl(var(--text-dim));">
          Dica: deixe tudo em <strong>Fixtures</strong> durante desenvolvimento para manter o sistema operacional sem pagar.
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('select[data-mode-key]').forEach((el) => {
    el.addEventListener('change', () => {
      const key = el.getAttribute('data-mode-key');
      const mode = el.value;
      setIntegrationMode(key, mode);
      addNotification('success', `Modo de integração atualizado: ${key} = ${mode}`);
    });
  });
}
