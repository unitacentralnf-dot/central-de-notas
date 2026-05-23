import config from '../config.js';
import * as mockImpl from './mockProvider.js';

const provider = {};

// Carrega todas as implementacoes mock como padrao
for (const key of Object.keys(mockImpl)) {
  provider[key] = mockImpl[key];
}

// Quando o realProvider estiver completo, as implementacoes reais
// sobrescrevem as mock correspondentes:
//
// if (config.provider === 'real') {
//   const realImpl = await import('./realProvider.js');
//   for (const key of Object.keys(realImpl)) {
//     if (typeof realImpl[key] === 'function') {
//       provider[key] = realImpl[key];
//     }
//   }
//   console.log('🔌 Provedor REAL ativo');
// } else {
//   console.log('🧪 Provedor MOCK ativo');
// }

const mode = config.provider === 'real' ? '🔌 REAL' : '🧪 MOCK';
console.log(`${mode} — Para ativar APIs reais, configure VITE_DATA_PROVIDER=real no .env`);

export default provider;
