const store = require("../database/sqliteStore");
const { mapCaratAvaliacao } = require("../mappers/fhir.mapper");

class FhirService {
  getObservations(code = "CARAT-TOTAL", patient) {
    const data = store.read();
    const patientId = patient ? this.extractLocalId(patient, "utente") : null;

    return data.caratAvaliacoes
      .filter((avaliacao) => !patientId || avaliacao.utenteId === patientId)
      .filter(() => code === "CARAT-TOTAL")
      .map((avaliacao) => mapCaratAvaliacao(avaliacao));
  }

  getObservation(id) {
    const data = store.read();
    const localId = this.extractLocalId(id, "carat");
    const avaliacao = data.caratAvaliacoes.find((candidate) => candidate.id === localId);

    if (!avaliacao) {
      const error = new Error("Observation FHIR não encontrada.");
      error.statusCode = 404;
      throw error;
    }

    return mapCaratAvaliacao(avaliacao);
  }

  extractLocalId(value, prefix) {
    const text = String(value || "");
    const cleaned = text.includes("/") ? text.split("/").pop() : text;
    const withoutPrefix = cleaned.startsWith(`${prefix}-`) ? cleaned.slice(prefix.length + 1) : cleaned;
    const id = Number(withoutPrefix);

    if (!Number.isInteger(id) || id <= 0) {
      const error = new Error(`Identificador FHIR inválido: ${value}`);
      error.statusCode = 400;
      throw error;
    }

    return id;
  }
}

module.exports = new FhirService();