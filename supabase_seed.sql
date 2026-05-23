-- =======================================================================================
-- SCRIPT DE SEED: MASSA DE DADOS PARA DEMONSTRAÇÃO (APRESENTAÇÃO DIRETORIA)
-- EXECUTE ESTE ARQUIVO DIRETAMENTE NO 'SQL EDITOR' DO SUPABASE
-- =======================================================================================

-- 1. Limpeza opcional (cuidado, apaga os dados existentes nestas tabelas)
-- Descomente as linhas abaixo se quiser limpar o banco antes de injetar os dados falsos.
-- TRUNCATE TABLE boletos_dda CASCADE;
-- TRUNCATE TABLE faturas CASCADE;
-- TRUNCATE TABLE regras_contas_fixas CASCADE;
-- TRUNCATE TABLE notas_fiscais CASCADE;
-- TRUNCATE TABLE obras CASCADE;

-- 2. Inserindo Obras (3 empreendimentos principais)
INSERT INTO obras (id, name, cnpj, location, budget, status) VALUES
('b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', 'Residencial Bella Vista', '12.345.678/0001-99', 'São Paulo - SP', 15000000.00, 'Em Andamento'),
('c288e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a2', 'Condomínio Parque do Sol', '98.765.432/0001-11', 'Campinas - SP', 22000000.00, 'Fase Inicial'),
('d377e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a3', 'Edifício Corporate Tower', '45.123.890/0001-55', 'Barueri - SP', 85000000.00, 'Finalização')
ON CONFLICT (id) DO NOTHING;

-- 3. Inserindo Notas Fiscais Eletrônicas (NFe)
INSERT INTO notas_fiscais (obra_id, numero_nota, fornecedor, valor, data_emissao, status_sefaz, status_manifesto, chave_acesso) VALUES
('b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', '001254', 'Votorantim Cimentos S.A', 45800.00, '2026-05-10', 'Autorizada', 'Confirmada', '35260512345678000199550010000012541987654321'),
('b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', '008992', 'Gerdau Aços Longos', 112500.00, '2026-05-15', 'Autorizada', 'Sem Manifesto', '35260598765432000111550010000089921456789012'),
('b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', '000412', 'Leroy Merlin Cia Brasileira', 8500.50, '2026-05-18', 'Autorizada', 'Confirmada', '35260545123890000155550010000004121112223334'),
('c288e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a2', '045112', 'Tintas Suvinil S.A', 25600.00, '2026-05-05', 'Autorizada', 'Desconhecida', '35260511223344000199550010000451121555666777'),
('d377e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a3', '099182', 'Elevadores Atlas Schindler', 350000.00, '2026-05-20', 'Autorizada', 'Sem Manifesto', '35260588990011000122550010000991821888999000');

-- 4. Inserindo Regras de Contas Fixas (Água, Luz, Internet)
INSERT INTO regras_contas_fixas (id, obra_id, fornecedor, categoria, valor_estimado, dia_vencimento, alertar_variacao) VALUES
('rule-1', 'b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', 'Enel Distribuição São Paulo', 'Energia', 15000.00, 10, true),
('rule-2', 'b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', 'Sabesp S.A', 'Água', 8500.00, 15, true),
('rule-3', 'b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', 'Vivo Empresas', 'Internet', 950.00, 20, false),
('rule-4', 'c288e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a2', 'CPFL Energia', 'Energia', 22000.00, 12, true),
('rule-5', 'd377e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a3', 'Enel Distribuição', 'Energia', 45000.00, 10, true)
ON CONFLICT (id) DO NOTHING;

-- 5. Inserindo Faturas Históricas (Para popular os Gráficos de Variação Mensal)
-- Janeiro a Abril (Pagos) e Maio (Lançada/Pendente) para a 'rule-1' (Enel Bella Vista)
INSERT INTO faturas (conta_fixa_id, mes_referencia, valor, data_vencimento, status) VALUES
('rule-1', '2026-01', 14200.50, '2026-01-10', 'Pago'),
('rule-1', '2026-02', 14850.00, '2026-02-10', 'Pago'),
('rule-1', '2026-03', 15100.20, '2026-03-10', 'Pago'),
('rule-1', '2026-04', 16050.00, '2026-04-10', 'Pago'),
('rule-1', '2026-05', 15800.75, '2026-05-10', 'lancada');

-- Janeiro a Abril (Pagos) e Maio (Lançada/Pendente) para a 'rule-2' (Sabesp Bella Vista)
INSERT INTO faturas (conta_fixa_id, mes_referencia, valor, data_vencimento, status) VALUES
('rule-2', '2026-01', 8100.00, '2026-01-15', 'Pago'),
('rule-2', '2026-02', 8250.00, '2026-02-15', 'Pago'),
('rule-2', '2026-03', 8900.00, '2026-03-15', 'Pago'),
('rule-2', '2026-04', 8600.00, '2026-04-15', 'Pago'),
('rule-2', '2026-05', 9150.00, '2026-05-15', 'pendente');

-- 6. Inserindo Boletos DDA (Câmara Interbancária)
INSERT INTO boletos_dda (obra_id, emissor_nome, emissor_cnpj, valor, data_vencimento, linha_digitavel, status) VALUES
('b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', 'Gerdau Aços Longos', '98.765.432/0001-11', 112500.00, '2026-05-30', '34191.09008 11111.111119 22222.222221 5 999900011250000', 'pendente'),
('b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', 'Votorantim Cimentos S.A', '12.345.678/0001-99', 45800.00, '2026-05-25', '03399.88888 77777.666665 55555.444443 1 888800004580000', 'vinculado_nfe'),
('b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', 'Enel Distribuição São Paulo', '61.695.227/0001-93', 15800.75, '2026-05-10', '836200000158007500100000000000000000000000000000', 'pendente'),
('b199e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a1', 'Localiza Rent a Car S.A', '16.670.085/0001-55', 3450.00, '2026-05-22', '23793.38029 60000.000004 12000.000002 9 78900000345000', 'pendente'),
('c288e8d3-5b8d-4e29-a1b7-a3f8c8d8b9a2', 'Tintas Suvinil S.A', '11.223.344/0001-99', 25600.00, '2026-05-20', '34191.09008 55555.555559 66666.666661 5 999900002560000', 'pendente');
