const store = require("../database/sqliteStore");
const { normalizeEmail, publicUser, ROLES } = require("../models/utilizador.model");

function normalizeText(value) {
  return String(value || "").trim();
}

function enrichUtente(data, utente) {
  const user = data.users.find((candidate) => candidate.id === utente.userId);
  const medico = data.medicos.find((candidate) => candidate.id === utente.medicoId);
  const medicoUser = medico ? data.users.find((candidate) => candidate.id === medico.userId) : null;
  const avaliacoes = data.caratAvaliacoes
    .filter((avaliacao) => avaliacao.utenteId === utente.id)
    .sort((a, b) => new Date(b.data) - new Date(a.data));
  const alertasAtivos = data.alertas.filter((alerta) => alerta.utenteId === utente.id && alerta.estado !== "FECHADO");

  return {
    ...utente,
    user: publicUser(user),
    medico: medico
      ? {
          ...medico,
          user: publicUser(medicoUser)
        }
      : null,
    ultimaAvaliacao: avaliacoes[0] || null,
    alertasAtivos
  };
}

class UtenteService {
  listar(filtros = {}) {
    const data = store.read();
    const search = String(filtros.search || "").trim().toLowerCase();
    const medicoId = filtros.medicoId ? Number(filtros.medicoId) : null;

    return data.utentes
      .filter((utente) => !medicoId || utente.medicoId === medicoId)
      .map((utente) => enrichUtente(data, utente))
      .filter((utente) => {
        if (!search) {
          return true;
        }
        return (
          utente.user?.nome?.toLowerCase().includes(search) ||
          utente.numeroProcesso.toLowerCase().includes(search) ||
          utente.diagnosticos.join(" ").toLowerCase().includes(search)
        );
      });
  }

  obter(id) {
    const data = store.read();
    const utente = data.utentes.find((candidate) => candidate.id === Number(id));
    if (!utente) {
      const error = new Error("Utente não encontrado.");
      error.statusCode = 404;
      throw error;
    }
    return enrichUtente(data, utente);
  }

   criar(payload) {
    const data = store.read();
    const email = normalizeEmail(payload.email);
    const nome = normalizeText(payload.nome);
    const dataNascimento = normalizeText(payload.dataNascimento);
    const profissao = normalizeText(payload.profissao);
    const estadoCivil = normalizeText(payload.estadoCivil);
    const telefone = normalizeText(payload.telefone);
    const morada = normalizeText(payload.morada);

    if (!nome || !email || !payload.medicoId || !dataNascimento || !profissao || !estadoCivil || !telefone || !morada) {
      const error = new Error("Nome, email, médico responsável, data de nascimento, profissão, estado civil, telemóvel e morada sao obrigatórios.");
      error.statusCode = 400;
      throw error;
    }
    if (data.users.some((user) => normalizeEmail(user.email) === email)) {
      const error = new Error("Já existe um utilizador com esse email.");
      error.statusCode = 400;
      throw error;
    }

    const user = {
      id: store.nextId("users"),
      nome,
      email,
      password: payload.password || "utente123",
      role: ROLES.UTENTE,
      ativo: true,
      telefone,
      morada
    };

    const utente = {
      id: store.nextId("utentes"),
      userId: user.id,
      medicoId: Number(payload.medicoId),
      numeroProcesso: payload.numeroProcesso || `UT-2026-${String(store.nextId("utentes")).padStart(3, "0")}`,
      dataNascimento,
      profissao,
      estadoCivil,
      diagnosticos: Array.isArray(payload.diagnosticos) ? payload.diagnosticos : [],
      notasClinicas: normalizeText(payload.notasClinicas)
    };

    data.users.push(user);
    data.utentes.push(utente);
    store.write(data);
    store.addAudit(payload.atorId, "CRIAR_UTENTE", `Utente ${user.nome} criado.`);
    return enrichUtente(store.read(), utente);
  }

  atualizar(id, payload) {
    const data = store.read();
    const utente = data.utentes.find((candidate) => candidate.id === Number(id));
    if (!utente) {
      const error = new Error("Utente não encontrado.");
      error.statusCode = 404;
      throw error;
    }

    const user = data.users.find((candidate) => candidate.id === utente.userId);
    if (user) {
      ["nome", "telefone", "morada"].forEach((field) => {
        if (payload[field] !== undefined) {
          user[field] = String(payload[field]).trim();
        }
      });
      if (payload.email !== undefined) {
        user.email = normalizeEmail(payload.email);
      }
      if (payload.ativo !== undefined) {
        user.ativo = Boolean(payload.ativo);
      }
      if (payload.password !== undefined) {
        const password = normalizeText(payload.password);
        if (password.length < 6) {
          const error = new Error("A nova palavra-passe deve ter pelo menos 6 caracteres.");
          error.statusCode = 400;
          throw error;
        }
        user.password = password;
      }
    }

    ["medicoId", "numeroProcesso", "dataNascimento", "profissao", "estadoCivil", "notasClinicas"].forEach((field) => {
      if (payload[field] !== undefined) {
        utente[field] = field === "medicoId" ? Number(payload[field]) : payload[field];
      }
    });

    if (Array.isArray(payload.diagnosticos)) {
      utente.diagnosticos = payload.diagnosticos;
    }

    store.write(data);
    store.addAudit(payload.atorId, "ATUALIZAR_UTENTE", `Utente ${utente.id} atualizado.`);
    return enrichUtente(store.read(), utente);
  }
}

module.exports = new UtenteService();
