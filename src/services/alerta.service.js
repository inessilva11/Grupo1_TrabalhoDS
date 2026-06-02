const store = require("../database/sqliteStore");
const { validateAlertState } = require("../models/alerta.model");

function nextIdFromData(data, collectionName) {
  const collection = data[collectionName] || [];
  return collection.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function enrichAlerta(data, alerta) {
  const utente = data.utentes.find((candidate) => candidate.id === alerta.utenteId);
  const utenteUser = utente ? data.users.find((candidate) => candidate.id === utente.userId) : null;
  const medico = data.medicos.find((candidate) => candidate.id === alerta.medicoId);
  const medicoUser = medico ? data.users.find((candidate) => candidate.id === medico.userId) : null;

  return {
    ...alerta,
    utenteNome: utenteUser?.nome || "Utente desconhecido",
    medicoNome: medicoUser?.nome || "Médico desconhecido"
  };
}

class AlertaService {
  listar(filtros = {}) {
    const data = store.read();
    return data.alertas
      .filter((alerta) => !filtros.estado || alerta.estado === filtros.estado)
      .filter((alerta) => !filtros.prioridade || alerta.prioridade === filtros.prioridade)
      .filter((alerta) => !filtros.utenteId || alerta.utenteId === Number(filtros.utenteId))
      .filter((alerta) => !filtros.medicoId || alerta.medicoId === Number(filtros.medicoId))
      .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
      .map((alerta) => enrichAlerta(data, alerta));
  }

  atualizarEstado(id, payload) {
    const data = store.read();
    const alerta = data.alertas.find((candidate) => candidate.id === Number(id));
    if (!alerta) {
      const error = new Error("Alerta não encontrado.");
      error.statusCode = 404;
      throw error;
    }

    validateAlertState(payload.estado);
    alerta.estado = payload.estado;
    if (payload.estado === "FECHADO") {
      alerta.fechadoEm = new Date().toISOString();
    }

    alerta.acoes.push({
      id: alerta.acoes.length + 1,
      autorId: payload.autorId ? Number(payload.autorId) : null,
      estado: payload.estado,
      nota: payload.nota || "Atualização de estado",
      data: new Date().toISOString()
    });

    store.write(data);
    store.addAudit(payload.autorId, "ATUALIZAR_ALERTA", `Alerta ${alerta.id} atualizado para ${payload.estado}.`);
    return enrichAlerta(store.read(), alerta);
  }

  gerarParaAvaliacao(data, avaliacao, avaliacaoAnterior = null) {
    const config = data.configuracao;
    const motivos = [];
    const queda = avaliacaoAnterior ? avaliacaoAnterior.scoreTotal - avaliacao.scoreTotal : 0;

    if (avaliacao.scoreTotal < config.limiarControloInsuficiente) {
      motivos.push("Score CARAT abaixo do limiar configurado.");
    }
    if (avaliacaoAnterior && queda >= config.variacaoDeterioracao) {
      motivos.push(`Deterioração de ${queda} pontos face a avaliação anterior.`);
    }

    if (motivos.length === 0) {
      return [];
    }

    const prioridade = avaliacao.scoreTotal < 16 || queda >= config.variacaoDeterioracao + 2 ? "Alta" : "Média";
    const alerta = {
      id: nextIdFromData(data, "alertas"),
      utenteId: avaliacao.utenteId,
      medicoId: avaliacao.medicoId,
      avaliacaoId: avaliacao.id,
      prioridade,
      motivo: motivos.join(" "),
      estado: "NOVO",
      criadoEm: new Date().toISOString(),
      fechadoEm: null,
      configSnapshot: {
        limiarControloInsuficiente: config.limiarControloInsuficiente,
        variacaoDeterioracao: config.variacaoDeterioracao
      },
      acoes: []
    };

    data.alertas.push(alerta);
    return [alerta];
  }
}

module.exports = new AlertaService();
