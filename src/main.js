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
  
  // Lógica de isolamento multi-tenant:
  const isRestrictedUser = currentUser && currentUser.obraId && currentRole !== 'master' && currentRole !== 'ggo';
  
  if (isRestrictedUser) {
    // Trava estritamente na obra vinculada do usuário operacional
    currentObraId = currentUser.obraId;
  } else if (obras && obras.length > 0) {
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
      
      // Ocultar menus administrativos do master imediatamente no logout
      const navMaster = document.getElementById('nav-master');
      const navMasterCat = document.getElementById('nav-master-category');
      if (navMaster) navMaster.style.display = 'none';
      if (navMasterCat) navMasterCat.style.display = 'none';

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
  
  const isRestrictedUser = currentUser && currentUser.obraId && currentRole !== 'master' && currentRole !== 'ggo';
  
  let filteredObras = obras;
  if (isRestrictedUser) {
    filteredObras = obras.filter(o => o.id === currentUser.obraId);
    globalObraSelect.disabled = true;
    globalObraSelect.style.opacity = '0.7';
    globalObraSelect.style.cursor = 'not-allowed';
  } else {
    globalObraSelect.disabled = false;
    globalObraSelect.style.opacity = '1';
    globalObraSelect.style.cursor = 'pointer';
  }
  
  globalObraSelect.innerHTML = filteredObras.map(o =>
    `<option value="${o.id}" ${o.id === currentObraId ? 'selected' : ''}>${o.name} (${o.cnpj})</option>`
  ).join('');
  
  const handleSelectChange = async (e) => {
    if (isRestrictedUser) {
      e.preventDefault();
      return;
    }
    currentObraId = e.target.value;
    localStorage.setItem('active_obra_id', currentObraId);
    await renderActiveView();
  };
  
  globalObraSelect.removeEventListener('change', globalObraSelect._changeHandler);
  globalObraSelect._changeHandler = handleSelectChange;
  globalObraSelect.addEventListener('change', handleSelectChange);
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

  // Reset preventivo de visibilidade de menu
  const navMaster = document.getElementById('nav-master');
  const navMasterCat = document.getElementById('nav-master-category');
  if (navMaster) navMaster.style.display = 'none';
  if (navMasterCat) navMasterCat.style.display = 'none';

  if (currentRole === 'master') {
    roleBadge.textContent = 'Master Admin';
    roleBadge.classList.add('master');
    // Revelar menu e categoria admin no sidebar
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

  // 1. Fade out: adiciona classe view-exit e remove view-enter
  contentContainer.classList.add('view-exit');
  contentContainer.classList.remove('view-enter');

  // Aguarda a transição de fade-out (120ms)
  await new Promise(r => setTimeout(r, 120));

  // 2. Injeta o Skeleton Shimmer correspondente à view
  let shimmerHtml = `
    <div class="shimmer-container">
      <div class="shimmer-card header-shimmer"></div>
      <div class="shimmer-grid">
        <div class="shimmer-card"></div>
        <div class="shimmer-card"></div>
        <div class="shimmer-card"></div>
      </div>
    </div>
  `;
  
  if (currentView === 'nfe' || currentView === 'dda' || currentView === 'master') {
    shimmerHtml = `
      <div class="shimmer-container">
        <div class="shimmer-card header-shimmer" style="width: 250px;"></div>
        <div class="shimmer-card shimmer-table"></div>
      </div>
    `;
  }
  
  contentContainer.innerHTML = shimmerHtml;
  
  // Revela o shimmer com fade-in suave
  contentContainer.classList.remove('view-exit');
  contentContainer.classList.add('view-enter');

  // 3. Renderiza o conteúdo real
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

  // 4. Revela a view carregada
  contentContainer.classList.remove('view-exit');
  contentContainer.classList.add('view-enter');
}

document.addEventListener('DOMContentLoaded', init);

if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}
