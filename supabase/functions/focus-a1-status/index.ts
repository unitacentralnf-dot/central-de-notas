// Supabase Edge Function: focus-a1-status
// Contract: POST { obraId }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ReqBody = { obraId?: string };

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body: ReqBody = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const obraId = body.obraId;
  if (!obraId) {
    return new Response(JSON.stringify({ error: "obraId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(url, serviceKey);

  const { data, error } = await supabase
    .from("obra_integrations")
    .select("focus_a1_object_path, focus_a1_updated_at")
    .eq("obra_id", obraId)
    .maybeSingle();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const configured = !!data?.focus_a1_object_path;
  const summary = configured
    ? `A1 configurado (atualizado em ${data?.focus_a1_updated_at || 'N/D'})`
    : "A1 nao configurado";

  return new Response(JSON.stringify({ configured, summary }), {
    headers: { "Content-Type": "application/json" },
  });
});
