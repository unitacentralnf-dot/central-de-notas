#!/bin/bash
# scripts/cleanup_old_files.sh
# Script para remover arquivos temporários e logs de auditoria antigos após 30 dias.

echo "🧹 Iniciando limpeza de logs e arquivos antigos..."

# 1. Limpar arquivos temporários locais com mais de 30 dias
TEMP_DIR="./supabase/.temp"
if [ -d "$TEMP_DIR" ]; then
  echo "Verificando arquivos temporários locais em $TEMP_DIR..."
  find "$TEMP_DIR" -type f -mtime +30 -exec rm -f {} \;
  echo "✓ Arquivos temporários locais com mais de 30 dias limpos."
else
  echo "Nenhum diretório temporário local encontrado em $TEMP_DIR."
fi

# 2. Limpar logs de auditoria e solicitações antigas finalizadas
echo "Limpando registros antigos no banco de dados..."
if command -v supabase &> /dev/null; then
  # Remove logs de auditoria com mais de 30 dias
  supabase db query "DELETE FROM public.audit_log WHERE created_at < NOW() - INTERVAL '30 days';"
  # Remove solicitações de acesso finalizadas (aprovadas/recusadas) com mais de 30 dias
  supabase db query "DELETE FROM public.solicitacoes_acesso WHERE created_at < NOW() - INTERVAL '30 days' AND status != 'pendente';"
  echo "✓ Logs de auditoria antigos e solicitações resolvidas limpos com sucesso no Supabase."
else
  echo "⚠️ Supabase CLI não encontrada. Pulando limpeza automática de banco de dados."
fi

echo "✓ Processo de limpeza concluído com sucesso!"
