# Supabase Edge Functions (Roadmap)

Este projeto roda 100% no browser (Vite) + Supabase.
Tokens de APIs (FocusNFe, DDA, OCR, Protestos) **nao podem ficar no client**.

## Funcao criada

- `integrations-status`
  - Retorna quais integracoes estao configuradas via variaveis de ambiente do Supabase.

- `nfe-sync`
  - Stub: pronto para plugar provedor NF-e (FocusNFe/Nuvem Fiscal/etc.).

- `dda-sync`
  - Stub: pronto para plugar provedor DDA/bancario.

- `focus-a1-upsert`
  - Recebe .pfx (base64) + senha e salva em Storage + DB (senha criptografada).

- `focus-a1-status`
  - Retorna se a obra ja tem A1 configurado.

## Como publicar (quando voce tiver o CLI)

1. Instale o Supabase CLI.
2. Login: `supabase login`
3. Link no projeto: `supabase link --project-ref <seu_ref>`
4. Deploy da funcao: `supabase functions deploy integrations-status`
5. Defina secrets/env vars no Supabase:
   - `VITE_FOCUS_API_KEY` (para API do FocusNFe)
   - `VITE_CELCOIN_API_KEY` (para API da Celcoin)
   - `VITE_CENPROT_API_KEY` (para API da Cenprot)
   - `VITE_GCP_VISION_KEY` (para API de OCR do Google Vision)
   - `VITE_SUPABASE_URL` (injetado automaticamente ou manual)
   - `VITE_SUPABASE_SERVICE_KEY` (injetado automaticamente ou manual)

## Observacao

Hoje o app usa **Fixtures** (Integrações) para manter tudo operacional sem credenciais.
Quando as credenciais existirem, troque os modos para **Edge Function** e implemente:

- `protests-scan`
- `nfe-sync`
- `dda-sync`
- `ocr-parse`
