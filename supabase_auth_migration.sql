-- ===================================================================
-- MIGRAÇÃO: Supabase Auth + Hash de Senhas
-- ===================================================================
-- Este script documenta os passos para migrar de autenticação
-- customizada (senha em texto puro na tabela usuarios) para o
-- Supabase Auth oficial com hash de senha bcrypt.
--
-- EXECUTE APENAS QUANDO FOR FAZER A MIGRAÇÃO EM PRODUÇÃO.
-- ===================================================================

-- 1. Criar a função auxiliar de hash no banco (pgcrypto precisa estar habilitado)
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Remover a coluna senha da tabela usuarios (a senha passa a ser
--    gerenciada exclusivamente pelo Supabase Auth)
-- ALTER TABLE public.usuarios DROP COLUMN senha;

-- 3. Adicionar coluna auth_user_id para vincular ao Supabase Auth
-- ALTER TABLE public.usuarios ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_auth_user_id ON public.usuarios(auth_user_id);

-- 4. Ativar as políticas RLS baseadas em auth.uid() definidas no
--    supabase_schema.sql (remover as políticas anônimas)

-- 5. Atualizar o loginUser() em dataService.js para usar Supabase Auth:
--    const { data, error } = await supabase.auth.signInWithPassword({
--      email, password: senha
--    });

-- 6. Atualizar createUsuario() para usar Supabase Auth Admin:
--    const { data, error } = await supabase.auth.admin.createUser({
--      email, password: senha, email_confirm: true
--    });

-- ===================================================================
-- NOTA: Enquanto esta migração não for executada, o sistema continuará
-- funcionando com autenticação customizada e senhas em texto puro.
-- Isso é aceitável para desenvolvimento/testes, mas NÃO para produção.
-- ===================================================================
