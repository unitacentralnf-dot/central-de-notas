import { handler as apiGateway } from "../apiGateway.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Edge Function that receives a CNPJ and forwards the request to the Cenprot API.
 * Expected payload:
 * {
 *   "cnpj": "12345678000199"
 * }
 */
export async function handler(event: any) {
  try {
    const body = JSON.parse(event.body);
    const { cnpj } = body;
    if (!cnpj) {
      return { success: false, error: 'CNPJ is required' };
    }
    // Use the generic gateway to call Cenprot
    const response = await apiGateway({
      body: JSON.stringify({
        api: 'cenprot',
        action: 'protestos', // assuming endpoint /protestos
        payload: { cnpj },
      })
    });

    // 2️⃣ Insert each protest record into Supabase
    if (response.success && Array.isArray(response.data)) {
      const inserts = response.data.map((p: any) => ({
        obra_id: body.obraId || null,
        cnpj,
        valor: p.valor,
        data_registro: p.data,
      }));
      const { error } = await supabase.from('protestos').insert(inserts);
      if (error) {
        console.error('Failed to insert protestos', error);
        return { success: false, error: error.message };
      }
    }
    return response;
  } catch (err: any) {
    console.error('protestosCenprot error', err);
    return { success: false, error: err.message };
  }
}

export default handler;
