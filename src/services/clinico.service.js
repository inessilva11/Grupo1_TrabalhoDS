const store = require("../database/jsonStore");

function validateClinicalPayload(payload) {
  if (!payload.utenteId || !payload.medicoId || !payload.nome) {
    const error = new Error("Utente, medico e nome sao obrigatorios.");
    error.statusCode = 400;
    throw error;
  }
}

class ClinicoService {
  listarMedicacoes(filtros = {}) {
    const data = store.read();
    return data.medicacoes
      .filter((item) => !filtros.utenteId || item.utenteId === Number(filtros.utenteId))
      .filter((item) => !filtros.medicoId || item.medicoId === Number(filtros.medicoId))
      .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  }

  criarMedicacao(payload) {
    validateClinicalPayload(payload);
    const data = store.read();
    const medicacao = {
      id: store.nextId("medicacoes"),
      utenteId: Number(payload.utenteId),
      medicoId: Number(payload.medicoId),
      nome: payload.nome,
      dose: payload.dose || "",
      estado: payload.estado || "Ativa",
      criadoEm: new Date().toISOString()
    };
    data.medicacoes.push(medicacao);
    store.write(data);
    store.addAudit(payload.atorId || payload.medicoId, "CRIAR_MEDICACAO", `Medicacao ${medicacao.nome} registada.`);
    return medicacao;
  }

  listarExames(filtros = {}) {
    const data = store.read();
    return data.exames
      .filter((item) => !filtros.utenteId || item.utenteId === Number(filtros.utenteId))
      .filter((item) => !filtros.medicoId || item.medicoId === Number(filtros.medicoId))
      .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  }

  criarExame(payload) {
    validateClinicalPayload(payload);
    if (!payload.codigo || String(payload.codigo).length !== 4) {
      const error = new Error("O codigo do exame deve ter exatamente 4 caracteres.");
      error.statusCode = 400;
      throw error;
    }

    const data = store.read();
    const exame = {
      id: store.nextId("exames"),
      utenteId: Number(payload.utenteId),
      medicoId: Number(payload.medicoId),
      nome: payload.nome,
      codigo: String(payload.codigo).toUpperCase(),
      estado: payload.estado || "Prescrito",
      resultado: payload.resultado || "",
      criadoEm: new Date().toISOString()
    };
    data.exames.push(exame);
    store.write(data);
    store.addAudit(payload.atorId || payload.medicoId, "CRIAR_EXAME", `Exame ${exame.nome} registado.`);
    return exame;
  }
}

module.exports = new ClinicoService();
