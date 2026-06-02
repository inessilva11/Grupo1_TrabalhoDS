const store = require("../database/sqliteStore");
const { normalizeEmail, publicUser, ROLES } = require("../models/utilizador.model");

function normalizeText(value) {
  return String(value || "").trim();
}

function enrichMedico(data, medico) {
  const user = data.users.find((candidate) => candidate.id === medico.userId);
  const utentes = data.utentes
    .filter((utente) => utente.medicoId === medico.id)
    .map((utente) => {
      const utenteUser = data.users.find((candidate) => candidate.id === utente.userId);
      return {
        ...utente,
        user: publicUser(utenteUser)
      };
    });

  return {
    ...medico,
    user: publicUser(user),
    utentes
  };
}

class MedicoService {
  listar() {
    const data = store.read();
    return data.medicos.map((medico) => enrichMedico(data, medico));
  }

  obter(id) {
    const data = store.read();
    const medico = data.medicos.find((candidate) => candidate.id === Number(id));
    if (!medico) {
      const error = new Error("Médico não encontrado.");
      error.statusCode = 404;
      throw error;
    }
    return enrichMedico(data, medico);
  }

  criar(payload) {
    const data = store.read();
    const email = normalizeEmail(payload.email);
    const nome = normalizeText(payload.nome);
    const especialidade = normalizeText(payload.especialidade);
    const telefone = normalizeText(payload.telefone);
    const morada = normalizeText(payload.morada);

    if (!nome || !email || !especialidade || !telefone || !morada) {
      const error = new Error("Nome, email, especialidade, telemóvel e morada sao obrigatórios.");
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
      password: payload.password || "medico123",
      role: ROLES.MEDICO,
      ativo: true,
      telefone,
      morada
    };
    const medico = {
      id: store.nextId("medicos"),
      userId: user.id,
      cedula: normalizeText(payload.cedula),
      especialidade,
      unidade: normalizeText(payload.unidade) || "Clínica SauDInoB"
    };

    data.users.push(user);
    data.medicos.push(medico);
    store.write(data);
    store.addAudit(payload.atorId, "CRIAR_MEDICO", `Medico ${user.nome} criado.`);
    return enrichMedico(store.read(), medico);
  }

  atualizar(id, payload) {
    const data = store.read();
    const medico = data.medicos.find((candidate) => candidate.id === Number(id));
    if (!medico) {
      const error = new Error("Médico não encontrado.");
      error.statusCode = 404;
      throw error;
    }

    const user = data.users.find((candidate) => candidate.id === medico.userId);
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

    ["cedula", "especialidade", "unidade"].forEach((field) => {
      if (payload[field] !== undefined) {
        medico[field] = payload[field];
      }
    });

    store.write(data);
    store.addAudit(payload.atorId, "ATUALIZAR_MEDICO", `Medico ${medico.id} atualizado.`);
    return enrichMedico(store.read(), medico);
  }
}

module.exports = new MedicoService();