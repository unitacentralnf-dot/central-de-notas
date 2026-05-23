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
   - `FOCUSNFE_TOKEN`
   - `PLUGOCR_TOKEN`
   - `PROTESTS_PROVIDER`
   - `DDA_PROVIDER`
   - `INTEGRATIONS_ENC_KEY_B64` (32 bytes base64 para AES-GCM)
   - `CERTS_BUCKET` (ex.: integration-certs)

## Observacao

Hoje o app usa **Fixtures** (Integrações) para manter tudo operacional sem credenciais.
Quando as credenciais existirem, troque os modos para **Edge Function** e implemente:

- `protests-scan`
- `nfe-sync`
- `dda-sync`
- `ocr-parse`
