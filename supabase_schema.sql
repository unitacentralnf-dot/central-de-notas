-- Script de inicialização do Supabase

-- Criação da tabela de Usuários do Sistema
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- adm, engenheiro, financeiro, ggo, master
    avatar_iniciais VARCHAR(10) NOT NULL,
    obra_id UUID REFERENCES public.obras(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criação da tabela de Obras
CREATE TABLE IF NOT EXISTS public.obras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20) NOT NULL,
    endereco TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criação da tabela de Contas Fixas
CREATE TABLE IF NOT EXISTS public.contas_fixas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- Energia, Agua, Aluguel, etc
    dia_vencimento INTEGER NOT NULL,
    valor_medio DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criação da tabela de Faturas Mensais (associadas às Contas Fixas)
CREATE TABLE IF NOT EXISTS public.faturas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conta_fixa_id UUID REFERENCES public.contas_fixas(id) ON DELETE CASCADE,
    mes_referencia VARCHAR(7) NOT NULL, -- Formato YYYY-MM
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pendente', -- Pendente, Pago, Atrasado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criação da tabela de Protestos
CREATE TABLE IF NOT EXISTS public.protestos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE,
    cartorio VARCHAR(255) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_protesto DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Ativo', -- Ativo, Regularizado
    credor VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criação da tabela de Notas Fiscais (NFe)
CREATE TABLE IF NOT EXISTS public.notas_fiscais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE,
    chave_acesso VARCHAR(44) NOT NULL UNIQUE,
    fornecedor VARCHAR(255) NOT NULL,
    cnpj_fornecedor VARCHAR(20) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_emissao DATE NOT NULL,
    status_sefaz VARCHAR(50) NOT NULL, -- Autorizada, Cancelada
    status_manifesto VARCHAR(50) DEFAULT 'Sem Manifesto', -- Sem Manifesto, Confirmada, Desconhecida, Nao Realizada
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criação da tabela de DDA (Débito Direto Autorizado)
CREATE TABLE IF NOT EXISTS public.boletos_dda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE,
    emissor_nome VARCHAR(255) NOT NULL,
    emissor_cnpj VARCHAR(20) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    linha_digitavel VARCHAR(255) NOT NULL,
    status_dda VARCHAR(50) DEFAULT 'Pendente', -- Pendente, Vinculado_NFe, Vinculado_ContaFixa, Rejeitado
    nfe_vinculada_id UUID REFERENCES public.notas_fiscais(id) ON DELETE SET NULL,
    conta_fixa_vinculada_id UUID REFERENCES public.contas_fixas(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurando RLS (Row Level Security)
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_fixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boletos_dda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- ⚠️ POLÍTICAS TEMPORÁRIAS (TESTES/DESENVOLVIMENTO)
-- Permitem acesso anônimo total. REMOVA em produção e use as políticas
-- comentadas abaixo com Supabase Auth.
DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.obras;
CREATE POLICY "Permitir leitura anonima" ON public.obras FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.contas_fixas;
CREATE POLICY "Permitir leitura anonima" ON public.contas_fixas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.faturas;
CREATE POLICY "Permitir leitura anonima" ON public.faturas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.protestos;
CREATE POLICY "Permitir leitura anonima" ON public.protestos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.notas_fiscais;
CREATE POLICY "Permitir leitura anonima" ON public.notas_fiscais FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.boletos_dda;
CREATE POLICY "Permitir leitura anonima" ON public.boletos_dda FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.usuarios;
CREATE POLICY "Permitir leitura anonima" ON public.usuarios FOR SELECT USING (true);

-- ======================================================================
-- POLÍTICAS FUTURAS (ativa após migrar para Supabase Auth + hash senhas)
-- ======================================================================
-- 
-- -- Helper: verifica se o usuário logado é master
-- CREATE OR REPLACE FUNCTION public.is_master()
-- RETURNS BOOLEAN AS $$
--   SELECT EXISTS (
--     SELECT 1 FROM public.usuarios
--     WHERE id = auth.uid() AND role = 'master'
--   );
-- $$ LANGUAGE sql STABLE;
-- 
-- -- Helper: verifica se o usuário tem acesso à obra
-- CREATE OR REPLACE FUNCTION public.has_obra_access(obra_id UUID)
-- RETURNS BOOLEAN AS $$
--   SELECT EXISTS (
--     SELECT 1 FROM public.usuarios
--     WHERE id = auth.uid()
--       AND (obra_id IS NULL OR obra_id = has_obra_access.obra_id OR role = 'master' OR role = 'ggo')
--   );
-- $$ LANGUAGE sql STABLE;
-- 
-- -- OBRAS: todos autenticados leem, só master/adm escreve
-- DROP POLICY IF EXISTS "obras_select" ON public.obras;
-- CREATE POLICY "obras_select" ON public.obras FOR SELECT USING (auth.role() = 'authenticated');
-- DROP POLICY IF EXISTS "obras_insert" ON public.obras;
-- CREATE POLICY "obras_insert" ON public.obras FOR INSERT WITH CHECK (public.is_master());
-- DROP POLICY IF EXISTS "obras_update" ON public.obras;
-- CREATE POLICY "obras_update" ON public.obras FOR UPDATE USING (public.is_master());
-- DROP POLICY IF EXISTS "obras_delete" ON public.obras;
-- CREATE POLICY "obras_delete" ON public.obras FOR DELETE USING (public.is_master());
-- 
-- -- CONTAS_FIXAS: leitura para quem tem acesso à obra, escrita só master/adm
-- DROP POLICY IF EXISTS "contas_fixas_select" ON public.contas_fixas;
-- CREATE POLICY "contas_fixas_select" ON public.contas_fixas FOR SELECT USING (public.has_obra_access(obra_id));
-- DROP POLICY IF EXISTS "contas_fixas_insert" ON public.contas_fixas;
-- CREATE POLICY "contas_fixas_insert" ON public.contas_fixas FOR INSERT WITH CHECK (public.is_master());
-- DROP POLICY IF EXISTS "contas_fixas_update" ON public.contas_fixas;
-- CREATE POLICY "contas_fixas_update" ON public.contas_fixas FOR UPDATE USING (public.is_master());
-- DROP POLICY IF EXISTS "contas_fixas_delete" ON public.contas_fixas;
-- CREATE POLICY "contas_fixas_delete" ON public.contas_fixas FOR DELETE USING (public.is_master());
-- 
-- -- FATURAS: mesma regra de contas_fixas
-- DROP POLICY IF EXISTS "faturas_select" ON public.faturas;
-- CREATE POLICY "faturas_select" ON public.faturas FOR SELECT USING (
--   EXISTS (SELECT 1 FROM public.contas_fixas cf WHERE cf.id = conta_fixa_id AND public.has_obra_access(cf.obra_id))
-- );
-- DROP POLICY IF EXISTS "faturas_insert" ON public.faturas;
-- CREATE POLICY "faturas_insert" ON public.faturas FOR INSERT WITH CHECK (public.is_master());
-- DROP POLICY IF EXISTS "faturas_update" ON public.faturas;
-- CREATE POLICY "faturas_update" ON public.faturas FOR UPDATE USING (public.is_master());
-- DROP POLICY IF EXISTS "faturas_delete" ON public.faturas;
-- CREATE POLICY "faturas_delete" ON public.faturas FOR DELETE USING (public.is_master());
-- 
-- -- PROTESTOS, NOTAS_FISCAIS, BOLETOS_DDA: mesma lógica baseada em obra_id
-- DROP POLICY IF EXISTS "protestos_select" ON public.protestos;
-- CREATE POLICY "protestos_select" ON public.protestos FOR SELECT USING (public.has_obra_access(obra_id));
-- DROP POLICY IF EXISTS "notas_fiscais_select" ON public.notas_fiscais;
-- CREATE POLICY "notas_fiscais_select" ON public.notas_fiscais FOR SELECT USING (public.has_obra_access(obra_id));
-- DROP POLICY IF EXISTS "boletos_dda_select" ON public.boletos_dda;
-- CREATE POLICY "boletos_dda_select" ON public.boletos_dda FOR SELECT USING (public.has_obra_access(obra_id));
-- 
-- -- USUARIOS: cada um vê apenas seus próprios dados, master vê todos
-- DROP POLICY IF EXISTS "usuarios_select" ON public.usuarios;
-- CREATE POLICY "usuarios_select" ON public.usuarios FOR SELECT USING (
--   id = auth.uid() OR public.is_master()
-- );
-- DROP POLICY IF EXISTS "usuarios_update" ON public.usuarios;
-- CREATE POLICY "usuarios_update" ON public.usuarios FOR UPDATE USING (id = auth.uid() OR public.is_master());

-- Criação da tabela de Solicitações de Acesso
CREATE TABLE IF NOT EXISTS public.solicitacoes_acesso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    obra_solicitada VARCHAR(255) NOT NULL,
    mensagem TEXT,
    status VARCHAR(50) DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.solicitacoes_acesso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.solicitacoes_acesso;
CREATE POLICY "Permitir leitura anonima" ON public.solicitacoes_acesso FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir escrita anonima" ON public.solicitacoes_acesso;
CREATE POLICY "Permitir escrita anonima" ON public.solicitacoes_acesso FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update anonimo" ON public.solicitacoes_acesso;
CREATE POLICY "Permitir update anonimo" ON public.solicitacoes_acesso FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir delete anonimo" ON public.solicitacoes_acesso;
CREATE POLICY "Permitir delete anonimo" ON public.solicitacoes_acesso FOR DELETE USING (true);

-- Cache de consultas CNPJ.ws (evita rate limit de 3 req/min)
CREATE TABLE IF NOT EXISTS public.cnpj_cache (
    cnpj VARCHAR(20) PRIMARY KEY,
    razao_social VARCHAR(255),
    situacao VARCHAR(50),
    data_abertura DATE,
    porte VARCHAR(50),
    natureza_juridica VARCHAR(255),
    cnae VARCHAR(255),
    logradouro VARCHAR(255),
    bairro VARCHAR(255),
    municipio VARCHAR(255),
    uf VARCHAR(2),
    cep VARCHAR(10),
    telefone VARCHAR(50),
    email VARCHAR(255),
    response_data JSONB,
    ultima_consulta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.cnpj_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.cnpj_cache;
CREATE POLICY "Permitir leitura anonima" ON public.cnpj_cache FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insert anonimo" ON public.cnpj_cache;
CREATE POLICY "Permitir insert anonimo" ON public.cnpj_cache FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update anonimo" ON public.cnpj_cache;
CREATE POLICY "Permitir update anonimo" ON public.cnpj_cache FOR UPDATE USING (true);

-- Integrações por Obra (metadados; segredos devem ser criptografados via Edge Function)
CREATE TABLE IF NOT EXISTS public.obra_integrations (
    obra_id UUID PRIMARY KEY REFERENCES public.obras(id) ON DELETE CASCADE,
    focus_a1_object_path TEXT,
    focus_a1_passphrase_enc TEXT,
    focus_a1_updated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.obra_integrations ENABLE ROW LEVEL SECURITY;

-- Dev policies (ajuste para Auth depois)
DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.obra_integrations;
CREATE POLICY "Permitir leitura anonima" ON public.obra_integrations FOR SELECT USING (true);
