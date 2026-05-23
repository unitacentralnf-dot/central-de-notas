import './style.css';
import { initializeData, getObras, loginUser, submitAccessRequest } from './services/dataService.js';
import { renderDashboard } from './components/Dashboard.js';
import { renderNFe } from './components/NFe.js';
import { renderFixedBills } from './components/FixedBills.js';
import { renderProtests } from './components/Protests.js';
import { renderDDA } from './components/DDA.js';
import { renderMaster } from './components/Master.js';

// Estado da Aplicação na Sessão
let currentView = 'dashboard'; 
let currentRole = 'adm'; 
let currentObraId = ''; 
let currentUser = null;

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
  'protests': document.getElementById('nav-protests'),
  'master': document.getElementById('nav-master'),
};

// Mapeamento de Títulos de View
const viewTitles = {
  'dashboard': 'Dashboard Operacional & Obras',
  'dda': 'Triagem DDA (Câmara Interbancária)',
  'nfe': 'Notas Fiscais Eletrônicas (NFe / Sefaz)',
  'fixed-bills': 'Gestão de Contas Fixas Recorrentes',
  'protests': 'Regularidade Fiscal (Protestos CNPJ)',
  'master': 'Painel Master — Administração do Sistema',
};

// Inicialização Geral
async function init() {
  setupLoginEvents();
  setupAccessRequestForm();

  const cachedUser = sessionStorage.getItem('current_user');
  if (cachedUser) {
    currentUser = JSON.parse(cachedUser);
    currentRole = currentUser.role;
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('app').style.display = 'flex';
    await startApp();
  } else {
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('app').style.display = 'none';
  }
}

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
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('app').style.display = 'flex';
        await startApp();
      } else {
        if (errorMsg) errorMsg.style.display = 'block';
      }
    });
  }

  document.querySelectorAll('.demo-user-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const email = e.currentTarget.getAttribute('data-email');
      const pass = e.currentTarget.getAttribute('data-pass');
      const emailInput = document.getElementById('login-email');
      const passInput = document.getElementById('login-password');
      if (emailInput) emailInput.value = email;
      if (passInput) passInput.value = pass;
      if (loginForm) loginForm.requestSubmit();
    });
  });
}

// Lógica do formulário de Solicitação de Acesso
function setupAccessRequestForm() {
  const btnShowRequest = document.getElementById('btn-show-request-access');
  const requestPanel = document.getElementById('request-access-form');
  const accessRequestForm = document.getElementById('access-request-form');

  if (btnShowRequest && requestPanel) {
    btnShowRequest.addEventListener('click', () => {
      const isVisible = requestPanel.style.display !== 'none';
      requestPanel.style.display = isVisible ? 'none' : 'block';
      btnShowRequest.textContent = isVisible
        ? 'Ainda não tem acesso? Solicitar ao administrador'
        : '← Voltar ao Login';
    });
  }

  if (accessRequestForm) {
    accessRequestForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = document.getElementById('req-nome').value;
      const email = document.getElementById('req-email').value;
      const obra = document.getElementById('req-obra').value;
      const mensagem = document.getElementById('req-mensagem').value;
      const successMsg = document.getElementById('request-success-msg');
      const errorMsg = document.getElementById('request-error-msg');

      if (successMsg) successMsg.style.display = 'none';
      if (errorMsg) errorMsg.style.display = 'none';

      const ok = await submitAccessRequest({ nome, email, obra, mensagem });
      if (ok) {
        if (successMsg) successMsg.style.display = 'block';
        accessRequestForm.reset();
      } else {
        if (errorMsg) errorMsg.style.display = 'block';
      }
    });
  }
}

function setupLogoutEvent() {
  const btnLogout = document.getElementById('btn-logout-sidebar');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      sessionStorage.removeItem('current_user');
      currentUser = null;
      const emailInput = document.getElementById('login-email');
      const passInput = document.getElementById('login-password');
      if (emailInput) emailInput.value = '';
      if (passInput) passInput.value = '';
      const errorMsg = document.getElementById('login-error-msg');
      if (errorMsg) errorMsg.style.display = 'none';
      document.getElementById('app').style.display = 'none';
      document.getElementById('login-screen').classList.add('active');
    });
  }
}

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

export async function setGlobalObra(obraId) {
  currentObraId = obraId;
  localStorage.setItem('active_obra_id', currentObraId);
  if (globalObraSelect) globalObraSelect.value = obraId;
  await renderActiveView();
}

// Expõe função de navegação para outros componentes (ex: Dashboard cards)
export function navigateToView(view) {
  navigateTo(view);
}

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

function updateRoleUI() {
  if (!roleBadge || !roleBadgeContainer) return;

  roleBadge.className = 'profile-badge';

  if (currentRole === 'master') {
    roleBadge.textContent = 'Master Admin';
    roleBadge.classList.add('master');
    // Revelar menu e categoria admin no sidebar
    const navMaster = document.getElementById('nav-master');
    const navMasterCat = document.getElementById('nav-master-category');
    if (navMaster) navMaster.style.display = 'flex';
    if (navMasterCat) navMasterCat.style.display = 'block';
  } else if (currentRole === 'adm') {
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

  if (currentUser) {
    const sidebarAvatar = document.getElementById('sidebar-user-avatar');
    const sidebarName = document.getElementById('sidebar-user-name');
    const sidebarRole = document.getElementById('sidebar-user-role');
    const welcomeMsg = document.getElementById('welcome-message');

    const roleNames = {
      master: 'Administrador Geral do Sistema',
      adm: 'Administrador de Obra',
      engenheiro: 'Engenheiro Residente',
      financeiro: 'Controladora Financeira',
      ggo: 'Diretor de Operações',
    };

    if (sidebarAvatar) sidebarAvatar.textContent = currentUser.initials;
    if (sidebarName) sidebarName.textContent = currentUser.name;
    if (sidebarRole) sidebarRole.textContent = roleNames[currentRole] || 'Consultor';
    if (welcomeMsg) welcomeMsg.textContent = currentUser.welcome;
  }
}

// Transição suave sem piscada: fade-out → fetch → fade-in
async function navigateTo(view) {
  // Proteção: só master acessa a tela master
  if (view === 'master' && currentRole !== 'master') {
    view = 'dashboard';
  }

  currentView = view;

  Object.keys(navItems).forEach(v => {
    const item = navItems[v];
    if (item) item.classList.toggle('active', v === view);
  });

  if (viewTitle) viewTitle.textContent = viewTitles[view] || 'Central de Notas';

  await renderActiveView();
}

async function renderActiveView() {
  if (!contentContainer) return;

  // 1. Fade out
  contentContainer.style.opacity = '0';
  contentContainer.style.transform = 'translateY(6px)';
  contentContainer.style.transition = 'opacity 0.15s ease, transform 0.15s ease';

  await new Promise(r => setTimeout(r, 150));

  // 2. Renderiza o conteúdo
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
  } else if (currentView === 'master') {
    await renderMaster(contentContainer, currentUser);
  }

  // 3. Fade in
  contentContainer.style.opacity = '1';
  contentContainer.style.transform = 'translateY(0)';
}

document.addEventListener('DOMContentLoaded', init);

if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}
