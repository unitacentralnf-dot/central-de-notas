import {
  getObras, saveObra, deleteObra,
  getUsuarios, createUsuario, updateUsuario, deleteUsuario,
  getAccessRequests, updateAccessRequest,
} from '../services/dataService.js';

let masterTab = 'requests';

const ROLE_LABELS = {
  master: 'Master Admin',
  adm: 'ADM de Obra',
  financeiro: 'Financeiro',
  engenheiro: 'Engenheiro',
  ggo: 'GGO / Diretor',
};

const ROLE_BADGE_CLASS = {
  master: 'badge-purple',
  adm: 'badge-primary',
  financeiro: 'badge-success',
  engenheiro: 'badge-info',
  ggo: 'badge-warning',
};

const STATUS_BADGE = {
  pendente: { cls: 'badge-warning', label: 'Pendente' },
  aprovado: { cls: 'badge-success', label: 'Aprovado' },
  rejeitado: { cls: 'badge-danger', label: 'Rejeitado' },
};

export async function renderMaster(container, currentUser) {
  container.innerHTML = `
    <div class="master-view animate-fade-in">
      <div class="master-tabs tabs-navigation" style="margin-bottom: 24px;">
        <button class="tab-btn ${masterTab === 'requests' ? 'active' : ''}" id="master-tab-requests">
          🔔 Solicitações de Acesso
        </button>
        <button class="tab-btn ${masterTab === 'users' ? 'active' : ''}" id="master-tab-users">
          👥 Usuários do Sistema
        </button>
        <button class="tab-btn ${masterTab === 'obras' ? 'active' : ''}" id="master-tab-obras">
          🏗️ Obras Cadastradas
        </button>
      </div>
      <div id="master-tab-content"></div>
    </div>
  `;

  document.getElementById('master-tab-requests').addEventListener('click', () => switchMasterTab('requests', container, currentUser));
  document.getElementById('master-tab-users').addEventListener('click', () => switchMasterTab('users', container, currentUser));
  document.getElementById('master-tab-obras').addEventListener('click', () => switchMasterTab('obras', container, currentUser));

  await renderMasterTabContent(container, currentUser);
}

async function switchMasterTab(tab, container, currentUser) {
  masterTab = tab;
  document.querySelectorAll('.master-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`master-tab-${tab}`).classList.add('active');
  await renderMasterTabContent(container, currentUser);
}

async function renderMasterTabContent(container, currentUser) {
  const tabContent = document.getElementById('master-tab-content');
  if (!tabContent) return;

  tabContent.innerHTML = `<div style="padding: 40px; text-align: center; color: hsl(var(--color-primary));">Carregando...</div>`;

  if (masterTab === 'requests') {
    await renderRequestsTab(tabContent);
  } else if (masterTab === 'users') {
    await renderUsersTab(tabContent);
  } else if (masterTab === 'obras') {
    await renderObrasTab(tabContent);
  }
}

// ─── ABA SOLICITAÇÕES ──────────────────────────────────────────
async function renderRequestsTab(tabContent) {
  const requests = await getAccessRequests();
  const obras = await getObras();
  const pendentes = requests.filter(r => r.status === 'pendente');
  const historico = requests.filter(r => r.status !== 'pendente');

  tabContent.innerHTML = `
    <div class="section-panel" style="margin-bottom: 24px;">
      <div class="panel-header">
        <h2 class="panel-title">Solicitações Pendentes (${pendentes.length})</h2>
      </div>
      ${pendentes.length === 0 ? `
        <div style="text-align: center; padding: 40px 20px; color: hsl(var(--text-dim));">
          <div style="font-size: 2rem; margin-bottom: 12px;">✅</div>
          <p>Nenhuma solicitação pendente no momento.</p>
        </div>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${pendentes.map(req => `
            <div class="request-card" data-id="${req.id}" style="background: hsl(var(--bg-input)); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px 20px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 200px;">
                  <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, hsl(var(--color-primary)), hsl(260,70%,55%)); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; color: white; flex-shrink: 0;">
                      ${req.nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style="font-weight: 700; color: hsl(var(--text-main)); font-size: 0.95rem;">${req.nome}</div>
                      <div style="font-size: 0.8rem; color: hsl(var(--text-muted));">${req.email}</div>
                    </div>
                  </div>
                  <div style="font-size: 0.82rem; color: hsl(var(--text-dim)); margin-bottom: 4px;">
                    🏗️ Obra solicitada: <strong style="color: hsl(var(--text-muted));">${req.obraSolicitada}</strong>
                  </div>
                  ${req.mensagem ? `<div style="font-size: 0.8rem; color: hsl(var(--text-dim)); font-style: italic;">"${req.mensagem}"</div>` : ''}
                  <div style="font-size: 0.75rem; color: hsl(var(--text-dim)); margin-top: 6px;">
                    Solicitado em: ${new Date(req.createdAt).toLocaleString('pt-BR')}
                  </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px; min-width: 220px;">
                  <div>
                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px;">Perfil a conceder</label>
                    <select class="form-control req-role-select" style="font-size: 0.82rem; padding: 6px 10px;">
                      <option value="adm">ADM de Obra</option>
                      <option value="financeiro">Financeiro</option>
                      <option value="engenheiro">Engenheiro</option>
                      <option value="ggo">GGO / Diretor</option>
                    </select>
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px;">Senha provisória</label>
                    <input type="text" class="form-control req-senha-input" placeholder="Ex: Unita@2026" style="font-size: 0.82rem; padding: 6px 10px;" value="Unita@2026" />
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 0.75rem; margin-bottom: 4px;">Vincular a Obra</label>
                    <select class="form-control req-obra-select" style="font-size: 0.82rem; padding: 6px 10px;">
                      <option value="">Todas (Master/GGO)</option>
                      ${obras.map(o => `<option value="${o.id}">${o.name}</option>`).join('')}
                    </select>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button class="btn btn-primary btn-sm btn-approve-req" data-id="${req.id}" data-nome="${req.nome}" data-email="${req.email}" style="flex: 1; justify-content: center; font-size: 0.8rem;">
                      ✅ Aprovar
                    </button>
                    <button class="btn btn-danger btn-sm btn-reject-req" data-id="${req.id}" style="flex: 1; justify-content: center; font-size: 0.8rem;">
                      ❌ Recusar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- Histórico de solicitações -->
    ${historico.length > 0 ? `
      <div class="section-panel">
        <div class="panel-header">
          <h2 class="panel-title">Histórico (${historico.length})</h2>
        </div>
        <div class="table-responsive">
          <table class="table-premium">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Obra Solicitada</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              ${historico.map(req => {
                const sb = STATUS_BADGE[req.status] || STATUS_BADGE.pendente;
                return `
                  <tr>
                    <td style="font-weight: 600; color: hsl(var(--text-main));">${req.nome}</td>
                    <td style="font-size: 0.82rem; color: hsl(var(--text-muted));">${req.email}</td>
                    <td>${req.obraSolicitada}</td>
                    <td><span class="badge ${sb.cls}"><span class="badge-dot"></span>${sb.label}</span></td>
                    <td style="font-size: 0.8rem; color: hsl(var(--text-dim));">${new Date(req.createdAt).toLocaleDateString('pt-BR')}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}
  `;

  // Eventos de aprovação e recusa
  tabContent.querySelectorAll('.btn-approve-req').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const card = e.currentTarget.closest('.request-card');
      const id = e.currentTarget.dataset.id;
      const nome = e.currentTarget.dataset.nome;
      const email = e.currentTarget.dataset.email;
      const role = card.querySelector('.req-role-select').value;
      const senha = card.querySelector('.req-senha-input').value;
      const obraId = card.querySelector('.req-obra-select').value || null;

      btn.disabled = true;
      btn.textContent = 'Criando...';

      try {
        await createUsuario({ nome, email, senha, role, obraId });
        await updateAccessRequest(id, { status: 'aprovado' });
        await renderRequestsTab(tabContent);
      } catch (err) {
        console.error('Erro ao aprovar:', err);
        alert('Erro ao aprovar: ' + (err.message || JSON.stringify(err)));
        btn.disabled = false;
        btn.textContent = '✅ Aprovar';
      }
    });
  });

  tabContent.querySelectorAll('.btn-reject-req').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      await updateAccessRequest(id, { status: 'rejeitado' });
      await renderRequestsTab(tabContent);
    });
  });
}

async function renderUsersTab(tabContent) {
  const usuarios = await getUsuarios();
  const obras = await getObras();
 
  tabContent.innerHTML = `
    <div class="section-panel">
      <div class="panel-header">
        <h2 class="panel-title">Usuários do Sistema (${usuarios.length})</h2>
        <button class="btn btn-primary btn-sm" id="btn-new-user" style="font-size: 0.82rem;">
          + Novo Usuário
        </button>
      </div>
 
      <!-- Formulário de novo usuário (oculto) -->
      <div id="new-user-form-panel" style="display: none; background: hsl(var(--bg-input)); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 20px; margin-bottom: 20px;">
        <h3 style="font-size: 0.9rem; font-weight: 700; color: hsl(var(--text-main)); margin-bottom: 16px;">➕ Adicionar Novo Usuário</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Nome Completo</label>
            <input type="text" id="nu-nome" class="form-control" placeholder="João da Silva" />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">E-mail</label>
            <input type="email" id="nu-email" class="form-control" placeholder="joao@empresa.com.br" />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Senha</label>
            <input type="text" id="nu-senha" class="form-control" placeholder="Unita@2026" />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Perfil</label>
            <select id="nu-role" class="form-control">
              <option value="adm">ADM de Obra</option>
              <option value="financeiro">Financeiro</option>
              <option value="engenheiro">Engenheiro</option>
              <option value="ggo">GGO / Diretor</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0; grid-column: 1 / -1;">
            <label class="form-label">Vincular a Obra</label>
            <select id="nu-obra-id" class="form-control">
              <option value="">Todas as Obras (Master/GGO)</option>
              ${obras.map(o => `<option value="${o.id}">${o.name} (${o.cnpj})</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="nu-error" style="display:none; color: hsl(var(--color-danger)); font-size: 0.8rem; margin-top: 10px;"></div>
        <div style="margin-top: 16px; display: flex; gap: 8px;">
          <button class="btn btn-primary btn-sm" id="btn-save-new-user">Salvar Usuário</button>
          <button class="btn btn-secondary btn-sm" id="btn-cancel-new-user">Cancelar</button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table-premium">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>E-mail</th>
              <th>Perfil</th>
              <th>Obra Vinculada</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${usuarios.map(u => {
              const badgeCls = ROLE_BADGE_CLASS[u.role] || 'badge-primary';
              const roleLabel = ROLE_LABELS[u.role] || u.role;
              return `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, hsl(var(--color-primary)), hsl(260,70%,55%)); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.75rem; color: white; flex-shrink: 0;">${u.initials}</div>
                      <span style="font-weight: 600; color: hsl(var(--text-main));">${u.nome}</span>
                    </div>
                  </td>
                  <td style="font-size: 0.82rem; color: hsl(var(--text-muted));">${u.email}</td>
                  <td><span class="badge ${badgeCls}"><span class="badge-dot"></span>${roleLabel}</span></td>
                  <td style="font-size: 0.82rem; color: ${u.obraNome.startsWith('Todas') ? 'hsl(var(--text-dim))' : 'white'}; font-weight: ${u.obraNome.startsWith('Todas') ? 'normal' : '600'};">${u.obraNome}</td>
                  <td>
                    <button class="btn btn-danger btn-sm btn-delete-user" data-id="${u.id}" data-nome="${u.nome}" style="font-size: 0.75rem; padding: 4px 10px;">
                      Remover
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btn-new-user').addEventListener('click', () => {
    const panel = document.getElementById('new-user-form-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('btn-cancel-new-user').addEventListener('click', () => {
    document.getElementById('new-user-form-panel').style.display = 'none';
  });

  document.getElementById('btn-save-new-user').addEventListener('click', async () => {
    const nome = document.getElementById('nu-nome').value.trim();
    const email = document.getElementById('nu-email').value.trim();
    const senha = document.getElementById('nu-senha').value.trim();
    const role = document.getElementById('nu-role').value;
    const obraId = document.getElementById('nu-obra-id').value || null;
    const errorEl = document.getElementById('nu-error');

    if (!nome || !email || !senha) {
      errorEl.textContent = 'Preencha todos os campos obrigatórios.';
      errorEl.style.display = 'block';
      return;
    }
    errorEl.style.display = 'none';

    try {
      await createUsuario({ nome, email, senha, role, obraId });
      await renderUsersTab(tabContent);
    } catch (err) {
      errorEl.textContent = 'Erro: ' + (err.message || 'E-mail pode já estar cadastrado.');
      errorEl.style.display = 'block';
    }
  });

  tabContent.querySelectorAll('.btn-delete-user').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      const nome = e.currentTarget.dataset.nome;
      if (!confirm(`Remover o usuário "${nome}"? Esta ação não pode ser desfeita.`)) return;
      try {
        await deleteUsuario(id);
        await renderUsersTab(tabContent);
      } catch (err) {
        alert('Erro ao remover usuário: ' + err.message);
      }
    });
  });
}

// ─── ABA OBRAS ─────────────────────────────────────────────────
async function renderObrasTab(tabContent) {
  const obras = await getObras();

  tabContent.innerHTML = `
    <div class="section-panel">
      <div class="panel-header">
        <h2 class="panel-title">Obras Cadastradas (${obras.length})</h2>
        <button class="btn btn-primary btn-sm" id="btn-new-obra">+ Nova Obra</button>
      </div>

      <!-- Formulário nova obra -->
      <div id="new-obra-form-panel" style="display: none; background: hsl(var(--bg-input)); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 20px; margin-bottom: 20px;">
        <h3 style="font-size: 0.9rem; font-weight: 700; color: hsl(var(--text-main)); margin-bottom: 16px;">🏗️ Nova Obra</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Nome da Obra</label>
            <input type="text" id="no-nome" class="form-control" placeholder="Residencial Bella Vista" />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">CNPJ</label>
            <input type="text" id="no-cnpj" class="form-control" placeholder="00.000.000/0001-00" />
          </div>
          <div class="form-group" style="margin-bottom: 0; grid-column: 1 / -1;">
            <label class="form-label">Endereço Completo</label>
            <input type="text" id="no-endereco" class="form-control" placeholder="Av. Paulista, 1000 - São Paulo - SP" />
          </div>
        </div>
        <div id="no-error" style="display:none; color: hsl(var(--color-danger)); font-size: 0.8rem; margin-top: 10px;"></div>
        <div style="margin-top: 16px; display: flex; gap: 8px;">
          <button class="btn btn-primary btn-sm" id="btn-save-new-obra">Salvar Obra</button>
          <button class="btn btn-secondary btn-sm" id="btn-cancel-new-obra">Cancelar</button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table-premium">
          <thead>
            <tr>
              <th>Nome / Empreendimento</th>
              <th>CNPJ</th>
              <th>Endereço</th>
              <th>Situação Fiscal</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${obras.map(obra => {
              const isDirty = obra.protestStatus === 'dirty';
              return `
                <tr>
                  <td style="font-weight: 600; color: hsl(var(--text-main));">${obra.name}</td>
                  <td style="font-family: monospace; font-size: 0.82rem;">${obra.cnpj}</td>
                  <td style="font-size: 0.82rem; color: hsl(var(--text-muted));">${obra.address}</td>
                  <td>
                    <span class="badge ${isDirty ? 'badge-danger ping-pulse' : 'badge-success'}">
                      <span class="badge-dot"></span>
                      ${isDirty ? 'Protestos Ativos' : 'CNPJ Regular'}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-danger btn-sm btn-delete-obra" data-id="${obra.id}" data-nome="${obra.name}" style="font-size: 0.75rem; padding: 4px 10px;">
                      Remover
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btn-new-obra').addEventListener('click', () => {
    const panel = document.getElementById('new-obra-form-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('btn-cancel-new-obra').addEventListener('click', () => {
    document.getElementById('new-obra-form-panel').style.display = 'none';
  });

  document.getElementById('btn-save-new-obra').addEventListener('click', async () => {
    const nome = document.getElementById('no-nome').value.trim();
    const cnpj = document.getElementById('no-cnpj').value.trim();
    const endereco = document.getElementById('no-endereco').value.trim();
    const errorEl = document.getElementById('no-error');

    if (!nome || !cnpj || !endereco) {
      errorEl.textContent = 'Preencha todos os campos.';
      errorEl.style.display = 'block';
      return;
    }
    errorEl.style.display = 'none';

    try {
      await saveObra({ name: nome, cnpj, address: endereco });
      await renderObrasTab(tabContent);
    } catch (err) {
      errorEl.textContent = 'Erro: ' + (err.message || 'Tente novamente.');
      errorEl.style.display = 'block';
    }
  });

  tabContent.querySelectorAll('.btn-delete-obra').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      const nome = e.currentTarget.dataset.nome;
      if (!confirm(`Remover a obra "${nome}"? Todos os dados vinculados serão perdidos.`)) return;
      try {
        await deleteObra(id);
        await renderObrasTab(tabContent);
      } catch (err) {
        alert('Erro ao remover obra: ' + err.message);
      }
    });
  });
}
