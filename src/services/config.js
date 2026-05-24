const config = {
  // Troque para 'real' quando as APIs reais estiverem prontas
// Definir o provedor de dados (mock ou real) via .env
  provider: import.meta.env.VITE_DATA_PROVIDER || 'mock',

  // Credenciais das APIs reais (via .env)
  apis: {
    focusNFe: {
      token: import.meta.env.VITE_FOCUSNFE_TOKEN || '',
      baseUrl: import.meta.env.VITE_FOCUSNFE_URL || 'https://homologacao.focusnfe.com.br/v2',
    },
    cnpjWs: {
      baseUrl: 'https://publica.cnpj.ws/cnpj',
    },
    plugOcr: {
      token: import.meta.env.VITE_PLUGOCR_TOKEN || '',
    },
    asaas: {
      token: import.meta.env.VITE_ASAAS_TOKEN || '',
      baseUrl: import.meta.env.VITE_ASAAS_URL || 'https://sandbox.asaas.com/api/v3',
    },
  },
};

export function isUsingRealProvider() {
  return config.provider === 'real';
}

export default config;
