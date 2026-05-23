import config from '../config.js';
import * as mockImpl from './mockProvider.js';
import * as realImpl from './realProvider.js';

const provider = {};

// Carrega todas as implementacoes mock como padrao
for (const key of Object.keys(mockImpl)) {
  provider[key] = mockImpl[key];
}

// Provedor REAL: sobrescreve funcoes mock com implementacoes reais
if (config.provider === 'real') {
  for (const [key, fn] of Object.entries(realImpl)) {
    if (typeof fn === 'function') {
      provider[key] = fn;
      const mockKey = key.replace(/^real/, 'mock');
      if (mockKey !== key && mockKey in provider) {
        provider[mockKey] = fn;
      }
    }
  }
}

const mode = config.provider === 'real' ? '🔌 REAL' : '🧪 MOCK';
console.log(`${mode} — Para ativar APIs reais, configure VITE_DATA_PROVIDER=real no .env`);

export default provider;
