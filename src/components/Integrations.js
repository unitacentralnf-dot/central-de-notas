import { getIntegrationModes, setIntegrationMode } from '../services/integrationModes.js';
import { addNotification, getObras } from '../services/dataService.js';
import { invokeEdge } from '../services/edgeFunctions.js';

function option(label, value, current) {
  return `<option value="${value}" ${current === value ? 'selected' : ''}>${label}</option>`;
}

function renderSelectRow({ key, title, desc, current }) {
  return `
    <div class="card-premium" style="padding: 18px; display: flex; gap: 14px; align-items: flex-start;">
      <div style="flex: 1;">
        <div style="font-weight: 700; color: hsl(var(--text-main));">${title}</div>
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
  const obras = await getObras();

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

        <div style="margin-top: 22px; border-top: 1px solid var(--border-light); padding-top: 18px;">
          <div class="panel-header" style="padding: 0; margin-bottom: 10px;">
            <h2 class="panel-title" style="font-size: 0.95rem;">Focus NFe (NF-e Recebidas) | Certificado A1 por Obra</h2>
            <span style="font-size: 0.8rem; color: hsl(var(--text-dim)); font-weight: 500;">
              Upload do .pfx + senha (armazenado via Edge Function). Um certificado por CNPJ/obra.
            </span>
          </div>

          <div class="card-premium" style="padding: 18px;">
            <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 12px; align-items: end;">
              <div>
                <label class="form-label" style="font-size: 0.75rem;" for="focus-obra-select">Obra</label>
                <select id="focus-obra-select" class="filter-select" style="width: 100%;">
                  ${(obras || []).map(o => `<option value="${o.id}">${o.name} (${o.cnpj})</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="form-label" style="font-size: 0.75rem;" for="focus-a1-file">Certificado A1 (.pfx)</label>
                <input id="focus-a1-file" type="file" class="form-control" accept=".pfx" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: end; margin-top: 12px;">
              <div>
                <label class="form-label" style="font-size: 0.75rem;" for="focus-a1-pass">Senha do certificado</label>
                <input id="focus-a1-pass" type="password" class="form-control" placeholder="Senha do .pfx" />
              </div>
              <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn btn-secondary" id="btn-focus-status">Ver Status</button>
                <button class="btn btn-primary" id="btn-focus-upload">Salvar Certificado</button>
              </div>
            </div>

            <div id="focus-a1-msg" style="display:none; margin-top: 12px; font-size: 0.85rem;"></div>
          </div>
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

  const msgBox = container.querySelector('#focus-a1-msg');
  const obraSelect = container.querySelector('#focus-obra-select');
  const fileInput = container.querySelector('#focus-a1-file');
  const passInput = container.querySelector('#focus-a1-pass');
  const btnUpload = container.querySelector('#btn-focus-upload');
  const btnStatus = container.querySelector('#btn-focus-status');

  function showMsg(type, text) {
    if (!msgBox) return;
    msgBox.style.display = 'block';
    const colors = {
      success: 'hsl(var(--color-success))',
      error: 'hsl(var(--color-danger))',
      info: 'hsl(var(--color-info))',
    };
    msgBox.style.color = colors[type] || colors.info;
    msgBox.textContent = text;
  }

  async function fileToBase64(file) {
    const buf = await file.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buf);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  if (btnStatus) {
    btnStatus.addEventListener('click', async () => {
      try {
        showMsg('info', 'Consultando status...');
        const obraId = obraSelect?.value;
        const res = await invokeEdge('focus-a1-status', { obraId });
        showMsg('success', res?.configured ? `Configurado: ${res.summary}` : 'Nao configurado para esta obra');
      } catch (e) {
        showMsg('error', e.message);
      }
    });
  }

  if (btnUpload) {
    btnUpload.addEventListener('click', async () => {
      try {
        const obraId = obraSelect?.value;
        const file = fileInput?.files?.[0];
        const pass = passInput?.value || '';
        if (!obraId) throw new Error('Selecione a obra');
        if (!file) throw new Error('Selecione o arquivo .pfx');
        if (!pass) throw new Error('Informe a senha do certificado');

        showMsg('info', 'Enviando certificado (Edge Function)...');
        btnUpload.setAttribute('disabled', 'true');
        const base64 = await fileToBase64(file);
        const res = await invokeEdge('focus-a1-upsert', {
          obraId,
          filename: file.name,
          pfxBase64: base64,
          passphrase: pass,
        });
        addNotification('success', 'Certificado salvo com sucesso');
        showMsg('success', res?.summary || 'Certificado salvo');
        passInput.value = '';
        fileInput.value = '';
      } catch (e) {
        showMsg('error', e.message);
      } finally {
        btnUpload?.removeAttribute('disabled');
      }
    });
  }
}
