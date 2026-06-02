const store = require("../database/sqliteStore");
const { Sintoma, normalizeSintomaPayload } = require("../models/sintoma.model");

function sortByDateDesc(items, field = "dataInicio") {
  return [...items].sort((a, b) => new Date(b[field]) - new Date(a[field]));
}

function publicName(data, userId) {
  return data.users.find((candidate) => candidate.id === userId)?.nome || "";
}

function enrichSintoma(data, sintoma) {
  const utente = data.utentes.find((candidate) => candidate.id === sintoma.utenteId);
  const avaliacao = data.caratAvaliacoes.find((candidate) => candidate.id === sintoma.avaliacaoId);

  return {
    ...sintoma,
    utenteNome: utente ? publicName(data, utente.userId) : "Utente desconhecido",
    avaliacaoScore: avaliacao?.scoreTotal ?? null,
    avaliacaoData: avaliacao?.data || null
  };
}

function assertRelationships(data, payload) {
  const utente = data.utentes.find((candidate) => candidate.id === payload.utenteId);
  if (!utente) {
    const error = new Error("Utente associado ao sintoma nao encontrado.");
    error.statusCode = 404;
    throw error;
  }

  if (payload.avaliacaoId) {
    const avaliacao = data.caratAvaliacoes.find((candidate) => candidate.id === payload.avaliacaoId);
    if (!avaliacao || avaliacao.utenteId !== payload.utenteId) {
      const error = new Error("Avaliacao CARAT associada ao sintoma nao encontrada para este utente.");
      error.statusCode = 404;
      throw error;
    }
  }
}

class SintomaService {
  listar(filtros = {}) {
    const data = store.read();
    const search = String(filtros.search || "").trim().toLowerCase();

    return sortByDateDesc(data.sintomas || [])
      .filter((sintoma) => !filtros.utenteId || sintoma.utenteId === Number(filtros.utenteId))
      .filter((sintoma) => !filtros.avaliacaoId || sintoma.avaliacaoId === Number(filtros.avaliacaoId))
      .filter((sintoma) => !filtros.intensidade || sintoma.intensidade === filtros.intensidade)
      .filter((sintoma) => {
        if (!search) {
          return true;
        }
        return `${sintoma.nome} ${sintoma.observacoes}`.toLowerCase().includes(search);
      })
      .map((sintoma) => enrichSintoma(data, sintoma));
  }

  criar(payload) {
    const data = store.read();
    const normalized = normalizeSintomaPayload(payload);
    assertRelationships(data, normalized);

    const sintoma = new Sintoma({
      id: store.nextId("sintomas"),
      ...normalized,
      criadoEm: new Date().toISOString()
    });

    data.sintomas = data.sintomas || [];
    data.sintomas.push(sintoma);
    store.write(data);
    store.addAudit(payload.atorId, "CRIAR_SINTOMA", `Sintoma ${sintoma.nome} registado para utente ${sintoma.utenteId}.`);

    return enrichSintoma(store.read(), sintoma);
  }

  atualizar(id, payload) {
    const data = store.read();
    const sintoma = data.sintomas.find((candidate) => candidate.id === Number(id));
    if (!sintoma) {
      const error = new Error("Sintoma nao encontrado.");
      error.statusCode = 404;
      throw error;
    }

    const normalized = normalizeSintomaPayload({ ...sintoma, ...payload }, false);
    assertRelationships(data, normalized);
    Object.assign(sintoma, normalized);

    store.write(data);
    store.addAudit(payload.atorId, "ATUALIZAR_SINTOMA", `Sintoma ${sintoma.id} atualizado.`);
    return enrichSintoma(store.read(), sintoma);
  }
}

module.exports = new SintomaService();
