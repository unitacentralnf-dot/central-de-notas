import { handler as gateway } from "../apiGateway.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function handler(event: any) {
  // Expect payload: { xml: string, obraId: string }
  const { xml, obraId } = JSON.parse(event.body);

  // 1️⃣ Call Focus API via gateway to emit the NF‑e
  const focusResp = await gateway({
    body: JSON.stringify({
      api: "focus",
      action: "nfe/emit",
      payload: { xml },
    }),
  });

  if (!focusResp.success) {
    return { statusCode: 400, body: JSON.stringify({ error: focusResp.error }) };
  }

  const nota = focusResp.data; // Assume API returns { xmlUrl, pdfUrl, ... }

  // 2️⃣ Insert the nota record into Supabase
  const { data, error } = await supabase
    .from("notas")
    .insert({
      obra_id: obraId,
      xml_url: nota.xmlUrl,
      pdf_url: nota.pdfUrl,
      status: "processed",
    });

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, nota: data[0] }),
  };
}
