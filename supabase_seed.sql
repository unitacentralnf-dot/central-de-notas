-- =======================================================================================
-- SCRIPT DE SEED: MASSA DE DADOS PARA DEMONSTRAÇÃO (APRESENTAÇÃO DIRETORIA)
-- EXECUTE ESTE ARQUIVO DIRETAMENTE NO 'SQL EDITOR' DO SUPABASE
-- =======================================================================================

-- 1. Limpeza opcional (cuidado, apaga os dados existentes nestas tabelas)
-- Descomente as linhas abaixo se quiser limpar o banco antes de injetar os dados falsos.
-- TRUNCATE TABLE boletos_dda CASCADE;
-- TRUNCATE TABLE faturas CASCADE;
-- TRUNCATE TABLE contas_fixas CASCADE;
-- TRUNCATE TABLE notas_fiscais CASCADE;
-- TRUNCATE TABLE protestos CASCADE;
-- TRUNCATE TABLE obras CASCADE;

-- 2. Inserindo Obras (3 empreendimentos principais com colunas corretas do schema)
INSERT INTO public.obras (id, nome, cnpj, endereco) VALUES
('b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', 'Residencial Bella Vista', '12.345.678/0001-99', 'Av. Paulista, 1000 - São Paulo - SP'),
('c288e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a2', 'Condomínio Parque do Sol', '98.765.432/0001-11', 'Rua das Flores, 500 - Campinas - SP'),
('d377e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a3', 'Edifício Corporate Tower', '45.123.890/0001-55', 'Al. Rio Negro, 200 - Barueri - SP')
ON CONFLICT (id) DO NOTHING;

-- 3. Inserindo Notas Fiscais Eletrônicas (NFe com colunas corretas do schema)
INSERT INTO public.notas_fiscais (id, obra_id, chave_acesso, fornecedor, cnpj_fornecedor, valor, data_emissao, status_sefaz, status_manifesto) VALUES
('f111e8d3-5b8d-4e29-a1b7-a3f8c8d8b9f1', 'b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', '35260512345678000199550010000012541987654321', 'Votorantim Cimentos S.A', '12.345.678/0001-99', 45800.00, '2026-05-10', 'Autorizada', 'Confirmada'),
('f222e8d3-5b8d-4e29-a1b7-a3f8c8d8b9f2', 'b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', '35260598765432000111550010000089921456789012', 'Gerdau Aços Longos', '98.765.432/0001-11', 112500.00, '2026-05-15', 'Autorizada', 'Sem Manifesto'),
('f333e8d3-5b8d-4e29-a1b7-a3f8c8d8b9f3', 'b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', '35260545123890000155550010000004121112223334', 'Leroy Merlin Cia Brasileira', '45.123.890/0001-55', 8500.50, '2026-05-18', 'Autorizada', 'Confirmada'),
('f444e8d3-5b8d-4e29-a1b7-a3f8c8d8b9f4', 'c288e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a2', '35260511223344000199550010000451121555666777', 'Tintas Suvinil S.A', '11.223.344/0001-99', 25600.00, '2026-05-05', 'Autorizada', 'Desconhecida'),
('f555e8d3-5b8d-4e29-a1b7-a3f8c8d8b9f5', 'd377e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a3', '35260588990011000122550010000991821888999000', 'Elevadores Atlas Schindler', '88.990.011/0001-22', 350000.00, '2026-05-20', 'Autorizada', 'Sem Manifesto')
ON CONFLICT (id) DO NOTHING;

-- 4. Inserindo Contas Fixas (Tabela com ID UUID válidos)
INSERT INTO public.contas_fixas (id, obra_id, nome, tipo, dia_vencimento, valor_medio) VALUES
('e111e8d3-5b8d-4e29-a1b7-a3f8c8d8b9e1', 'b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', 'Enel Distribuição São Paulo', 'Energia', 10, 15000.00),
('e222e8d3-5b8d-4e29-a1b7-a3f8c8d8b9e2', 'b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', 'Sabesp S.A', 'Agua', 15, 8500.00),
('e333e8d3-5b8d-4e29-a1b7-a3f8c8d8b9e3', 'b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', 'Vivo Empresas', 'Internet', 20, 950.00),
('e444e8d3-5b8d-4e29-a1b7-a3f8c8d8b9e4', 'c288e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a2', 'CPFL Energia', 'Energia', 12, 22000.00),
('e555e8d3-5b8d-4e29-a1b7-a3f8c8d8b9e5', 'd377e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a3', 'Enel Distribuição', 'Energia', 10, 45000.00)
ON CONFLICT (id) DO NOTHING;

-- 5. Inserindo Faturas Históricas (Com ID UUID válidos da conta fixa)
-- Janeiro a Abril (Pagos) e Maio (Pendente) para a rule-1 (Enel Bella Vista)
INSERT INTO public.faturas (conta_fixa_id, mes_referencia, valor, data_vencimento, status) VALUES
('e111e8d3-5b8d-4e29-a1b7-a3f8c8d8b9e1', '2026-01', 14200.50, '2026-01-10', 'Pago'),
('e111e8d3-5b8d-4e29-a1b7-a3f8c8d8b9e1', '2026-02', 14850.00, '2026-02-10', 'Pago'),
('e111e8d3-5b8d-4e29-a1b7-a3f8c8d8b9e1', '2026-03', 15100.20, '2026-03-10', 'Pago'),
('e111e8d3-5b8d-4e29-a1b7-a3f8c8d8b9e1', '2026-04', 16050.00, '2026-04-10', 'Pago'),
('e111e8d3-5b8d-4e29-a1b7-a3f8c8d8b9e1', '2026-05', 15800.75, '2026-05-10', 'Pendente');

-- Janeiro a Abril (Pagos) e Maio (Pendente) para a rule-2 (Sabesp Bella Vista)
INSERT INTO public.faturas (conta_fixa_id, mes_referencia, valor, data_vencimento, status) VALUES
('e222e8d3-5b8d-4e29-a1b7-a3f8c8d8b9e2', '2026-01', 8100.00, '2026-01-15', 'Pago'),
('e222e8d3-5b8d-4e29-a1b7-a3f8c8d8b9e2', '2026-02', 8250.00, '2026-02-15', 'Pago'),
('e222e8d3-5b8d-4e29-a1b7-a3f8c8d8b9e2', '2026-03', 8900.00, '2026-03-15', 'Pago'),
('e222e8d3-5b8d-4e29-a1b7-a3f8c8d8b9e2', '2026-04', 8600.00, '2026-04-15', 'Pago'),
('e222e8d3-5b8d-4e29-a1b7-a3f8c8d8b9e2', '2026-05', 9150.00, '2026-05-15', 'Pendente');

-- 6. Inserindo Boletos DDA (Com colunas corretas do schema e relacionamentos reais)
INSERT INTO public.boletos_dda (obra_id, emissor_nome, emissor_cnpj, valor, data_vencimento, linha_digitavel, status_dda, nfe_vinculada_id) VALUES
('b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', 'Gerdau Aços Longos', '98.765.432/0001-11', 112500.00, '2026-05-30', '34191.09008 11111.111119 22222.222221 5 999900011250000', 'pendente', NULL),
('b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', 'Votorantim Cimentos S.A', '12.345.678/0001-99', 45800.00, '2026-05-25', '03399.88888 77777.666665 55555.444443 1 888800004580000', 'vinculado_nfe', 'f111e8d3-5b8d-4e29-a1b7-a3f8c8d8b9f1'),
('b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', 'Enel Distribuição São Paulo', '61.695.227/0001-93', 15800.75, '2026-05-10', '836200000158007500100000000000000000000000000000', 'pendente', NULL),
('b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', 'Localiza Rent a Car S.A', '16.670.085/0001-55', 3450.00, '2026-05-22', '23793.38029 60000.000004 12000.000002 9 78900000345000', 'pendente', NULL),
('c288e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a2', 'Tintas Suvinil S.A', '11.223.344/0001-99', 25600.00, '2026-05-20', '34191.09008 55555.555559 66666.666661 5 999900002560000', 'pendente', NULL);

-- 7. Inserindo Protestos (Módulo de Protestos da Diretoria)
INSERT INTO public.protestos (obra_id, cartorio, valor, data_protesto, status, credor) VALUES
('b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', '1º Cartório de Protesto de São Paulo', 1250.00, '2026-05-02', 'Ativo', 'Tubos e Conexões Tigre S.A'),
('b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', '3º Cartório de Protesto de São Paulo', 4500.00, '2026-04-18', 'Regularizado', 'Metalúrgica Gerdau S.A'),
('c288e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a2', 'Cartório de Registro de Protestos de Campinas', 8900.00, '2026-05-12', 'Ativo', 'Cimento Cauê S.A');
