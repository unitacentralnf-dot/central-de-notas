-- Migration: 20260525_add_extra_tables.sql
-- Cria tabelas que ainda não existiam mas são referenciadas nas policies RLS

CREATE TABLE IF NOT EXISTS public.cnpj_cache (
  cnpj TEXT PRIMARY KEY,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.obra_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID REFERENCES public.obras(id),
  integration_name TEXT,
  config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
