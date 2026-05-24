// src/components/OCRUploader.js
// Componente de upload OCR via Google Vision — padrão vanilla JS do projeto.

import { uploadOCR } from '../services/api.js';
import { getObras } from '../services/dataService.js';

/**
 * Converte um File em string base64 (sem prefixo data:...).
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
  });
}

export async function renderOCR(container, currentRole, activeObraId) {
  // Shimmer enquanto carrega obras
  container.innerHTML = `
    <div class="shimmer-container">
      <div class="shimmer-card header-shimmer" style="width: 280px;"></div>
      <div class="shimmer-card" style="height: 220px;"></div>
    </div>
  `;

  const obras = await getObras();
  if (!activeObraId && obras.length > 0) activeObraId = obras[0].id;
  const selectedObra = obras.find(o => o.id === activeObraId);

  container.innerHTML = `
    <div class="ocr-view animate-fade-in">

      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px;">
        <div>
          <h2 style="font-size: 1.35rem; font-weight: 700; color: hsl(var(--text-main)); margin: 0;">
            📄 OCR — Leitura de Documentos
          </h2>
          <p style="font-size: 0.85rem; color: hsl(var(--text-muted)); margin-top: 4px;">
            Obra: <strong>${selectedObra ? selectedObra.name : 'Nenhuma selecionada'}</strong>
          </p>
        </div>
        <span class="badge badge-info" style="font-size: 0.75rem;">Google Vision API</span>
      </div>

      <!-- Upload Card -->
      <div class="card glass-card" style="max-width: 640px;">
        <h3 style="font-size: 1rem; font-weight: 600; color: hsl(var(--text-main)); margin-bottom: 18px;">
          Enviar arquivo para reconhecimento de texto
        </h3>

        <form id="ocr-upload-form">
          <!-- Dropzone -->
          <div id="ocr-dropzone" style="
            border: 2px dashed hsl(var(--border));
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            cursor: pointer;
            transition: border-color 0.2s, background 0.2s;
            background: hsl(var(--surface-alt));
            margin-bottom: 16px;
          ">
            <div style="font-size: 2.5rem; margin-bottom: 8px;">🖼️</div>
            <p style="color: hsl(var(--text-muted)); margin: 0; font-size: 0.9rem;">
              Arraste um PDF, PNG, JPG ou JPEG aqui<br>
              ou <strong style="color: hsl(var(--accent));">clique para selecionar</strong>
            </p>
            <input
              type="file"
              id="ocr-file-input"
              accept=".pdf,.png,.jpg,.jpeg"
              style="display: none;"
            />
          </div>

          <!-- Preview do arquivo selecionado -->
          <div id="ocr-file-preview" style="display: none; margin-bottom: 16px; padding: 10px 14px;
            background: hsl(var(--surface-alt)); border-radius: 8px;
            display: none; align-items: center; gap: 10px;">
            <span style="font-size: 1.2rem;">📎</span>
            <span id="ocr-file-name" style="font-size: 0.85rem; color: hsl(var(--text-main)); font-weight: 500;"></span>
            <button type="button" id="ocr-remove-file" style="
              margin-left: auto; background: none; border: none;
              color: hsl(var(--danger)); cursor: pointer; font-size: 0.8rem;
            ">Remover</button>
          </div>

          <!-- Botão -->
          <button type="submit" id="ocr-submit-btn" class="btn btn-primary" style="width: 100%;" disabled>
            Processar OCR
          </button>
        </form>

        <!-- Status / Resultado -->
        <div id="ocr-status" style="margin-top: 20px; display: none;"></div>
      </div>

      <!-- Resultado (expandível) -->
      <div id="ocr-result-card" style="display: none; margin-top: 24px; max-width: 640px;">
        <div class="card glass-card">
          <h3 style="font-size: 1rem; font-weight: 600; color: hsl(var(--text-main)); margin-bottom: 12px;">
            ✅ Texto extraído
          </h3>
          <pre id="ocr-result-text" style="
            white-space: pre-wrap; word-break: break-word;
            font-size: 0.82rem; color: hsl(var(--text-main));
            background: hsl(var(--surface-alt));
            border-radius: 8px; padding: 16px; max-height: 400px; overflow-y: auto;
          "></pre>
          <button id="ocr-copy-btn" class="btn btn-secondary" style="margin-top: 12px; font-size: 0.8rem;">
            📋 Copiar texto
          </button>
        </div>
      </div>

    </div>
  `;

  // ── Lógica de interação ─────────────────────────────────────────────────────

  const dropzone   = document.getElementById('ocr-dropzone');
  const fileInput  = document.getElementById('ocr-file-input');
  const preview    = document.getElementById('ocr-file-preview');
  const fileName   = document.getElementById('ocr-file-name');
  const removeBtn  = document.getElementById('ocr-remove-file');
  const submitBtn  = document.getElementById('ocr-submit-btn');
  const statusDiv  = document.getElementById('ocr-status');
  const resultCard = document.getElementById('ocr-result-card');
  const resultPre  = document.getElementById('ocr-result-text');
  const copyBtn    = document.getElementById('ocr-copy-btn');
  const form       = document.getElementById('ocr-upload-form');

  let selectedFile = null;

  function setFile(file) {
    selectedFile = file;
    fileName.textContent = file.name;
    preview.style.display = 'flex';
    submitBtn.disabled = false;
    dropzone.style.borderColor = 'hsl(var(--accent))';
  }

  function clearFile() {
    selectedFile = null;
    fileInput.value = '';
    preview.style.display = 'none';
    submitBtn.disabled = true;
    dropzone.style.borderColor = 'hsl(var(--border))';
    statusDiv.style.display = 'none';
    resultCard.style.display = 'none';
  }

  function showStatus(msg, type = 'info') {
    const colors = {
      info:    'hsl(var(--accent))',
      success: 'hsl(var(--success))',
      error:   'hsl(var(--danger))',
    };
    statusDiv.innerHTML = `<p style="color: ${colors[type] || colors.info}; font-size: 0.9rem; margin: 0;">${msg}</p>`;
    statusDiv.style.display = 'block';
  }

  // Drag & Drop
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'hsl(var(--accent))';
    dropzone.style.background = 'hsl(var(--accent) / 0.05)';
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'hsl(var(--border))';
    dropzone.style.background = 'hsl(var(--surface-alt))';
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.background = 'hsl(var(--surface-alt))';
    const file = e.dataTransfer.files[0];
    if (file) setFile(file);
  });

  // Click na dropzone abre o file picker
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) setFile(fileInput.files[0]);
  });

  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearFile();
  });

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Processando...';
    showStatus('⏳ Enviando arquivo para o Google Vision...', 'info');
    resultCard.style.display = 'none';

    try {
      const fileBase64 = await fileToBase64(selectedFile);
      const res = await uploadOCR({ fileBase64, obraId: activeObraId });

      if (res.success) {
        const text = res.data?.responses?.[0]?.fullTextAnnotation?.text
          || res.data?.text
          || JSON.stringify(res.data, null, 2);

        showStatus('✅ OCR concluído com sucesso!', 'success');
        resultPre.textContent = text;
        resultCard.style.display = 'block';
      } else {
        showStatus(`❌ Erro: ${res.error || 'Falha desconhecida'}`, 'error');
      }
    } catch (err) {
      showStatus(`❌ Exceção: ${err.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Processar OCR';
    }
  });

  // Copiar resultado
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(resultPre.textContent).then(() => {
      copyBtn.textContent = '✅ Copiado!';
      setTimeout(() => { copyBtn.textContent = '📋 Copiar texto'; }, 2000);
    });
  });
}
