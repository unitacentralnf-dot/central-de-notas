# Supabase Edge Functions

Este diretório contém as **Edge Functions** que atuam como gateway entre o frontend (Vercel) e as APIs externas (Focus NFe, Celcoin, Cenprot, Google Vision, etc.).

## Padrão de entrada/saída
Todas as funções devem receber um **payload JSON** via `event.body` e retornar um objeto padrão:
```json
{
  "success": true,
  "data": {/* resultado da API */},
  "error": null
}
```
Em caso de erro, `success` será `false` e `error` conterá a mensagem.

## Logs
Utilize `console.log` para registrar informações úteis; os logs ficam disponíveis em `supabase functions logs <nome>`.

## Segurança
- Nunca exponha chaves de API no frontend.
- As credenciais devem ser lidas das variáveis de ambiente (`VITE_...`).
- As funções são executadas em ambiente server‑less, isolado do cliente.
