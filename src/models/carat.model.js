const SYMPTOM_ANSWER_OPTIONS = [
  { value: 3, label: "Nunca" },
  { value: 2, label: "Até 1 ou 2 dias" },
  { value: 1, label: "Mais de 2 dias por semana" },
  { value: 0, label: "Quase todos ou todos os dias" }
];

const MEDICATION_ANSWER_OPTIONS = [
  { value: 3, label: "Não estou a tomar medicamentos" },
  { value: 2, label: "Nunca" },
  { value: 1, label: "Menos de 7 dias" },
  { value: 0, label: "7 ou mais dias" }
];

const CARAT_QUESTIONS = [
  {
    id: 1,
    area: "Vias aéreas superiores",
    section: "sintomas",
    text: "Nariz entupido?",
    helper: "Nas últimas 4 semanas, por causa da sua asma/rinite/alergia.",
    options: SYMPTOM_ANSWER_OPTIONS
  },
  {
    id: 2,
    area: "Vias aéreas superiores",
    section: "sintomas",
    text: "Espirros?",
    helper: "Nas últimas 4 semanas, por causa da sua asma/rinite/alergia.",
    options: SYMPTOM_ANSWER_OPTIONS
  },
  {
    id: 3,
    area: "Vias aéreas superiores",
    section: "sintomas",
    text: "Comichão no nariz?",
    helper: "Nas últimas 4 semanas, por causa da sua asma/rinite/alergia.",
    options: SYMPTOM_ANSWER_OPTIONS
  },
  {
    id: 4,
    area: "Vias aéreas superiores",
    section: "sintomas",
    text: "Corrimento/pingo do nariz?",
    helper: "Nas últimas 4 semanas, por causa da sua asma/rinite/alergia.",
    options: SYMPTOM_ANSWER_OPTIONS
  },
  {
    id: 5,
    area: "Vias aéreas inferiores",
    section: "sintomas",
    text: "Falta de ar/dispneia?",
    helper: "Nas últimas 4 semanas, por causa da sua asma/rinite/alergia.",
    options: SYMPTOM_ANSWER_OPTIONS
  },
  {
    id: 6,
    area: "Vias aéreas inferiores",
    section: "sintomas",
    text: "Chiadeira no peito/pieira?",
    helper: "Nas últimas 4 semanas, por causa da sua asma/rinite/alergia.",
    options: SYMPTOM_ANSWER_OPTIONS
  },
  {
    id: 7,
    area: "Vias aéreas inferiores",
    section: "sintomas",
    text: "Aperto no peito com esforco físico?",
    helper: "Nas últimas 4 semanas, por causa da sua asma/rinite/alergia.",
    options: SYMPTOM_ANSWER_OPTIONS
  },
  {
    id: 8,
    area: "Vias aéreas inferiores",
    section: "sintomas",
    text: "Cansaço/dificuldade em fazer as suas atividades ou tarefas do dia-a-dia?",
    helper: "Nas últimas 4 semanas, por causa da sua asma/rinite/alergia.",
    options: SYMPTOM_ANSWER_OPTIONS
  },
  {
    id: 9,
    area: "Vias aéreas inferiores",
    section: "sintomas",
    text: "Acordou durante a noite?",
    helper: "Nas últimas 4 semanas, por causa da sua asma/rinite/alergia.",
    options: SYMPTOM_ANSWER_OPTIONS
  },
  {
    id: 10,
    area: "Vias aéreas inferiores",
    section: "medicação",
    text: "Aumentar a utilização dos seus medicamentos, por causa da sua asma/rinite/alergia?",
    helper: "Nas últimas 4 semanas, por causa da sua asma/rinite/alergia.",
    options: MEDICATION_ANSWER_OPTIONS
  }
];

const ANSWER_OPTIONS = SYMPTOM_ANSWER_OPTIONS;

function interpretScore(scoreTotal) {
  if (scoreTotal > 24) {
    return "Controlado";
  }
  if (scoreTotal >= 16) {
    return "Parcialmente controlado";
  }
  return "Não controlado";
}

function recommendationsFor(scoreTotal) {
  if (scoreTotal > 24) {
    return [
      "Manter o plano de autocuidado atual.",
      "Continuar a registar sintomas e repetir a avaliação no intervalo definido."
    ];
  }

  if (scoreTotal >= 16) {
    return [
      "Rever fatores desencadeantes e adesão terapêutica.",
      "Monitorizar sintomas nos próximos dias.",
      "Contactar a equipa clínica se houver agravamento."
    ];
  }

  return [
    "Contactar a equipa clínica para reavaliação do plano terapêutico.",
    "Estar atento a sinais de alarme como falta de ar intensa, pieira persistente ou aperto no peito.",
    "Evitar exposições desencadeantes e registar sintomas diariamente."
  ];
}

function normalizeAnswers(respostas) {
  if (!Array.isArray(respostas) || respostas.length !== CARAT_QUESTIONS.length) {
    const error = new Error("A avaliação CARAT exige 10 respostas.");
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
  MEDICATION_ANSWER_OPTIONS,
  calculateScores,
  interpretScore,
  recommendationsFor
};
