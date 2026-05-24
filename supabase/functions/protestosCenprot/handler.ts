// supabase/functions/protestosCenprot/handler.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { handler as gateway } from "../apiGateway.ts";
import { logAction, extractUserId } from "../_shared/auditLog.ts";

/**
 * Edge Function para consultar protestos via Cenprot.
 * Payload esperado:
 * {
 *   obraId: string,
 *   cartorio?: string,
 *   dataInicial?: string, // YYYY-MM-DD
 *   dataFinal?: string    // YYYY-MM-DD
 * }
 */
serve(async (req: Request) => {
  const userId = extractUserId(req);

  try {
    const body = await req.json();
    const { obraId, cartorio, dataInicial, dataFinal } = body;

    if (!obraId) {
      await logAction(userId, "protestos_consulta_error", { reason: "missing_obraId" });
      return new Response(
        JSON.stringify({ success: false, error: "obraId é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const resp = await gateway({
      body: JSON.stringify({
        api: "cenprot",
        action: "protestos/search",
        payload: { obraId, cartorio, dataInicial, dataFinal },
      }),
    });

    await logAction(userId, "protestos_consulta", {
      obraId,
      cartorio: cartorio ?? null,
      success: resp.success,
      error: resp.error ?? null,
    });

    return new Response(JSON.stringify(resp), {
      status: resp.success ? 200 : 502,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[protestosCenprot] Erro:", err);
    await logAction(userId, "protestos_consulta_exception", { error: err.message });
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
