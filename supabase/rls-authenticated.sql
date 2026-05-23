-- Tighten RLS for production: authenticated-only.
-- Apply after you remove anon writes from the client.

-- Helper: allow logged in users
-- (auth.uid() is NULL for anon)

-- OBRAS
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.obras;
DROP POLICY IF EXISTS "Permitir insert anonimo" ON public.obras;
DROP POLICY IF EXISTS "Permitir update anonimo" ON public.obras;
DROP POLICY IF EXISTS "Permitir delete anonimo" ON public.obras;
CREATE POLICY "obras_select_auth" ON public.obras FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "obras_write_auth" ON public.obras FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "obras_update_auth" ON public.obras FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "obras_delete_auth" ON public.obras FOR DELETE USING (auth.uid() IS NOT NULL);

-- CONTAS_FIXAS
ALTER TABLE public.contas_fixas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.contas_fixas;
DROP POLICY IF EXISTS "Permitir insert anonimo" ON public.contas_fixas;
DROP POLICY IF EXISTS "Permitir update anonimo" ON public.contas_fixas;
DROP POLICY IF EXISTS "Permitir delete anonimo" ON public.contas_fixas;
CREATE POLICY "contas_fixas_select_auth" ON public.contas_fixas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "contas_fixas_write_auth" ON public.contas_fixas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "contas_fixas_update_auth" ON public.contas_fixas FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "contas_fixas_delete_auth" ON public.contas_fixas FOR DELETE USING (auth.uid() IS NOT NULL);

-- FATURAS
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.faturas;
DROP POLICY IF EXISTS "Permitir insert anonimo" ON public.faturas;
DROP POLICY IF EXISTS "Permitir update anonimo" ON public.faturas;
DROP POLICY IF EXISTS "Permitir delete anonimo" ON public.faturas;
CREATE POLICY "faturas_select_auth" ON public.faturas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "faturas_write_auth" ON public.faturas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "faturas_update_auth" ON public.faturas FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "faturas_delete_auth" ON public.faturas FOR DELETE USING (auth.uid() IS NOT NULL);

-- PROTESTOS
ALTER TABLE public.protestos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.protestos;
DROP POLICY IF EXISTS "Permitir insert anonimo" ON public.protestos;
DROP POLICY IF EXISTS "Permitir update anonimo" ON public.protestos;
DROP POLICY IF EXISTS "Permitir delete anonimo" ON public.protestos;
CREATE POLICY "protestos_select_auth" ON public.protestos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "protestos_write_auth" ON public.protestos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "protestos_update_auth" ON public.protestos FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "protestos_delete_auth" ON public.protestos FOR DELETE USING (auth.uid() IS NOT NULL);

-- NOTAS_FISCAIS
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.notas_fiscais;
DROP POLICY IF EXISTS "Permitir insert anonimo" ON public.notas_fiscais;
DROP POLICY IF EXISTS "Permitir update anonimo" ON public.notas_fiscais;
DROP POLICY IF EXISTS "Permitir delete anonimo" ON public.notas_fiscais;
CREATE POLICY "notas_fiscais_select_auth" ON public.notas_fiscais FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "notas_fiscais_write_auth" ON public.notas_fiscais FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "notas_fiscais_update_auth" ON public.notas_fiscais FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "notas_fiscais_delete_auth" ON public.notas_fiscais FOR DELETE USING (auth.uid() IS NOT NULL);

-- BOLETOS_DDA
ALTER TABLE public.boletos_dda ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.boletos_dda;
DROP POLICY IF EXISTS "Permitir insert anonimo" ON public.boletos_dda;
DROP POLICY IF EXISTS "Permitir update anonimo" ON public.boletos_dda;
DROP POLICY IF EXISTS "Permitir delete anonimo" ON public.boletos_dda;
CREATE POLICY "boletos_dda_select_auth" ON public.boletos_dda FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "boletos_dda_write_auth" ON public.boletos_dda FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "boletos_dda_update_auth" ON public.boletos_dda FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "boletos_dda_delete_auth" ON public.boletos_dda FOR DELETE USING (auth.uid() IS NOT NULL);

-- SOLICITACOES_ACESSO
ALTER TABLE public.solicitacoes_acesso ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.solicitacoes_acesso;
DROP POLICY IF EXISTS "Permitir escrita anonima" ON public.solicitacoes_acesso;
DROP POLICY IF EXISTS "Permitir update anonimo" ON public.solicitacoes_acesso;
DROP POLICY IF EXISTS "Permitir delete anonimo" ON public.solicitacoes_acesso;
CREATE POLICY "solicitacoes_select_auth" ON public.solicitacoes_acesso FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "solicitacoes_write_auth" ON public.solicitacoes_acesso FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "solicitacoes_update_auth" ON public.solicitacoes_acesso FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "solicitacoes_delete_auth" ON public.solicitacoes_acesso FOR DELETE USING (auth.uid() IS NOT NULL);

-- USUARIOS (profiles)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir insert anonimo" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir update anonimo" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir delete anonimo" ON public.usuarios;
CREATE POLICY "usuarios_select_auth" ON public.usuarios FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "usuarios_write_auth" ON public.usuarios FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "usuarios_update_auth" ON public.usuarios FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "usuarios_delete_auth" ON public.usuarios FOR DELETE USING (auth.uid() IS NOT NULL);

-- CNPJ_CACHE
ALTER TABLE public.cnpj_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.cnpj_cache;
DROP POLICY IF EXISTS "Permitir insert anonimo" ON public.cnpj_cache;
DROP POLICY IF EXISTS "Permitir update anonimo" ON public.cnpj_cache;
CREATE POLICY "cnpj_cache_select_auth" ON public.cnpj_cache FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "cnpj_cache_write_auth" ON public.cnpj_cache FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "cnpj_cache_update_auth" ON public.cnpj_cache FOR UPDATE USING (auth.uid() IS NOT NULL);
