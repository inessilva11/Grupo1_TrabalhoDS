const FHIR_BASE = "https://saudinob.local/fhir";
const CARAT_SYSTEM = `${FHIR_BASE}/CodeSystem/carat`;

function toObservationResource(avaliacao) {
  return {
    resourceType: "Observation",
    id: `carat-${avaliacao.id}`,
    status: "final",
    code: {
      coding: [
        {
          system: CARAT_SYSTEM,
          code: "CARAT-TOTAL",
          display: "CARAT total score"
        }
      ],
      text: "CARAT total score"
    },
    valueQuantity: {
      value: avaliacao.scoreTotal,
      unit: "score",
      code: "score"
    },
    effectiveDateTime: avaliacao.data,
    subject: {
      reference: `Patient/utente-${avaliacao.utenteId}`
    }
  };
}

function mapObservation(resource) {
  return {
    id: resource.id,
    status: resource.status,
    code: resource.code?.coding?.[0]?.code || "",
    display: resource.code?.coding?.[0]?.display || resource.code?.text || "",
    value: resource.valueQuantity?.value ?? "",
    unit: resource.valueQuantity?.unit || resource.valueQuantity?.code || "",
    effectiveDateTime: resource.effectiveDateTime || "",
    subject: resource.subject?.reference || ""
  };
}

function mapObservationHumanData(resource) {
  return {
    ...mapObservation(resource),
    effectiveDateTime: formatarDataPortuguesa(resource.effectiveDateTime)
  };
}

function mapCaratAvaliacao(avaliacao, humanDate = false) {
  const resource = toObservationResource(avaliacao);
  return humanDate ? mapObservationHumanData(resource) : mapObservation(resource);
}

function formatarDataPortuguesa(dataFHIR) {
  if (!dataFHIR) {
    return "";
  }

  return new Date(dataFHIR).toLocaleString("pt-PT", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

module.exports = {
  FHIR_BASE,
  CARAT_SYSTEM,
  toObservationResource,
  mapObservation,
  mapObservationHumanData,
  mapCaratAvaliacao
};
