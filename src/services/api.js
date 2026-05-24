// src/services/api.js
// Serviço de API que encapsula chamadas às Edge Functions da Supabase.
// Utiliza o helper invokeEdge definido em edgeFunctions.js para invocar funções
// de upload de NFe, DDA, OCR e consulta de protestos.

import { invokeEdge } from './edgeFunctions.js';
import { getIntegrationModes } from './integrationModes.js';

/**
 * Envia uma Nota Fiscal Eletrônica (NFe) para a Edge Function `nfeUpload`.
 * @param {Object} payload - Objeto contendo os campos esperados pela função.
 * @returns {Promise<Object>} Resultado da chamada.
 */
export async function uploadNFe(payload) {
  return await invokeEdge('nfeUpload', payload);
}

/**
 * Envia um arquivo DDA para a Edge Function `ddaUpload`.
 * @param {Object} payload - Objeto contendo os campos esperados pela função.
 * @returns {Promise<Object>} Resultado da chamada.
 */
export async function uploadDDA(payload) {
  return await invokeEdge('ddaUpload', payload);
}

/**
 * Envia um arquivo para OCR via Edge Function `ocrUploader` ou simula via Fixture.
 * @param {Object} payload - Deve conter `fileBase64` (string) e opcional `obraId`.
 * @returns {Promise<Object>} Resultado da chamada.
 */
export async function uploadOCR(payload) {
  const modes = getIntegrationModes();
  
  if (modes.ocr === 'disabled') {
    return { 
      success: false, 
      error: 'A integração de OCR está desativada. Por favor, ative-a em Integrações.' 
    };
  }

  if (modes.ocr === 'fixtures') {
    // Simular processamento do OCR em ambiente de desenvolvimento (2 segundos de delay)
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Retorna texto simulado estruturado de um boleto brasileiro
    const mockText = `
----------------------------------------------------------------------
 BANCO ITAÚ S.A. |  341-7  |  34191.79001 01043.513184 91020.150008 7 97590000125000
----------------------------------------------------------------------
 LOCAL DE PAGAMENTO: ATÉ O VENCIMENTO EM QUALQUER BANCO OU CORRESPONDENTE BANCÁRIO
 BENEFICIÁRIO: DISTRIBUIDORA DE MATERIAIS DE CONSTRUÇÃO CONTINENTAL LTDA
 CNPJ BENEFICIÁRIO: 45.678.901/0001-22
 PAGADOR: CONSTRUTORA E INCORPORADORA ALFA S.A.
 CNPJ PAGADOR: 98.765.432/0001-10
 ENDEREÇO PAGADOR: AV. DAS NAÇÕES, 1500 - SÃO PAULO - SP
 DATA DO DOCUMENTO: 24/05/2026
 VENCIMENTO: 15/06/2026
 VALOR DO DOCUMENTO: R$ 12.500,00
----------------------------------------------------------------------
 AGÊNCIA/CÓDIGO BENEFICIÁRIO: 0910 / 51318-7
 NÚMERO DO DOCUMENTO: NF-889021
 NOSSO NÚMERO: 19/10201500-0
----------------------------------------------------------------------
 [MOCK OCR: LEITURA EXECUTADA COM SUCESSO VIA FIXTURES]
    `.trim();

    return {
      success: true,
      data: {
        text: mockText
      }
    };
  }

  // Modo 'edge': chama a Edge Function na nuvem
  return await invokeEdge('ocrUploader', payload);
}

/**
 * Consulta protestos de um CNPJ via Edge Function `protestosCenprot`.
 * @param {string} cnpj - CNPJ a ser consultado.
 * @param {number} obraId - (Opcional) ID da obra para relacionar os registros.
 * @returns {Promise<Object>} Resultado da chamada.
 */
export async function getProtestos(cnpj, obraId = null) {
  const body = { cnpj };
  if (obraId !== null) body.obraId = obraId;
  return await invokeEdge('protestosCenprot', body);
}

// Outras funções de API podem ser adicionadas aqui seguindo o mesmo padrão.
