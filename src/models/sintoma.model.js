const INTENSIDADES = ["Ligeira", "Moderada", "Intensa", "Nao especificada"];

class Sintoma {
  constructor({ id, utenteId, avaliacaoId = null, nome, intensidade, dataInicio, dataFim = null, observacoes = "", criadoEm }) {
    this.id = id;
    this.utenteId = utenteId;
    this.avaliacaoId = avaliacaoId;
    this.nome = nome;
    this.intensidade = intensidade || "Nao especificada";
    this.dataInicio = dataInicio;
    this.dataFim = dataFim || null;
    this.observacoes = observacoes || "";
    this.criadoEm = criadoEm;
  }
}

function normalizeSintomaPayload(payload, partial = false) {
  const normalized = {};

  if (!partial || payload.utenteId !== undefined) {
    const utenteId = Number(payload.utenteId);
    if (!Number.isInteger(utenteId) || utenteId <= 0) {
      throwValidationError("Utente associado ao sintoma e obrigatorio.");
    }
    normalized.utenteId = utenteId;
  }

  if (!partial || payload.nome !== undefined) {
    const nome = String(payload.nome || "").trim();
    if (!nome) {
      throwValidationError("Nome do sintoma e obrigatorio.");
    }
    normalized.nome = nome;
  }

  if (payload.avaliacaoId !== undefined && payload.avaliacaoId !== null && payload.avaliacaoId !== "") {
    const avaliacaoId = Number(payload.avaliacaoId);
    if (!Number.isInteger(avaliacaoId) || avaliacaoId <= 0) {
      throwValidationError("Avaliacao CARAT associada ao sintoma e invalida.");
    }
    normalized.avaliacaoId = avaliacaoId;
  } else if (!partial) {
    normalized.avaliacaoId = null;
  }

  if (!partial || payload.intensidade !== undefined) {
    const intensidade = String(payload.intensidade || "Nao especificada").trim();
    if (!INTENSIDADES.includes(intensidade)) {
      throwValidationError("Intensidade do sintoma invalida.");
    }
    normalized.intensidade = intensidade;
  }

  if (!partial || payload.dataInicio !== undefined) {
    normalized.dataInicio = normalizeDate(payload.dataInicio || new Date().toISOString(), "Data de inicio do sintoma invalida.");
  }

  if (payload.dataFim !== undefined) {
    normalized.dataFim = payload.dataFim ? normalizeDate(payload.dataFim, "Data de fim do sintoma invalida.") : null;
  } else if (!partial) {
    normalized.dataFim = null;
  }

  if (payload.observacoes !== undefined) {
    normalized.observacoes = String(payload.observacoes || "").trim();
  } else if (!partial) {
    normalized.observacoes = "";
  }

  return normalized;
}

function normalizeDate(value, message) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throwValidationError(message);
  }
  return date.toISOString();
}

function throwValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
}

module.exports = {
  INTENSIDADES,
  Sintoma,
  normalizeSintomaPayload
};
