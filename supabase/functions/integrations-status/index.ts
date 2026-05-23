// Supabase Edge Function: integrations-status
// Returns which integrations are configured via env vars.

Deno.serve(async (_req) => {
  const hasFocus = !!Deno.env.get('FOCUSNFE_TOKEN');
  const hasPlugOcr = !!Deno.env.get('PLUGOCR_TOKEN');
  const hasProtests = !!Deno.env.get('PROTESTS_PROVIDER');
  const hasDda = !!Deno.env.get('DDA_PROVIDER');

  return new Response(
    JSON.stringify({
      focusNfe: { configured: hasFocus },
      plugOcr: { configured: hasPlugOcr },
      protests: { configured: hasProtests, provider: Deno.env.get('PROTESTS_PROVIDER') || '' },
      dda: { configured: hasDda, provider: Deno.env.get('DDA_PROVIDER') || '' },
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
