import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Supabase client (admin) - not used in this generic gateway, but kept for possible DB ops
const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Generic API gateway used by all edge functions.
 * Receives a JSON payload with the following shape:
 * {
 *   "api": "focus" | "celcoin" | "cenprot" | "ocr",
 *   "action": string, // endpoint or operation name expected by the external API
 *   "payload": object // any data required by the external API
 * }
 * Returns a standard response: { success: boolean, data?: any, error?: string }
 */
export async function handler(event: any) {
  try {
    const body = JSON.parse(event.body);
    const { api, action, payload } = body;

    // Map API name to env variable and base URL
    const apiConfig: Record<string, { keyEnv: string; baseUrl: string }> = {
      focus: { keyEnv: 'VITE_FOCUS_API_KEY', baseUrl: 'https://api.focusnfe.com.br' },
      celcoin: { keyEnv: 'VITE_CELCOIN_API_KEY', baseUrl: 'https://api.celcoin.com.br' },
      cenprot: { keyEnv: 'VITE_CENPROT_API_KEY', baseUrl: 'https://api.cenprot.gov.br' },
      ocr: { keyEnv: 'VITE_GCP_VISION_KEY', baseUrl: 'https://vision.googleapis.com/v1' }
    };

    if (!apiConfig[api]) {
      return { success: false, error: `API ${api} not supported` };
    }

    const apiKey = process.env[apiConfig[api].keyEnv];
    if (!apiKey) {
      return { success: false, error: `Missing API key for ${api}` };
    }

    // Simple fetch wrapper – each concrete function can override this if needed
    let url = `${apiConfig[api].baseUrl}/${action}`;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    let bodyPayload = payload;

    if (api === 'ocr') {
      // 1. A API do Google Vision exige a API key como parâmetro de consulta na URL
      url = `${apiConfig[api].baseUrl}/${action}?key=${apiKey}`;
      
      // 2. Formata o payload no padrão esperado pela API do Google Cloud Vision
      bodyPayload = {
        requests: [
          {
            image: {
              content: payload.fileBase64,
            },
            features: [
              {
                type: "TEXT_DETECTION",
              },
            ],
          },
        ],
      };
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyPayload)
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data?.error || 'External API error' };
    }
    return { success: true, data };
  } catch (err: any) {
    console.error('Gateway error', err);
    return { success: false, error: err.message };
  }
}

export default handler;
