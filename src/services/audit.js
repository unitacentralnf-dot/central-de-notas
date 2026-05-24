// src/services/audit.js
/**
 * Serviço de auditoria para registrar ações de usuários no banco de dados.
 * Utiliza a chave de serviço (service_role) para inserir logs na tabela `audit_log`.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

// Cliente com privilégios de administrador (service role)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Registra uma ação de auditoria.
 * @param {string|null} userId - ID do usuário (UUID) que realizou a ação. Pode ser null para ações anônimas.
 * @param {string} action - Nome da ação (ex.: 'ocr_upload').
 * @param {object} payload - Dados adicionais que descrevem a ação.
 */
export async function logAction(userId, action, payload) {
  try {
    const { error } = await supabaseAdmin.from('audit_log').insert({
      user_id: userId,
      action,
      payload,
    });
    if (error) {
      console.error('Erro ao gravar audit log:', error);
    }
  } catch (e) {
    console.error('Exceção ao gravar audit log:', e);
  }
}
