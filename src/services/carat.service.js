const store = require("../database/sqliteStore");
const alertaService = require("./alerta.service");
const { CARAT_QUESTIONS, ANSWER_OPTIONS, MEDICATION_ANSWER_OPTIONS, calculateScores } = require("../models/carat.model");

function nextIdFromData(data, collectionName) {
  const collection = data[collectionName] || [];
  return collection.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

class CaratService {
  obterQuestionario() {
    return {
      perguntas: CARAT_QUESTIONS,
      opcoes: ANSWER_OPTIONS,
      opcoesMedicacao: MEDICATION_ANSWER_OPTIONS,
      escala: "3 representa melhor controlo; 0 representa maior frequencia ou agravamento."
    };
  }

  listarAvaliacoes(filtros = {}) {
    const data = store.read();
    return data.caratAvaliacoes
      .filter((avaliacao) => !filtros.utenteId || avaliacao.utenteId === Number(filtros.utenteId))
      .filter((avaliacao) => !filtros.medicoId || avaliacao.medicoId === Number(filtros.medicoId))
      .filter((avaliacao) => !filtros.interpretacao || avaliacao.interpretacao === filtros.interpretacao)
      .sort((a, b) => new Date(b.data) - new Date(a.data));
  }

  criarAvaliacao(payload) {
    const data = store.read();
    const utenteId = Number(payload.utenteId);
    const utente = data.utentes.find((candidate) => candidate.id === utenteId);
    if (!utente) {
      const error = new Error("Utente nao encontrado para a avaliacao CARAT.");
      error.statusCode = 404;
      throw error;
    }

    const calculo = calculateScores(payload.respostas);
    const anteriores = data.caratAvaliacoes
      .filter((avaliacao) => avaliacao.utenteId === utenteId)
      .sort((a, b) => new Date(b.data) - new Date(a.data));

    const sintomasReportados = Array.isArray(payload.sintomas) ? payload.sintomas.filter(Boolean) : [];
    const avaliacao = {
      id: store.nextId("caratAvaliacoes"),
      utenteId,
      medicoId: utente.medicoId,
      respostas: calculo.respostas,
      scoreTotal: calculo.scoreTotal,
      scoreSuperior: calculo.scoreSuperior,
      scoreInferior: calculo.scoreInferior,
      interpretacao: calculo.interpretacao,
      recomendacoes: calculo.recomendacoes,
      sintomas: sintomasReportados,
      comentarios: String(payload.comentarios || "").trim(),
      data: new Date().toISOString()
    };

    data.caratAvaliacoes.push(avaliacao);
    data.sintomas = data.sintomas || [];
    const primeiroSintomaId = nextIdFromData(data, "sintomas");
    sintomasReportados.forEach((nome, index) => {
      data.sintomas.push({
        id: primeiroSintomaId + index,
        utenteId,
        avaliacaoId: avaliacao.id,
        nome: String(nome).trim(),
        intensidade: "Nao especificada",
        dataInicio: avaliacao.data,
        dataFim: null,
        observacoes: avaliacao.comentarios,
        criadoEm: avaliacao.data
      });
    });
    
    const alertasGerados = alertaService.gerarParaAvaliacao(data, avaliacao, anteriores[0] || null);

    store.write(data);
    store.addAudit(payload.atorId || utente.userId, "CRIAR_AVALIACAO_CARAT", `Avaliacao CARAT ${avaliacao.id} criada para utente ${utenteId}.`);

    return {
      avaliacao,
      alertasGerados
    };
  }
}

module.exports = new CaratService();
