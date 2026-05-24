// supabase/functions/ddaUpload.ts
// Edge Function: Upload e processamento de boletos DDA via Celcoin OCR.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { handler as gateway } from "./apiGateway.ts";
import { logAction, extractUserId } from "./_shared/auditLog.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  const userId = extractUserId(req);

  try {
    const { fileBase64, obraId } = await req.json();

    if (!fileBase64 || !obraId) {
      await logAction(userId, "dda_upload_error", { reason: "missing_fields", obraId });
      return new Response(
        JSON.stringify({ success: false, error: "fileBase64 e obraId são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1️⃣ Envia para OCR Celcoin via gateway
    const celcoinResp = await gateway({
      body: JSON.stringify({
        api: "celcoin",
        action: "boleto/ocr",
        payload: { file: fileBase64 },
      }),
    });

    if (!celcoinResp.success) {
      await logAction(userId, "dda_upload_celcoin_error", { obraId, error: celcoinResp.error });
      return new Response(
        JSON.stringify({ success: false, error: celcoinResp.error }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const { text, amount, dueDate } = celcoinResp.data;

    // 2️⃣ Insere registro de boleto no Supabase
    const { data, error } = await supabase
      .from("boletos_dda")
      .insert({
        obra_id: obraId,
        file_url: `data:application/pdf;base64,${fileBase64.substring(0, 30)}...`,
        ocr_text: text,
        valor: amount,
        vencimento: dueDate,
        status: "pendente",
      })
      .select()
      .single();

    if (error) {
      await logAction(userId, "dda_upload_db_error", { obraId, error: error.message });
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3️⃣ Grava audit log de sucesso
    await logAction(userId, "dda_upload", {
      obraId,
      boletoId: data?.id ?? null,
      amount,
      dueDate,
    });

    return new Response(
      JSON.stringify({ success: true, boleto: data, amount, dueDate }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[ddaUpload] Erro:", err);
    await logAction(userId, "dda_upload_exception", { error: err.message });
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
