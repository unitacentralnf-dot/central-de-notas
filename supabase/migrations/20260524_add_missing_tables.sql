-- Migration: 20260524_add_missing_tables.sql
-- Cria tabelas necessárias para NF‑e, boletos, protestos e auditoria

create table if not exists public.notas (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid references public.obras(id),
  xml_url text,
  pdf_url text,
  status text default 'pending',
  created_at timestamp with time zone default now()
);

create table if not exists public.obras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cert_url text,
  cert_password_enc text,
  created_at timestamp with time zone default now()
);

create table if not exists public.boletos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid references public.obras(id),
  file_url text,
  ocr_text text,
  status text default 'pending',
  created_at timestamp with time zone default now()
);

create table if not exists public.protestos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid references public.obras(id),
  cnpj text not null,
  valor numeric,
  data_registro date,
  created_at timestamp with time zone default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  function_name text,
  payload jsonb,
  created_at timestamp with time zone default now()
);
