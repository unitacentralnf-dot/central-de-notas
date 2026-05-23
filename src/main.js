import './style.css';
import { initializeData, getObras, loginUser, submitAccessRequest, createUsuario } from './services/dataService.js';
import { supabase } from './services/supabaseClient.js';
import config from './services/config.js';
import { renderDashboard } from './components/Dashboard.js';
import { renderNFe } from './components/NFe.js';
import { renderFixedBills } from './components/FixedBills.js';
import { renderProtests } from './components/Protests.js';
import { renderDDA } from './components/DDA.js';
import { renderMaster } from './components/Master.js';
import { renderIntegrations } from './components/Integrations.js';

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
  'integrations': document.getElementById('nav-integrations'),
  'master': document.getElementById('nav-master'),
};

// Mapeamento de Títulos de View
const viewTitles = {
  'dashboard': 'Dashboard Operacional & Obras',
  'dda': 'Triagem DDA (Câmara Interbancária)',
  'nfe': 'Notas Fiscais Eletrônicas (NFe / Sefaz)',
  'fixed-bills': 'Gestão de Contas Fixas Recorrentes',
  'protests': 'Regularidade Fiscal (Protestos CNPJ)',
  'integrations': 'Integrações & Modos de Operação',
  'master': 'Painel Master — Administração do Sistema',
};

// Inicialização Geral
async function init() {
  setupLoginEvents();
  setupAccessRequestForm();
  setupFirstAccess();
  updateProviderBadge();

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

// Lógica do formulário de Primeiro Acesso (criação de admin master)
function setupFirstAccess() {
  const btnShow = document.getElementById('btn-show-first-access');
  const panel = document.getElementById('first-access-form');
  const form = document.getElementById('first-access-form-inner');
  const faArea = document.getElementById('first-access-area');

  if (!faArea) return;

  // Sempre mostra a área de primeiro acesso (sem depender de query)
  faArea.style.display = 'block';

  if (btnShow && panel) {
    btnShow.addEventListener('click', () => {
      panel.style.display = panel.style.display !== 'none' ? 'none' : 'block';
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = document.getElementById('fa-nome').value.trim();
      const email = document.getElementById('fa-email').value.trim();
      const senha = document.getElementById('fa-senha').value;
      const errorMsg = document.getElementById('fa-error-msg');

      if (errorMsg) errorMsg.style.display = 'none';

      try {
        const result = await createUsuario({ nome, email, senha, role: 'master', obraId: null });
        if (!result) throw new Error('Falha ao criar usuário no banco de dados.');

        // Tenta login via Supabase Auth
        let user = await loginUser(email, senha);

        // Se Auth falhou, busca direto do banco (fallback senha texto puro)
        if (!user) {
          const { data } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();
          if (data) {
            user = {
              id: data.id,
              name: data.nome,
              email: data.email,
              role: data.role,
              initials: data.avatar_iniciais,
              obraId: data.obra_id,
              welcome: `Olá, ${data.nome.split(' ')[0]}! Bem-vindo ao sistema.`
            };
          }
        }

        if (user) {
          currentUser = user;
          currentRole = user.role;
          sessionStorage.setItem('current_user', JSON.stringify(user));
          document.getElementById('login-screen').classList.remove('active');
          document.getElementById('app').style.display = 'flex';
          await startApp();
        } else {
          if (errorMsg) {
            errorMsg.textContent = 'Usuário criado, mas falha ao autenticar. Tente fazer login manualmente.';
            errorMsg.style.display = 'block';
          }
        }
      } catch (err) {
        if (errorMsg) {
          errorMsg.textContent = `Erro: ${err.message}`;
          errorMsg.style.display = 'block';
        }
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

function updateProviderBadge() {
  const badge = document.getElementById('provider-badge');
  const badgeText = document.getElementById('provider-badge-text');
  if (!badge || !badgeText) return;

  const isReal = config.provider === 'real';
  const dbMode = 'anon key';

  badgeText.textContent = isReal ? `☁️ REAL · ${dbMode}` : `🧪 MOCK · ${dbMode}`;
  badge.className = 'badge';
  badge.classList.add(isReal ? 'badge-success' : 'badge-warning');
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

  // Fade out: esconde o conteudo atual suavemente
  contentContainer.classList.add('view-exit');
  contentContainer.classList.remove('view-enter');
  await new Promise(r => setTimeout(r, 120));

  // Renderiza a view — cada componente ja mostra shimmer antes de carregar dados
  // Toda manipulacao de DOM ocorre enquanto opacity: 0, sem piscadas
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
  } else if (currentView === 'integrations') {
    await renderIntegrations(contentContainer);
  } else if (currentView === 'master') {
    await renderMaster(contentContainer, currentUser);
  }

  // Fade in: revela o conteudo ja renderizado
  contentContainer.classList.remove('view-exit');
  contentContainer.classList.add('view-enter');
}

document.addEventListener('DOMContentLoaded', init);

if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}
