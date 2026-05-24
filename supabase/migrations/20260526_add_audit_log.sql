-- Migration: add audit_log table
-- Cria tabela para registrar ações dos usuários
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  payload jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Index para buscas rápidas por usuário e data
CREATE INDEX IF NOT EXISTS idx_audit_log_user_created ON public.audit_log (user_id, created_at);
