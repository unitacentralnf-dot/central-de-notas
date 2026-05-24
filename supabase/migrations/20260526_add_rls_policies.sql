-- Migration: 20260526_add_rls_policies.sql
-- Policies RLS for development (allow anonymous access)

-- OBRAS
DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.obras;
CREATE POLICY "Permitir leitura anonima" ON public.obras FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir insert anonimo" ON public.obras;
CREATE POLICY "Permitir insert anonimo" ON public.obras FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir update anonimo" ON public.obras;
CREATE POLICY "Permitir update anonimo" ON public.obras FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Permitir delete anonimo" ON public.obras;
CREATE POLICY "Permitir delete anonimo" ON public.obras FOR DELETE USING (true);

-- CONTAS_FIXAS
DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.contas_fixas;
CREATE POLICY "Permitir leitura anonima" ON public.contas_fixas FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir insert anonimo" ON public.contas_fixas;
CREATE POLICY "Permitir insert anonimo" ON public.contas_fixas FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir update anonimo" ON public.contas_fixas;
CREATE POLICY "Permitir update anonimo" ON public.contas_fixas FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Permitir delete anonimo" ON public.contas_fixas;
CREATE POLICY "Permitir delete anonimo" ON public.contas_fixas FOR DELETE USING (true);

-- FATURAS
DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.faturas;
CREATE POLICY "Permitir leitura anonima" ON public.faturas FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir insert anonimo" ON public.faturas;
CREATE POLICY "Permitir insert anonimo" ON public.faturas FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir update anonimo" ON public.faturas;
CREATE POLICY "Permitir update anonimo" ON public.faturas FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Permitir delete anonimo" ON public.faturas;
CREATE POLICY "Permitir delete anonimo" ON public.faturas FOR DELETE USING (true);

-- PROTESTOS
DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.protestos;
CREATE POLICY "Permitir leitura anonima" ON public.protestos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir insert anonimo" ON public.protestos;
CREATE POLICY "Permitir insert anonimo" ON public.protestos FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir update anonimo" ON public.protestos;
CREATE POLICY "Permitir update anonimo" ON public.protestos FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Permitir delete anonimo" ON public.protestos;
CREATE POLICY "Permitir delete anonimo" ON public.protestos FOR DELETE USING (true);

-- NOTAS_FISCAIS
DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.notas_fiscais;
CREATE POLICY "Permitir leitura anonima" ON public.notas_fiscais FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir insert anonimo" ON public.notas_fiscais;
CREATE POLICY "Permitir insert anonimo" ON public.notas_fiscais FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir update anonimo" ON public.notas_fiscais;
CREATE POLICY "Permitir update anonimo" ON public.notas_fiscais FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Permitir delete anonimo" ON public.notas_fiscais;
CREATE POLICY "Permitir delete anonimo" ON public.notas_fiscais FOR DELETE USING (true);

-- BOLETOS_DDA
DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.boletos_dda;
CREATE POLICY "Permitir leitura anonima" ON public.boletos_dda FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir insert anonimo" ON public.boletos_dda;
CREATE POLICY "Permitir insert anonimo" ON public.boletos_dda FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir update anonimo" ON public.boletos_dda;
CREATE POLICY "Permitir update anonimo" ON public.boletos_dda FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Permitir delete anonimo" ON public.boletos_dda;
CREATE POLICY "Permitir delete anonimo" ON public.boletos_dda FOR DELETE USING (true);

-- USUARIOS
DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.usuarios;
CREATE POLICY "Permitir leitura anonima" ON public.usuarios FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir insert anonimo" ON public.usuarios;
CREATE POLICY "Permitir insert anonimo" ON public.usuarios FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir update anonimo" ON public.usuarios;
CREATE POLICY "Permitir update anonimo" ON public.usuarios FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Permitir delete anonimo" ON public.usuarios;
CREATE POLICY "Permitir delete anonimo" ON public.usuarios FOR DELETE USING (true);

-- CNPJ_CACHE
DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.cnpj_cache;
CREATE POLICY "Permitir leitura anonima" ON public.cnpj_cache FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir insert anonimo" ON public.cnpj_cache;
CREATE POLICY "Permitir insert anonimo" ON public.cnpj_cache FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir update anonimo" ON public.cnpj_cache;
CREATE POLICY "Permitir update anonimo" ON public.cnpj_cache FOR UPDATE USING (true);

-- OBRA_INTEGRATIONS
DROP POLICY IF EXISTS "Permitir leitura anonima" ON public.obra_integrations;
CREATE POLICY "Permitir leitura anonima" ON public.obra_integrations FOR SELECT USING (true);
