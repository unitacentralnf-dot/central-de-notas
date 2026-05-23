import './style.css';
import { initializeData, getObras } from './services/dataService.js';
import { renderDashboard } from './components/Dashboard.js';
import { renderNFe } from './components/NFe.js';
import { renderFixedBills } from './components/FixedBills.js';
import { renderProtests } from './components/Protests.js';

// Estado da Aplicação na Sessão
let currentView = 'dashboard'; // 'dashboard', 'nfe', 'fixed-bills', 'protests'
let currentRole = 'adm'; // 'adm', 'engenheiro', 'financeiro', 'ggo'
let currentObraId = ''; // Seleção global da obra ativa

// Dados dos Perfis de Simulação
const userProfiles = {
  'adm': {
    name: 'Carlos Silva',
    role: 'Administrador de Obra',
    initials: 'CS',
    welcome: 'Olá, Carlos! Bem-vindo de volta.'
  },
  'engenheiro': {
    name: 'Eng. Roberto Dias',
    role: 'Engenheiro Residente',
    initials: 'RD',
    welcome: 'Olá, Roberto! Tenha um bom dia de trabalho.'
  },
  'financeiro': {
    name: 'Mariana Lins',
    role: 'Controladora Financeira',
    initials: 'ML',
    welcome: 'Olá, Mariana! Tudo pronto para as análises.'
  },
  'ggo': {
    name: 'Arthur Albuquerque',
    role: 'Diretor de Operações',
    initials: 'AA',
    welcome: 'Seja bem-vindo, Diretor Arthur.'
  }
};

// Inicializar dados de teste
initializeData();

// Elementos do DOM
const contentContainer = document.getElementById('content-container');
const viewTitle = document.getElementById('view-title');
const profileSelect = document.getElementById('profileSelect');
const roleBadge = document.getElementById('role-badge');
const roleBadgeContainer = document.getElementById('role-badge-container');
const globalObraSelect = document.getElementById('globalObraSelect');

// Navegação
const navItems = {
  'dashboard': document.getElementById('nav-dashboard'),
  'nfe': document.getElementById('nav-nfe'),
  'fixed-bills': document.getElementById('nav-fixed-bills'),
  'protests': document.getElementById('nav-protests')
};

// Mapeamento de Títulos de View
const viewTitles = {
  'dashboard': 'Dashboard Operacional & Obras',
  'nfe': 'Notas Fiscais Eletrônicas (NFe / Sefaz)',
  'fixed-bills': 'Gestão de Contas Fixas Recorrentes',
  'protests': 'Regularidade Fiscal (Protestos CNPJ)'
};

// Inicialização Geral
function init() {
  // Carregar última obra ativa do cache
  const obras = getObras();
  if (obras.length > 0) {
    const savedObraId = localStorage.getItem('active_obra_id');
    currentObraId = (savedObraId && obras.some(o => o.id === savedObraId)) ? savedObraId : obras[0].id;
  }

  // Carregar último perfil do cache se houver
  const savedRole = localStorage.getItem('active_role');
  if (savedRole) {
    currentRole = savedRole;
    if (profileSelect) profileSelect.value = savedRole;
  }

  updateRoleUI();
  setupNavigation();
  setupRoleSelector();
  setupObraSelector();
  
  // Renderizar view inicial
  navigateTo(currentView);
}

// Configurar o seletor de obra global
function setupObraSelector() {
  if (!globalObraSelect) return;
  const obras = getObras();
  
  globalObraSelect.innerHTML = obras.map(o => 
    `<option value="${o.id}" ${o.id === currentObraId ? 'selected' : ''}>${o.name} (${o.cnpj})</option>`
  ).join('');
  
  globalObraSelect.addEventListener('change', (e) => {
    currentObraId = e.target.value;
    localStorage.setItem('active_obra_id', currentObraId);
    renderActiveView();
  });
}

// Função para outros componentes alterarem a obra globalmente
export function setGlobalObra(obraId) {
  currentObraId = obraId;
  localStorage.setItem('active_obra_id', currentObraId);
  if (globalObraSelect) {
    globalObraSelect.value = obraId;
  }
  renderActiveView();
}

// Configurar Eventos do Menu de Navegação
function setupNavigation() {
  Object.keys(navItems).forEach(view => {
    const item = navItems[view];
    if (item) {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(view);
      });
    }
  });
}

// Configurar Eventos do Seletor de Perfis
function setupRoleSelector() {
  if (profileSelect) {
    profileSelect.addEventListener('change', (e) => {
      currentRole = e.target.value;
      localStorage.setItem('active_role', currentRole);
      
      updateRoleUI();
      
      // Re-renderiza a tela ativa com as novas permissões do perfil
      renderActiveView();
    });
  }
}

// Atualiza o visual do Badge do Cargo/Perfil
function updateRoleUI() {
  if (!roleBadge || !roleBadgeContainer) return;

  // Limpa classes
  roleBadge.className = 'profile-badge';

  if (currentRole === 'adm') {
    roleBadge.textContent = 'ADM Obra';
    roleBadge.classList.add('adm');
  } else if (currentRole === 'engenheiro') {
    roleBadge.textContent = 'Engenheiro (Consultor)';
    roleBadge.classList.add('consultor');
  } else if (currentRole === 'financeiro') {
    roleBadge.textContent = 'Financeiro (Consultor)';
    roleBadge.classList.add('consultor');
  } else if (currentRole === 'ggo') {
    roleBadge.textContent = 'GGO / Diretor';
    roleBadge.classList.add('consultor');
  }

  // Atualiza painel do usuário e saudação dinâmica
  const profile = userProfiles[currentRole];
  if (profile) {
    const sidebarAvatar = document.getElementById('sidebar-user-avatar');
    const sidebarName = document.getElementById('sidebar-user-name');
    const sidebarRole = document.getElementById('sidebar-user-role');
    const welcomeMsg = document.getElementById('welcome-message');

    if (sidebarAvatar) sidebarAvatar.textContent = profile.initials;
    if (sidebarName) sidebarName.textContent = profile.name;
    if (sidebarRole) sidebarRole.textContent = profile.role;
    if (welcomeMsg) welcomeMsg.textContent = profile.welcome;
  }
}

// Realiza a transição de telas
function navigateTo(view) {
  currentView = view;
  
  // Atualiza classes do menu
  Object.keys(navItems).forEach(v => {
    const item = navItems[v];
    if (item) {
      if (v === view) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    }
  });

  // Atualiza o Título do Cabeçalho
  if (viewTitle) {
    viewTitle.textContent = viewTitles[view] || 'Central de Notas';
  }

  // Renderiza a view correspondente
  renderActiveView();
}

// Renderiza a tela ativa no container principal
function renderActiveView() {
  if (!contentContainer) return;

  contentContainer.innerHTML = ''; // Limpa conteúdo

  if (currentView === 'dashboard') {
    renderDashboard(contentContainer, currentRole, currentObraId);
  } else if (currentView === 'nfe') {
    renderNFe(contentContainer, currentRole, currentObraId);
  } else if (currentView === 'fixed-bills') {
    renderFixedBills(contentContainer, currentRole, currentObraId);
  } else if (currentView === 'protests') {
    renderProtests(contentContainer, currentRole, currentObraId);
  }
}

// Executar após o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', init);

// Caso o DOM já tenha carregado (Vite HMR)
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}
