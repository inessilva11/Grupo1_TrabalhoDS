const CARAT_QUESTIONS = [
  {
    id: 1,
    area: "Vias aereas superiores",
    text: "Nariz entupido, comichao ou pingo no nariz",
    helper: "Sintomas de rinite nos ultimos dias."
  },
  {
    id: 2,
    area: "Vias aereas superiores",
    text: "Espirros ou corrimento nasal",
    helper: "Frequencia de sintomas nasais."
  },
  {
    id: 3,
    area: "Vias aereas superiores",
    text: "Olhos irritados ou lacrimejantes",
    helper: "Sinais associados a alergia respiratoria."
  },
  {
    id: 4,
    area: "Vias aereas superiores",
    text: "Sono afetado por sintomas nasais",
    helper: "Impacto da rinite na qualidade de sono."
  },
  {
    id: 5,
    area: "Vias aereas inferiores",
    text: "Falta de ar",
    helper: "Dificuldade respiratoria nas atividades habituais."
  },
  {
    id: 6,
    area: "Vias aereas inferiores",
    text: "Pieira ou ruido no peito",
    helper: "Sintomas de obstrucao das vias aereas."
  },
  {
    id: 7,
    area: "Vias aereas inferiores",
    text: "Aperto ou peso no peito",
    helper: "Sensacao toracica associada a agravamento."
  },
  {
    id: 8,
    area: "Vias aereas inferiores",
    text: "Limitacao nas atividades diarias",
    helper: "Impacto funcional dos sintomas respiratorios."
  },
  {
    id: 9,
    area: "Vias aereas inferiores",
    text: "Necessidade de medicacao de alivio",
    helper: "Uso de medicacao SOS ou adicional."
  },
  {
    id: 10,
    area: "Vias aereas inferiores",
    text: "Percecao global de controlo respiratorio",
    helper: "Como sente o controlo da sua doenca."
  }
];

const ANSWER_OPTIONS = [
  { value: 0, label: "Todos os dias" },
  { value: 1, label: "Varios dias" },
  { value: 2, label: "Poucos dias" },
  { value: 3, label: "Nunca ou quase nunca" }
];

function interpretScore(scoreTotal) {
  if (scoreTotal >= 24) {
    return "Controlado";
  }
  if (scoreTotal >= 16) {
    return "Parcialmente controlado";
  }
  return "Nao controlado";
}

function recommendationsFor(scoreTotal) {
  if (scoreTotal >= 24) {
    return [
      "Manter o plano de autocuidado atual.",
      "Continuar a registar sintomas e repetir a avaliacao no intervalo definido."
    ];
  }

  if (scoreTotal >= 16) {
    return [
      "Rever fatores desencadeantes e adesao terapeutica.",
      "Monitorizar sintomas nos proximos dias.",
      "Contactar a equipa clinica se houver agravamento."
    ];
  }

  return [
    "Contactar a equipa clinica para reavaliacao do plano terapeutico.",
    "Estar atento a sinais de alarme como falta de ar intensa, pieira persistente ou aperto no peito.",
    "Evitar exposicoes desencadeantes e registar sintomas diariamente."
  ];
}

function normalizeAnswers(respostas) {
  if (!Array.isArray(respostas) || respostas.length !== CARAT_QUESTIONS.length) {
    const error = new Error("A avaliacao CARAT exige 10 respostas.");
    error.statusCode = 400;
    throw error;
  }

  return respostas.map((answer) => {
    const value = Number(answer);
    if (!Number.isInteger(value) || value < 0 || value > 3) {
      const error = new Error("Cada resposta CARAT deve ser um numero inteiro entre 0 e 3.");
      error.statusCode = 400;
      throw error;
    }
    return value;
  });
}

function calculateScores(respostas) {
  const normalized = normalizeAnswers(respostas);
  const scoreSuperior = normalized.slice(0, 4).reduce((sum, value) => sum + value, 0);
  const scoreInferior = normalized.slice(4).reduce((sum, value) => sum + value, 0);
  const scoreTotal = scoreSuperior + scoreInferior;

  return {
    respostas: normalized,
    scoreTotal,
    scoreSuperior,
    scoreInferior,
    interpretacao: interpretScore(scoreTotal),
    recomendacoes: recommendationsFor(scoreTotal)
  };
}

module.exports = {
  CARAT_QUESTIONS,
  ANSWER_OPTIONS,
  calculateScores,
  interpretScore,
  recommendationsFor
};
