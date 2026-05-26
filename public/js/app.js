const demoAccounts = {
  utente: { email: "utente@saudinob.pt", password: "utente123" },
  medico: { email: "medico@saudinob.pt", password: "medico123" },
  administrador: { email: "admin@saudinob.pt", password: "admin123" }
};

const state = {
  role: "utente",
  session: null,
  questionario: null,
  dashboard: null,
  selectedUtenteId: null,
  selectedUtenteDashboard: null,
  adminUsers: [],
  medicos: [],
  fhirPayload: null
};

const app = document.querySelector("#app");
const toastEl = document.querySelector("#toast");
const titleEl = document.querySelector("#view-title");
const sessionCard = document.querySelector("#session-card");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) {
    return "Sem data";
  }
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  window.setTimeout(() => toastEl.classList.remove("show"), 3200);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(state.session?.token ? { Authorization: `Bearer ${state.session.token}` } : {}),
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(payload?.erro || "Pedido falhou.");
  }
  return payload;
}

async function ensureQuestionario() {
  if (!state.questionario) {
    state.questionario = await api("/api/carat/questions");
  }
}

function updateShell() {
  document.querySelectorAll("[data-login-role]").forEach((button) => {
    button.classList.toggle("active", button.dataset.loginRole === state.role);
  });

  const titles = {
    login: "Iniciar sessao",
    utente: "Dashboard do Utente",
    medico: "Painel Clinico do Medico",
    administrador: "Consola do Administrador"
  };
  titleEl.textContent = state.session ? titles[state.role] : titles.login;

  const user = state.session?.user;
  sessionCard.innerHTML = `
    <span class="status-dot"></span>
    <div>
      <strong>${escapeHtml(user?.nome || "Sem sessao")}</strong>
      <span>${escapeHtml(user?.email || "Sessao de demonstracao")}</span>
    </div>
    ${state.session ? `<button class="button secondary small" type="button" id="logout-button">Sair</button>` : ""}
  `;
}

function persistSession(session) {
  state.session = session;
  state.role = session.user.role;
  localStorage.setItem("saudinob-session", JSON.stringify(session));
}

async function loginAs(role) {
  state.role = role;
  state.dashboard = null;
  state.selectedUtenteDashboard = null;
  state.fhirPayload = null;
  app.innerHTML = `<div class="panel">A carregar dados...</div>`;

  try {
    await ensureQuestionario();
    const session = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(demoAccounts[role])
    });
    persistSession(session);
    await refreshDashboard();
    updateShell();
    render();
  } catch (error) {
    app.innerHTML = `<div class="panel">${escapeHtml(error.message)}</div>`;
    showToast(error.message);
  }
}

async function loginWithCredentials(email, password) {
  const session = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  persistSession(session);
  await ensureQuestionario();
  await refreshDashboard();
  render();
}

async function restoreSession() {
  const saved = localStorage.getItem("saudinob-session");
  if (!saved) {
    render();
    return;
  }

  try {
    state.session = JSON.parse(saved);
    const fresh = await api("/api/auth/me");
    persistSession(fresh);
    await ensureQuestionario();
    await refreshDashboard();
    render();
  } catch (error) {
    localStorage.removeItem("saudinob-session");
    state.session = null;
    render();
  }
}

async function logout() {
  try {
    await api("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
  } catch (error) {
    // A sessao local deve terminar mesmo que o token ja esteja expirado no servidor.
  }
  localStorage.removeItem("saudinob-session");
  state.session = null;
  state.dashboard = null;
  state.selectedUtenteDashboard = null;
  state.fhirPayload = null;
  render();
}

async function refreshDashboard() {
  if (state.role === "utente") {
    state.dashboard = await api(`/api/dashboard/utente/${state.session.profile.id}`);
    return;
  }

  if (state.role === "medico") {
    state.dashboard = await api(`/api/dashboard/medico/${state.session.profile.id}`);
    if (!state.selectedUtenteId && state.dashboard.utentes.length) {
      state.selectedUtenteId = state.dashboard.utentes[0].id;
    }
    if (state.selectedUtenteId) {
      state.selectedUtenteDashboard = await api(`/api/dashboard/utente/${state.selectedUtenteId}`);
    }
    return;
  }

  state.dashboard = await api("/api/dashboard/admin");
  state.adminUsers = await api("/api/auth/users");
  state.medicos = await api("/api/medicos");
}

function metric(label, value, detail = "") {
  return `
    <div class="metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value ?? "-")}</strong>
      ${detail ? `<span class="trend">${escapeHtml(detail)}</span>` : ""}
    </div>
  `;
}

function badge(text, kind = "") {
  return `<span class="badge ${kind}">${escapeHtml(text)}</span>`;
}

function priorityKind(priority) {
  if (priority === "Alta") {
    return "high";
  }
  if (priority === "Media") {
    return "medium";
  }
  return "";
}

function stateKind(alertState) {
  return alertState === "FECHADO" ? "closed" : "";
}

function renderScoreChart(avaliacoes, config) {
  const items = [...avaliacoes].sort((a, b) => new Date(a.data) - new Date(b.data)).slice(-8);
  if (items.length === 0) {
    return `<div class="empty">Ainda nao ha avaliacoes CARAT para desenhar a evolucao.</div>`;
  }

  const width = 720;
  const height = 230;
  const padX = 46;
  const padY = 28;
  const maxScore = 30;
  const threshold = Number(config.limiarControloInsuficiente);
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;
  const xFor = (index) => padX + (items.length === 1 ? plotW / 2 : (index * plotW) / (items.length - 1));
  const yFor = (score) => padY + plotH - (score / maxScore) * plotH;
  const points = items.map((item, index) => `${xFor(index)},${yFor(item.scoreTotal)}`).join(" ");
  const thresholdY = yFor(threshold);

  return `
    <div class="chart" role="img" aria-label="Grafico de evolucao dos scores CARAT">
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <line x1="${padX}" x2="${width - padX}" y1="${thresholdY}" y2="${thresholdY}" stroke="#c95c45" stroke-width="2" stroke-dasharray="7 6"></line>
        <text x="${padX}" y="${thresholdY - 8}" fill="#a23b33" font-size="12">Limiar ${threshold}</text>
        <line x1="${padX}" x2="${padX}" y1="${padY}" y2="${height - padY}" stroke="#d9ded5"></line>
        <line x1="${padX}" x2="${width - padX}" y1="${height - padY}" y2="${height - padY}" stroke="#d9ded5"></line>
        <polyline points="${points}" fill="none" stroke="#087d73" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"></polyline>
        ${items
          .map((item, index) => {
            const x = xFor(index);
            const y = yFor(item.scoreTotal);
            return `
              <circle cx="${x}" cy="${y}" r="7" fill="#ffffff" stroke="#087d73" stroke-width="3"></circle>
              <text x="${x}" y="${y - 14}" text-anchor="middle" fill="#20231f" font-size="12">${item.scoreTotal}</text>
              <text x="${x}" y="${height - 8}" text-anchor="middle" fill="#67706a" font-size="11">${new Date(item.data).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })}</text>
            `;
          })
          .join("")}
      </svg>
    </div>
  `;
}

function renderAlertas(alertas, medicoMode = false) {
  if (!alertas.length) {
    return `<div class="empty">Sem alertas registados.</div>`;
  }

  return `
    <div class="list">
      ${alertas
        .map((alerta) => `
          <article class="list-item">
            <div class="item-head">
              <div>
                <strong>${escapeHtml(alerta.motivo)}</strong>
                <span>${formatDate(alerta.criadoEm)}</span>
              </div>
              <div class="actions">
                ${badge(alerta.prioridade, priorityKind(alerta.prioridade))}
                ${badge(alerta.estado, stateKind(alerta.estado))}
              </div>
            </div>
            ${alerta.acoes?.length ? `<p class="muted">${escapeHtml(alerta.acoes.at(-1).nota)}</p>` : ""}
            ${
              medicoMode && alerta.estado !== "FECHADO"
                ? `
                  <div class="actions">
                    <button class="button secondary" type="button" data-alert-id="${alerta.id}" data-alert-state="VISTO">Marcar visto</button>
                    <button class="button secondary" type="button" data-alert-id="${alerta.id}" data-alert-state="EM_SEGUIMENTO">Em seguimento</button>
                    <button class="button warning" type="button" data-alert-id="${alerta.id}" data-alert-state="FECHADO">Fechar</button>
                  </div>
                `
                : ""
            }
          </article>
        `)
        .join("")}
    </div>
  `;
}

function renderQuestionarioForm() {
  const { perguntas, opcoes } = state.questionario;
  return `
    <form id="carat-form" class="form-grid">
      <div class="question-list">
        ${perguntas
          .map((question) => `
            <fieldset class="question">
              <div class="question-header">
                <legend class="question-title">${question.id}. ${escapeHtml(question.text)}</legend>
                <small>${escapeHtml(question.area)}</small>
              </div>
              <div class="radio-grid">
                ${opcoes
                  .map((option) => `
                    <label class="radio-card">
                      <input type="radio" name="q${question.id}" value="${option.value}" ${option.value === 2 ? "checked" : ""} required>
                      <span>${escapeHtml(option.label)}</span>
                    </label>
                  `)
                  .join("")}
              </div>
              <small>${escapeHtml(question.helper)}</small>
            </fieldset>
          `)
          .join("")}
      </div>

      <div class="field">
        <label>Sintomas sentidos agora</label>
        <div class="chip-row">
          ${["falta de ar", "pieira", "tosse", "espirros", "aperto no peito", "sono afetado"]
            .map((symptom) => `
              <label class="chip">
                <input type="checkbox" name="sintomas" value="${escapeHtml(symptom)}">
                ${escapeHtml(symptom)}
              </label>
            `)
            .join("")}
        </div>
      </div>
      <div class="actions">
        <button class="button" type="submit">Submeter avaliacao CARAT</button>
      </div>
    </form>
  `;
}

function renderUtente() {
  const d = state.dashboard;
  const latest = d.resumo.ultimaAvaliacao;
  const tendencia = d.resumo.tendencia;
  const tendenciaLabel = tendencia === 0 ? "Sem variacao recente" : tendencia > 0 ? `Subiu ${tendencia} pontos` : `Desceu ${Math.abs(tendencia)} pontos`;
  const activeAlerts = d.alertas.filter((alerta) => alerta.estado !== "FECHADO");

  return `
    <div class="metric-row">
      ${metric("Score atual", latest?.scoreTotal ?? "-", latest?.interpretacao || "Sem avaliacao")}
      ${metric("Alertas ativos", d.resumo.alertasAtivos)}
      ${metric("Score medio", d.resumo.scoreMedio ?? "-")}
      ${metric("Tendencia", tendenciaLabel)}
    </div>

    <div class="grid two">
      <section class="panel">
        <h2>Evolucao CARAT</h2>
        ${renderScoreChart(d.avaliacoes, d.configuracao)}
      </section>

      <section class="panel">
        <h2>Alertas e proximos passos</h2>
        ${latest ? `<p><strong>${escapeHtml(latest.interpretacao)}</strong></p>` : ""}
        <div class="chip-row">
          ${(latest?.recomendacoes || []).map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("")}
        </div>
        <h3>Alertas ativos</h3>
        ${renderAlertas(activeAlerts)}
      </section>
    </div>

    <div class="grid two">
      <section class="panel">
        <h2>Responder ao questionario CARAT</h2>
        ${renderQuestionarioForm()}
      </section>

      <section class="panel">
        <h2>Perfil e plano clinico</h2>
        <form id="profile-form" class="form-grid">
          <div class="field">
            <label>Nome</label>
            <input name="nome" value="${escapeHtml(d.perfil.user.nome)}" required>
          </div>
          <div class="form-grid two">
            <div class="field">
              <label>Email</label>
              <input name="email" type="email" value="${escapeHtml(d.perfil.user.email)}" required>
            </div>
            <div class="field">
              <label>Telefone</label>
              <input name="telefone" value="${escapeHtml(d.perfil.user.telefone)}">
            </div>
          </div>
          <div class="field">
            <label>Morada</label>
            <input name="morada" value="${escapeHtml(d.perfil.user.morada)}">
          </div>
          <div class="form-grid two">
            <div class="field">
              <label>Profissao</label>
              <input name="profissao" value="${escapeHtml(d.perfil.profissao)}">
            </div>
            <div class="field">
              <label>Estado civil</label>
              <input name="estadoCivil" value="${escapeHtml(d.perfil.estadoCivil)}">
            </div>
          </div>
          <button class="button" type="submit">Atualizar perfil</button>
        </form>

        <h3>Medicacao</h3>
        ${renderSimpleList(d.medicacoes, (item) => `${item.nome} | ${item.dose} | ${item.estado}`)}
        <h3>Exames</h3>
        ${renderSimpleList(d.exames, (item) => `${item.nome} (${item.codigo}) | ${item.estado}`)}
      </section>
    </div>

    ${renderFhirPanel("Interoperabilidade FHIR do utente", [
      { label: "Patient", url: `/api/fhir/Patient/utente-${d.perfil.id}` },
      { label: "Observations CARAT", url: `/api/fhir/Observation?patient=utente-${d.perfil.id}` },
      { label: "Alertas FHIR", url: `/api/fhir/DetectedIssue?patient=utente-${d.perfil.id}` },
      { label: "Bundle completo", url: `/api/fhir/Bundle/utente/${d.perfil.id}` }
    ])}
  `;
}

function renderSimpleList(items, formatter) {
  if (!items.length) {
    return `<div class="empty">Sem registos.</div>`;
  }
  return `
    <div class="list">
      ${items.map((item) => `<div class="list-item">${escapeHtml(formatter(item))}</div>`).join("")}
    </div>
  `;
}

function renderLogin() {
  return `
    <section class="login-grid">
      <div class="login-copy">
        <h2>Entrar no SauDInoB</h2>
        <p>A autenticacao agora usa sessao com token no backend. Entre com uma conta ou use um atalho de demonstracao.</p>
        <div class="demo-accounts">
          ${Object.entries(demoAccounts)
            .map(([role, account]) => `
              <button class="selectable" type="button" data-demo-fill="${role}">
                <div class="item-head">
                  <div>
                    <strong>${role === "administrador" ? "Administrador" : role.charAt(0).toUpperCase() + role.slice(1)}</strong>
                    <span>${account.email}</span>
                  </div>
                  ${badge("Demo")}
                </div>
              </button>
            `)
            .join("")}
        </div>
      </div>

      <form id="login-form" class="panel auth-form">
        <h2>Iniciar sessao</h2>
        <div class="field">
          <label>Email</label>
          <input name="email" type="email" autocomplete="username" value="utente@saudinob.pt" required>
        </div>
        <div class="field">
          <label>Password</label>
          <input name="password" type="password" autocomplete="current-password" value="utente123" required>
        </div>
        <button class="button" type="submit">Entrar</button>
      </form>
    </section>
  `;
}

function renderFhirPanel(title, endpoints) {
  const payload = state.fhirPayload
    ? JSON.stringify(state.fhirPayload, null, 2)
    : "Escolha um recurso FHIR para ver o JSON exportado.";

  return `
    <section class="panel">
      <div class="item-head">
        <div>
          <h2>${escapeHtml(title)}</h2>
          <p class="muted">Interoperabilidade FHIR R4 em JSON: Patient, Practitioner, Observation, DetectedIssue e Bundle.</p>
        </div>
        ${badge("FHIR R4")}
      </div>
      <div class="actions">
        ${endpoints
          .map((endpoint) => `<button class="button secondary" type="button" data-fhir-url="${endpoint.url}">${escapeHtml(endpoint.label)}</button>`)
          .join("")}
      </div>
      <pre class="json-view">${escapeHtml(payload)}</pre>
    </section>
  `;
}

function renderMedico() {
  const d = state.dashboard;
  const selected = state.selectedUtenteDashboard;
  const patient = selected?.perfil;

  return `
    <div class="metric-row">
      ${metric("Utentes", d.resumo.utentes)}
      ${metric("Alertas novos", d.resumo.alertasNovos)}
      ${metric("Alertas ativos", d.resumo.alertasAtivos)}
      ${metric("Limiar CARAT", d.configuracao.limiarControloInsuficiente)}
    </div>

    <div class="grid two">
      <section class="panel">
        <h2>Lista de utentes</h2>
        <div class="list">
          ${d.utentes
            .map((utente) => `
              <button class="selectable ${utente.id === state.selectedUtenteId ? "active" : ""}" type="button" data-select-utente="${utente.id}">
                <div class="item-head">
                  <div>
                    <strong>${escapeHtml(utente.user.nome)}</strong>
                    <span>${escapeHtml(utente.numeroProcesso)} | ${escapeHtml(utente.diagnosticos.join(", "))}</span>
                  </div>
                  <div class="actions">
                    ${utente.ultimaAvaliacao ? badge(`${utente.ultimaAvaliacao.scoreTotal}/30`) : badge("Sem score")}
                    ${utente.alertasAtivos ? badge(`${utente.alertasAtivos} alerta`, "high") : badge("Estavel")}
                  </div>
                </div>
              </button>
            `)
            .join("")}
        </div>
      </section>

      <section class="panel">
        <h2>${patient ? escapeHtml(patient.user.nome) : "Selecionar utente"}</h2>
        ${
          selected
            ? `
              <p class="muted">${escapeHtml(patient.numeroProcesso)} | ${escapeHtml(patient.diagnosticos.join(", "))}</p>
              ${renderScoreChart(selected.avaliacoes, selected.configuracao)}
              <h3>Alertas do utente</h3>
              ${renderAlertas(selected.alertas, true)}
            `
            : `<div class="empty">Escolha um utente para ver o historico clinico.</div>`
        }
      </section>
    </div>

    ${
      selected
        ? `
          <div class="grid two">
            <section class="panel">
              <h2>Registo clinico</h2>
              <form id="medicacao-form" class="form-grid">
                <h3>Nova medicacao</h3>
                <div class="form-grid two">
                  <div class="field">
                    <label>Medicacao</label>
                    <input name="nome" placeholder="Ex: Corticosteroide inalado" required>
                  </div>
                  <div class="field">
                    <label>Dose</label>
                    <input name="dose" placeholder="Ex: 1 inalacao 12/12h">
                  </div>
                </div>
                <button class="button" type="submit">Registar medicacao</button>
              </form>

              <form id="exame-form" class="form-grid">
                <h3>Novo exame</h3>
                <div class="form-grid two">
                  <div class="field">
                    <label>Exame</label>
                    <input name="nome" placeholder="Ex: Espirometria" required>
                  </div>
                  <div class="field">
                    <label>Codigo com 4 caracteres</label>
                    <input name="codigo" maxlength="4" placeholder="ESP2" required>
                  </div>
                </div>
                <button class="button" type="submit">Prescrever exame</button>
              </form>
            </section>

            <section class="panel">
              <h2>Historico clinico</h2>
              <h3>Medicacao</h3>
              ${renderSimpleList(selected.medicacoes, (item) => `${item.nome} | ${item.dose} | ${item.estado}`)}
              <h3>Exames</h3>
              ${renderSimpleList(selected.exames, (item) => `${item.nome} (${item.codigo}) | ${item.estado}`)}
            </section>
          </div>
          ${renderFhirPanel("Exportacao FHIR do utente selecionado", [
            { label: "Patient", url: `/api/fhir/Patient/utente-${selected.perfil.id}` },
            { label: "Bundle clinico", url: `/api/fhir/Bundle/utente/${selected.perfil.id}` },
            { label: "Observations", url: `/api/fhir/Observation?patient=utente-${selected.perfil.id}` },
            { label: "DetectedIssues", url: `/api/fhir/DetectedIssue?patient=utente-${selected.perfil.id}` }
          ])}
        `
        : ""
    }
  `;
}

function renderAdmin() {
  const d = state.dashboard;
  return `
    <div class="metric-row">
      ${metric("Utilizadores", d.resumo.utilizadores)}
      ${metric("Utentes", d.resumo.utentes)}
      ${metric("Medicos", d.resumo.medicos)}
      ${metric("Alertas ativos", d.resumo.alertasAtivos)}
    </div>

    <div class="grid two">
      <section class="panel">
        <h2>Configuracao de limiares</h2>
        <form id="config-form" class="form-grid">
          <div class="form-grid two">
            <div class="field">
              <label>Limiar de controlo insuficiente</label>
              <input name="limiarControloInsuficiente" type="number" min="0" max="30" value="${d.configuracao.limiarControloInsuficiente}" required>
            </div>
            <div class="field">
              <label>Variacao de deterioracao</label>
              <input name="variacaoDeterioracao" type="number" min="1" max="30" value="${d.configuracao.variacaoDeterioracao}" required>
            </div>
          </div>
          <div class="actions">
            <button class="button" type="submit">Guardar configuracao</button>
            <button class="button secondary" type="button" id="seed-button">Repor dados simulados</button>
          </div>
        </form>
      </section>

      <section class="panel">
        <h2>Auditoria</h2>
        ${renderSimpleList(d.auditoria, (item) => `${formatDate(item.data)} | ${item.acao} | ${item.detalhe}`)}
      </section>
    </div>

    <div class="grid two">
      <section class="panel">
        <h2>Criar utente</h2>
        <form id="create-utente-form" class="form-grid">
          <div class="form-grid two">
            <div class="field">
              <label>Nome</label>
              <input name="nome" required>
            </div>
            <div class="field">
              <label>Email</label>
              <input name="email" type="email" required>
            </div>
          </div>
          <div class="form-grid two">
            <div class="field">
              <label>Medico responsavel</label>
              <select name="medicoId" required>
                ${state.medicos.map((medico) => `<option value="${medico.id}">${escapeHtml(medico.user.nome)} | ${escapeHtml(medico.especialidade)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label>Diagnosticos separados por virgula</label>
              <input name="diagnosticos" placeholder="Asma, Rinite">
            </div>
          </div>
          <button class="button" type="submit">Criar utente</button>
        </form>
      </section>

      <section class="panel">
        <h2>Criar medico</h2>
        <form id="create-medico-form" class="form-grid">
          <div class="form-grid two">
            <div class="field">
              <label>Nome</label>
              <input name="nome" required>
            </div>
            <div class="field">
              <label>Email</label>
              <input name="email" type="email" required>
            </div>
          </div>
          <div class="form-grid two">
            <div class="field">
              <label>Especialidade</label>
              <input name="especialidade" required>
            </div>
            <div class="field">
              <label>Cedula</label>
              <input name="cedula">
            </div>
          </div>
          <button class="button" type="submit">Criar medico</button>
        </form>
      </section>
    </div>

    ${renderFhirPanel("Servidor FHIR SauDInoB", [
      { label: "CapabilityStatement", url: "/api/fhir/metadata" },
      { label: "Patients", url: "/api/fhir/Patient" },
      { label: "Practitioners", url: "/api/fhir/Practitioner" },
      { label: "Observations", url: "/api/fhir/Observation" },
      { label: "DetectedIssues", url: "/api/fhir/DetectedIssue" }
    ])}

    <section class="panel">
      <h2>Utilizadores</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Perfil</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${state.adminUsers
              .map((user) => `
                <tr>
                  <td>${escapeHtml(user.nome)}</td>
                  <td>${escapeHtml(user.email)}</td>
                  <td>${escapeHtml(user.role)}</td>
                  <td>${user.ativo ? "Ativo" : "Inativo"}</td>
                </tr>
              `)
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function render() {
  updateShell();
  if (!state.session) {
    app.innerHTML = renderLogin();
    bindViewEvents();
    return;
  }

  if (!state.dashboard) {
    app.innerHTML = `<div class="panel">A carregar dados...</div>`;
    return;
  }

  if (state.role === "utente") {
    app.innerHTML = renderUtente();
  } else if (state.role === "medico") {
    app.innerHTML = renderMedico();
  } else {
    app.innerHTML = renderAdmin();
  }
  bindViewEvents();
}

function formDataObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function bindViewEvents() {
  const logoutButton = document.querySelector("#logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  }

  const loginForm = document.querySelector("#login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = formDataObject(loginForm);
      try {
        await loginWithCredentials(payload.email, payload.password);
        showToast("Sessao iniciada.");
      } catch (error) {
        showToast(error.message);
      }
    });
  }

  document.querySelectorAll("[data-demo-fill]").forEach((button) => {
    button.addEventListener("click", () => {
      const account = demoAccounts[button.dataset.demoFill];
      const form = document.querySelector("#login-form");
      if (form) {
        form.email.value = account.email;
        form.password.value = account.password;
      }
    });
  });

  document.querySelectorAll("[data-fhir-url]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        state.fhirPayload = await api(button.dataset.fhirUrl);
        render();
        showToast("Recurso FHIR carregado.");
      } catch (error) {
        showToast(error.message);
      }
    });
  });

  const caratForm = document.querySelector("#carat-form");
  if (caratForm) {
    caratForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const respostas = state.questionario.perguntas.map((question) => {
        return Number(new FormData(caratForm).get(`q${question.id}`));
      });
      const sintomas = [...caratForm.querySelectorAll("input[name='sintomas']:checked")].map((input) => input.value);
      await api("/api/carat/avaliacoes", {
        method: "POST",
        body: JSON.stringify({
          utenteId: state.session.profile.id,
          atorId: state.session.user.id,
          respostas,
          sintomas
        })
      });
      await refreshDashboard();
      render();
      showToast("Avaliacao CARAT submetida e dashboard atualizado.");
    });
  }

  const profileForm = document.querySelector("#profile-form");
  if (profileForm) {
    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await api(`/api/utentes/${state.session.profile.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...formDataObject(profileForm),
          atorId: state.session.user.id
        })
      });
      await refreshDashboard();
      render();
      showToast("Perfil atualizado.");
    });
  }

  document.querySelectorAll("[data-select-utente]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.selectedUtenteId = Number(button.dataset.selectUtente);
      state.selectedUtenteDashboard = await api(`/api/dashboard/utente/${state.selectedUtenteId}`);
      render();
    });
  });

  document.querySelectorAll("[data-alert-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const estado = button.dataset.alertState;
      await api(`/api/alertas/${button.dataset.alertId}`, {
        method: "PATCH",
        body: JSON.stringify({
          estado,
          autorId: state.session.user.id,
          nota: estado === "FECHADO" ? "Alerta fechado pelo medico." : `Estado alterado para ${estado}.`
        })
      });
      await refreshDashboard();
      render();
      showToast("Alerta atualizado.");
    });
  });

  const medicacaoForm = document.querySelector("#medicacao-form");
  if (medicacaoForm) {
    medicacaoForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await api("/api/medicacoes", {
        method: "POST",
        body: JSON.stringify({
          ...formDataObject(medicacaoForm),
          utenteId: state.selectedUtenteId,
          medicoId: state.session.profile.id,
          atorId: state.session.user.id
        })
      });
      medicacaoForm.reset();
      await refreshDashboard();
      render();
      showToast("Medicacao registada.");
    });
  }

  const exameForm = document.querySelector("#exame-form");
  if (exameForm) {
    exameForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await api("/api/exames", {
        method: "POST",
        body: JSON.stringify({
          ...formDataObject(exameForm),
          utenteId: state.selectedUtenteId,
          medicoId: state.session.profile.id,
          atorId: state.session.user.id
        })
      });
      exameForm.reset();
      await refreshDashboard();
      render();
      showToast("Exame prescrito.");
    });
  }

  const configForm = document.querySelector("#config-form");
  if (configForm) {
    configForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await api("/api/admin/configuracao", {
        method: "PATCH",
        body: JSON.stringify({
          ...formDataObject(configForm),
          atorId: state.session.user.id
        })
      });
      await refreshDashboard();
      render();
      showToast("Configuracao atualizada.");
    });
  }

  const seedButton = document.querySelector("#seed-button");
  if (seedButton) {
    seedButton.addEventListener("click", async () => {
      await api("/api/admin/seed", { method: "POST", body: JSON.stringify({}) });
      state.selectedUtenteId = null;
      await refreshDashboard();
      render();
      showToast("Dados simulados repostos.");
    });
  }

  const createUtenteForm = document.querySelector("#create-utente-form");
  if (createUtenteForm) {
    createUtenteForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = formDataObject(createUtenteForm);
      payload.diagnosticos = payload.diagnosticos
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      payload.atorId = state.session.user.id;
      await api("/api/utentes", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      createUtenteForm.reset();
      await refreshDashboard();
      render();
      showToast("Utente criado.");
    });
  }

  const createMedicoForm = document.querySelector("#create-medico-form");
  if (createMedicoForm) {
    createMedicoForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await api("/api/medicos", {
        method: "POST",
        body: JSON.stringify({
          ...formDataObject(createMedicoForm),
          atorId: state.session.user.id
        })
      });
      createMedicoForm.reset();
      await refreshDashboard();
      render();
      showToast("Medico criado.");
    });
  }
}

document.querySelectorAll("[data-login-role]").forEach((button) => {
  button.addEventListener("click", () => loginAs(button.dataset.loginRole));
});

restoreSession();
