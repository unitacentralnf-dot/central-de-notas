// Supabase Edge Function: dda-sync
// Contract: POST { obraId: string }
// Behavior: when configured, fetch DDA items and persist into `boletos_dda`.
// This is a stub to keep the client "ready to plug".

type ReqBody = { obraId?: string };

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body: ReqBody = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const obraId = body.obraId;
  if (!obraId) {
    return new Response(JSON.stringify({ error: 'obraId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // In the future:
  // - Use banking provider secrets
  // - Fetch DDA items
  // - Upsert into `boletos_dda`

  return new Response(
    JSON.stringify({
      ok: false,
      message: 'dda-sync ainda não implementada. Use Fixtures em Integrações até configurar um provedor.',
      inserted: 0,
    }),
    { headers: { 'Content-Type': 'application/json' }, status: 501 },
  );
});
