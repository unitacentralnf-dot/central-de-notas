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

-- Configurando RLS (Row Level Security) - Pode ser ajustado conforme a necessidade
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_fixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boletos_dda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas temporárias para permitir acesso total anônimo (só para testes iniciais)
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
