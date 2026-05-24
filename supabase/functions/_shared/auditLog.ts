// supabase/functions/_shared/auditLog.ts
// Módulo compartilhado entre todas as Edge Functions para gravar logs de auditoria.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Grava uma entrada no audit_log.
 * @param userId - UUID do usuário (extraído do JWT da requisição). Pode ser null para chamadas sem autenticação.
 * @param action - Nome da ação (ex: "dda_upload", "ocr_upload", "protestos_consulta").
 * @param payload - Dados adicionais que descrevem a ação (sem dados sensíveis).
 */
export async function logAction(
  userId: string | null,
  action: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  try {
    const { error } = await adminClient.from("audit_log").insert({
      user_id: userId,
      action,
      payload,
    });
    if (error) {
      console.error("[auditLog] Erro ao gravar log:", error.message);
    }
  } catch (e) {
    console.error("[auditLog] Exceção ao gravar log:", e);
  }
}

/**
 * Extrai o user_id do JWT Bearer token presente no header Authorization.
 * Retorna null se não houver token ou se não for válido.
 */
export function extractUserId(req: Request): string | null {
  try {
    const auth = req.headers.get("authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return null;
    const token = auth.replace("Bearer ", "");
    // Decodifica o payload do JWT (sem verificação de assinatura – a verificação já foi feita pelo Supabase)
    const payloadB64 = token.split(".")[1];
    if (!payloadB64) return null;
    const decoded = JSON.parse(atob(payloadB64));
    return decoded?.sub ?? null;
  } catch {
    return null;
  }
}
