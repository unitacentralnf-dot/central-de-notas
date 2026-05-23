-- Script de inicialização do Supabase

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

-- Configurando RLS (Row Level Security) - Pode ser ajustado conforme a necessidade
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_fixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;

-- Políticas temporárias para permitir acesso total anônimo (só para testes iniciais)
CREATE POLICY "Permitir leitura anonima" ON public.obras FOR SELECT USING (true);
CREATE POLICY "Permitir leitura anonima" ON public.contas_fixas FOR SELECT USING (true);
CREATE POLICY "Permitir leitura anonima" ON public.faturas FOR SELECT USING (true);
CREATE POLICY "Permitir leitura anonima" ON public.protestos FOR SELECT USING (true);
CREATE POLICY "Permitir leitura anonima" ON public.notas_fiscais FOR SELECT USING (true);
