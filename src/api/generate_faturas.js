// src/api/generate_faturas.js
// Generates next month invoices for each conta fixa of an obra
// Called from front‑end (button "Gerar próximas") or via Supabase Edge cron

import { getContasFixas } from "./contas_fixas.js";
import { createFatura } from "./faturas.js";
import { nextDueDate } from "../utils/dateHelpers.js";

/**
 * Generates upcoming faturas for the given obraId.
 * For each conta fixa we calculate the next due date based on its `dia_vencimento`.
 * The amount defaults to `valor_medio` (or 0 if not set).
 * Returns an array with the created fatura records.
 */
export async function gerarFaturasProximas(obraId) {
  const contas = await getContasFixas(obraId);
  const created = [];
  for (const conta of contas) {
    const due = nextDueDate(conta.dia_vencimento);
    const fatura = {
      conta_fixa_id: conta.id,
      mes_referencia: `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}`,
      valor: conta.valor_medio || 0,
      data_vencimento: due.toISOString().split("T")[0],
      status: "Pendente",
    };
    const saved = await createFatura(fatura);
    created.push(saved);
  }
  return created;
}

// If this file is executed directly (Supabase Edge Function), expose handler
export async function handler(event, context) {
  const { obraId } = JSON.parse(event.body || "{}");
  if (!obraId) {
    return { statusCode: 400, body: "obraId is required" };
  }
  const result = await gerarFaturasProximas(obraId);
  return { statusCode: 200, body: JSON.stringify(result) };
}
