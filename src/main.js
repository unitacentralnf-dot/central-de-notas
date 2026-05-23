import './style.css';
import { initializeData, getObras, loginUser } from './services/dataService.js';
import { renderDashboard } from './components/Dashboard.js';
import { renderNFe } from './components/NFe.js';
import { renderFixedBills } from './components/FixedBills.js';
import { renderProtests } from './components/Protests.js';
import { renderDDA } from './components/DDA.js';

// Estado da Aplicação na Sessão
let currentView = 'dashboard'; 
let currentRole = 'adm'; 
let currentObraId = ''; 
let currentUser = null; // Usuário logado de verdade

// Inicializar dados de teste
initializeData();

// Elementos do DOM
const contentContainer = document.getElementById('content-container');
const viewTitle = document.getElementById('view-title');
const roleBadge = document.getElementById('role-badge');
const roleBadgeContainer = document.getElementById('role-badge-container');
const globalObraSelect = document.getElementById('globalObraSelect');

// Navegação
const navItems = {
  'dashboard': document.getElementById('nav-dashboard'),
  'dda': document.getElementById('nav-dda'),
  'nfe': document.getElementById('nav-nfe'),
  'fixed-bills': document.getElementById('nav-fixed-bills'),
  'protests': document.getElementById('nav-protests')
};

// Mapeamento de Títulos de View
const viewTitles = {
  'dashboard': 'Dashboard Operacional & Obras',
  'dda': 'Triagem DDA (Câmara Interbancária)',
  'nfe': 'Notas Fiscais Eletrônicas (NFe / Sefaz)',
  'fixed-bills': 'Gestão de Contas Fixas Recorrentes',
  'protests': 'Regularidade Fiscal (Protestos CNPJ)'
};

// Inicialização Geral
async function init() {
  setupLoginEvents();

  // Verificar se há sessão ativa
  const cachedUser = sessionStorage.getItem('current_user');
  if (cachedUser) {
    currentUser = JSON.parse(cachedUser);
    currentRole = currentUser.role;
    
    // Esconde tela de login e revela app
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('app').style.display = 'flex';
    
    await startApp();
  } else {
    // Revela tela de login e esconde app
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('app').style.display = 'none';
  }
}

// Inicializa a aplicação de verdade após autenticado
async function startApp() {
  const obras = await getObras();
  if (obras && obras.length > 0) {
    const savedObraId = localStorage.getItem('active_obra_id');
    currentObraId = (savedObraId && obras.some(o => o.id === savedObraId)) ? savedObraId : obras[0].id;
  }

  updateRoleUI();
  setupNavigation();
  await setupObraSelector();
  setupLogoutEvent();
  
  await navigateTo(currentView);
}

// Configura os eventos da tela de login e cartões de demonstração
function setupLoginEvents() {
  const loginForm = document.getElementById('login-form');
  const errorMsg = document.getElementById('login-error-msg');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;
      if (errorMsg) errorMsg.style.display = 'none';

      const user = await loginUser(email, pass);
      if (user) {
        currentUser = user;
        currentRole = user.role;
        sessionStorage.setItem('current_user', JSON.stringify(user));
        
        // Esconde login e revela app
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('app').style.display = 'flex';
        
        await startApp();
      } else {
        if (errorMsg) errorMsg.style.display = 'block';
      }
    });
  }

  // Evento dos cards de demonstração (um clique)
  document.querySelectorAll('.demo-user-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const email = e.currentTarget.getAttribute('data-email');
      const pass = e.currentTarget.getAttribute('data-pass');
      
      const emailInput = document.getElementById('login-email');
      const passInput = document.getElementById('login-password');
      
      if (emailInput) emailInput.value = email;
      if (passInput) passInput.value = pass;
      
      // Submit automático
      if (loginForm) {
        loginForm.requestSubmit();
      }
    });
  });
}

// Configura o evento de logout
function setupLogoutEvent() {
  const btnLogout = document.getElementById('btn-logout-sidebar');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      sessionStorage.removeItem('current_user');
      currentUser = null;
      
      // Limpa os inputs de login
      const emailInput = document.getElementById('login-email');
      const passInput = document.getElementById('login-password');
      if (emailInput) emailInput.value = '';
      if (passInput) passInput.value = '';
      
      const errorMsg = document.getElementById('login-error-msg');
      if (errorMsg) errorMsg.style.display = 'none';

      // Esconde app e revela login
      document.getElementById('app').style.display = 'none';
      document.getElementById('login-screen').classList.add('active');
    });
  }
}

// Configurar o seletor de obra global
async function setupObraSelector() {
  if (!globalObraSelect) return;
  const obras = await getObras();
  
  globalObraSelect.innerHTML = obras.map(o => 
    `<option value="${o.id}" ${o.id === currentObraId ? 'selected' : ''}>${o.name} (${o.cnpj})</option>`
  ).join('');
  
  globalObraSelect.addEventListener('change', async (e) => {
    currentObraId = e.target.value;
    localStorage.setItem('active_obra_id', currentObraId);
    await renderActiveView();
  });
}

// Função para outros componentes alterarem a obra globalmente
export async function setGlobalObra(obraId) {
  currentObraId = obraId;
  localStorage.setItem('active_obra_id', currentObraId);
  if (globalObraSelect) {
    globalObraSelect.value = obraId;
  }
  await renderActiveView();
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
  if (currentUser) {
    const sidebarAvatar = document.getElementById('sidebar-user-avatar');
    const sidebarName = document.getElementById('sidebar-user-name');
    const sidebarRole = document.getElementById('sidebar-user-role');
    const welcomeMsg = document.getElementById('welcome-message');

    let displayRoleName = 'Consultor';
    if (currentRole === 'adm') displayRoleName = 'Administrador de Obra';
    if (currentRole === 'engenheiro') displayRoleName = 'Engenheiro Residente';
    if (currentRole === 'financeiro') displayRoleName = 'Controladora Financeira';
    if (currentRole === 'ggo') displayRoleName = 'Diretor de Operações';

    if (sidebarAvatar) sidebarAvatar.textContent = currentUser.initials;
    if (sidebarName) sidebarName.textContent = currentUser.name;
    if (sidebarRole) sidebarRole.textContent = displayRoleName;
    if (welcomeMsg) welcomeMsg.textContent = currentUser.welcome;
  }
}

// Realiza a transição de telas
async function navigateTo(view) {
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
  await renderActiveView();
}

// Renderiza a tela ativa no container principal
async function renderActiveView() {
  if (!contentContainer) return;

  contentContainer.innerHTML = '<div style="padding: 40px; text-align: center; color: hsl(var(--color-primary)); font-weight: 500;">Conectando ao Supabase...</div>'; // Loader

  if (currentView === 'dashboard') {
    await renderDashboard(contentContainer, currentRole, currentObraId);
  } else if (currentView === 'dda') {
    await renderDDA(contentContainer, currentRole, currentObraId);
  } else if (currentView === 'nfe') {
    await renderNFe(contentContainer, currentRole, currentObraId);
  } else if (currentView === 'fixed-bills') {
    await renderFixedBills(contentContainer, currentRole, currentObraId);
  } else if (currentView === 'protests') {
    await renderProtests(contentContainer, currentRole, currentObraId);
  }
}

// Executar após o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', init);

// Caso o DOM já tenha carregado (Vite HMR)
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}
