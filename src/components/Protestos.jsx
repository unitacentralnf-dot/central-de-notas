// src/components/Protestos.jsx
import React, { useState } from "react";
import { getProtestos } from "../services/api.js";
import "../index.css";

/**
 * Renderiza a tela de consulta de protestos.
 * Mantém o mesmo padrão de UI premium usado nos outros componentes
 * (glass‑card, animações, cores harmoniosas).
 */
export async function renderProtests(container, currentRole, obraId = "") {
  container.innerHTML = `
    <div class="glass-card">
      <h2 class="title">Consulta de Protestos (CENPROT)</h2>
      <form id="protest-form" class="flex-col gap-3">
        <input
          type="text"
          placeholder="CNPJ (ex.: 12.345.678/0001-90)"
          id="protest-cnpj"
          class="input-primary"
          required
        />
        <input
          type="text"
          placeholder="ID da obra (opcional)"
          id="protest-obra"
          class="input-primary"
        />
        <button type="submit" class="btn-primary" id="protest-submit">Buscar</button>
      </form>
      <div id="protest-result" class="mt-4"></div>
    </div>
  `;

  const form = container.querySelector("#protest-form");
  const resultDiv = container.querySelector("#protest-result");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const cnpj = container.querySelector("#protest-cnpj").value.trim();
    const obra = container.querySelector("#protest-obra").value.trim();
    if (!cnpj) return (resultDiv.innerHTML = `<p class="status-msg error">Informe o CNPJ.</p>`);
    resultDiv.innerHTML = `<p class="status-msg">Consultando…</p>`;
    try {
      const res = await getProtestos(cnpj, obra || null);
      if (res.success) {
        const list = res.data && res.data.length ? (
          `<ul class="list-protestos">
            ${res.data.map(p => `
              <li class="protest-item">
                <span class="badge badge-warning">${p.status}</span>
                <strong>${p.cartorio}</strong> – Valor: ${p.valor}
                <br/>
                <small class="text-muted">Data: ${new Date(p.data_protesto).toLocaleDateString('pt-BR')}</small>
              </li>`).join('')}
          </ul>`
        ) : `<p class="status-msg">Nenhum protesto encontrado.</p>`;
        resultDiv.innerHTML = `<h3 class="subtitle">Resultados</h3>${list}`;
      } else {
        resultDiv.innerHTML = `<p class="status-msg error">Erro: ${res.error || 'Falha na consulta'}</p>`;
      }
    } catch (err) {
      resultDiv.innerHTML = `<p class="status-msg error">Falha: ${err.message}</p>`;
    }
  });
}
