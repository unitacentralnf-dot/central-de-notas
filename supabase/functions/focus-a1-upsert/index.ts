// Supabase Edge Function: focus-a1-upsert
// Stores an A1 (.pfx) in Supabase Storage and an encrypted passphrase in DB.
// Contract: POST { obraId, filename, pfxBase64, passphrase }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ReqBody = {
  obraId?: string;
  filename?: string;
  pfxBase64?: string;
  passphrase?: string;
};

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function encrypt(text: string, keyB64: string): Promise<string> {
  const keyBytes = b64ToBytes(keyB64);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(text);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc));
  // store iv + ciphertext base64
  const merged = new Uint8Array(iv.length + ct.length);
  merged.set(iv, 0);
  merged.set(ct, iv.length);
  return btoa(String.fromCharCode(...merged));
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body: ReqBody = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const obraId = body.obraId;
  const pfxBase64 = body.pfxBase64;
  const passphrase = body.passphrase;
  const filename = body.filename || "cert.pfx";

  if (!obraId || !pfxBase64 || !passphrase) {
    return new Response(JSON.stringify({ error: "obraId, pfxBase64, passphrase are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const encKey = Deno.env.get("INTEGRATIONS_ENC_KEY_B64")!;

  const supabase = createClient(url, serviceKey);

  const bucket = Deno.env.get("CERTS_BUCKET") || "integration-certs";
  const objectPath = `focus-a1/${obraId}/${Date.now()}-${filename}`;

  const bytes = b64ToBytes(pfxBase64);
  const { error: upErr } = await supabase.storage.from(bucket).upload(objectPath, bytes, {
    contentType: "application/x-pkcs12",
    upsert: true,
  });

  if (upErr) {
    return new Response(JSON.stringify({ error: upErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const passEnc = await encrypt(passphrase, encKey);
  const { error: dbErr } = await supabase.from("obra_integrations").upsert({
    obra_id: obraId,
    focus_a1_object_path: objectPath,
    focus_a1_passphrase_enc: passEnc,
    focus_a1_updated_at: new Date().toISOString(),
  });

  if (dbErr) {
    return new Response(JSON.stringify({ error: dbErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({
    ok: true,
    summary: `Certificado salvo para obra ${obraId} (path: ${objectPath})`,
  }), { headers: { "Content-Type": "application/json" } });
});
