import { handler as gateway } from "../apiGateway.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function handler(event: any) {
  // Expect payload: { fileBase64: string, obraId: string }
  const { fileBase64, obraId } = JSON.parse(event.body);

  // 1️⃣ Send to Celcoin OCR via gateway
  const celcoinResp = await gateway({
    body: JSON.stringify({
      api: "celcoin",
      action: "boleto/ocr",
      payload: { file: fileBase64 },
    }),
  });

  if (!celcoinResp.success) {
    return { statusCode: 400, body: JSON.stringify({ error: celcoinResp.error }) };
  }

  const { text, amount, dueDate } = celcoinResp.data;

  // 2️⃣ Insert boleto record into Supabase
  const { data, error } = await supabase
    .from("boletos")
    .insert({
      obra_id: obraId,
      file_url: `data:application/pdf;base64,${fileBase64}`,
      ocr_text: text,
      status: "processed",
    });

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, boleto: data[0], amount, dueDate }),
  };
}
