import config from '../config.js';
import * as mockImpl from './mockProvider.js';

const provider = {};

// Carrega todas as implementacoes mock como padrao
for (const key of Object.keys(mockImpl)) {
  provider[key] = mockImpl[key];
}

// Provedor REAL: sobrescreve funcoes mock com implementacoes reais
if (config.provider === 'real') {
  const realImpl = await import('./realProvider.js');
  for (const [key, fn] of Object.entries(realImpl)) {
    if (typeof fn === 'function') {
      provider[key] = fn;
      // Sobrescreve a versao mock correspondente (mockXxx -> realXxx)
      const mockKey = key.replace(/^real/, 'mock');
      if (mockKey !== key && mockKey in provider) {
        provider[mockKey] = fn;
      }
    }
  }
  console.log('🔌 Provedor REAL ativo');
} else {
  console.log('🧪 Provedor MOCK ativo');
}

const mode = config.provider === 'real' ? '🔌 REAL' : '🧪 MOCK';
console.log(`${mode} — Para ativar APIs reais, configure VITE_DATA_PROVIDER=real no .env`);

export default provider;
