import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { handler as gateway } from "../apiGateway.ts";
import { logAction, extractUserId } from "../_shared/auditLog.ts";

/**
 * Edge Function para processamento de OCR via Google Vision.
 * Payload esperado:
 * {
 *   obraId: string,
 *   fileBase64: string // PDF ou imagem em base64
 * }
 */
serve(async (req: Request) => {
  const userId = extractUserId(req);

  try {
    const body = await req.json();
    const { obraId, fileBase64 } = body;

    if (!obraId || !fileBase64) {
      await logAction(userId, "ocr_upload_error", { reason: "missing_fields", obraId });
      return new Response(
        JSON.stringify({ success: false, error: "obraId e fileBase64 são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const resp = await gateway({
      body: JSON.stringify({
        api: "ocr",
        action: "images:annotate",
        payload: { obraId, fileBase64 },
      }),
    });

    await logAction(userId, "ocr_upload", {
      obraId,
      success: resp.success,
      error: resp.error ?? null,
    });

    return new Response(JSON.stringify(resp), {
      status: resp.success ? 200 : 502,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[ocrUploader] Erro:", err);
    await logAction(userId, "ocr_upload_exception", { error: err.message });
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
