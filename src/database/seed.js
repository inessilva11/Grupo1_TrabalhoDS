function iso(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

function seedData() {
  return {
    meta: {
      app: "SauDInoB",
      versao: "1.0.0",
      criadoEm: new Date().toISOString()
    },
    users: [
      {
        id: 1,
        nome: "Sara Moreira",
        email: "utente@saudinob.pt",
        password: "utente123",
        role: "utente",
        ativo: true,
        telefone: "910000001",
        morada: "Rua da Saude, Porto"
      },
      {
        id: 2,
        nome: "Dr. Pedro Almeida",
        email: "medico@saudinob.pt",
        password: "medico123",
        role: "medico",
        ativo: true,
        telefone: "910000002",
        morada: "Clinica SauDInoB"
      },
      {
        id: 3,
        nome: "Admin SauDInoB",
        email: "admin@saudinob.pt",
        password: "admin123",
        role: "administrador",
        ativo: true,
        telefone: "910000003",
        morada: "Backoffice"
      },
      {
        id: 4,
        nome: "Manuel Costa",
        email: "manuel@saudinob.pt",
        password: "utente123",
        role: "utente",
        ativo: true,
        telefone: "910000004",
        morada: "Avenida Central, Braga"
      }
    ],
    utentes: [
      {
        id: 1,
        userId: 1,
        medicoId: 1,
        numeroProcesso: "UT-2026-001",
        dataNascimento: "2002-06-12",
        profissao: "Estudante",
        estadoCivil: "Solteira",
        diagnosticos: ["Asma alergica", "Rinite alergica"],
        notasClinicas: "Utente em monitorizacao remota por sintomas respiratorios sazonais."
      },
      {
        id: 2,
        userId: 4,
        medicoId: 1,
        numeroProcesso: "UT-2026-002",
        dataNascimento: "1988-11-03",
        profissao: "Professor",
        estadoCivil: "Casado",
        diagnosticos: ["Asma persistente"],
        notasClinicas: "Historico de agravamento em periodos de frio."
      }
    ],
    medicos: [
      {
        id: 1,
        userId: 2,
        cedula: "OM-48291",
        especialidade: "Imunoalergologia",
        unidade: "Clinica SauDInoB"
      }
    ],
    administradores: [
      {
        id: 1,
        userId: 3,
        permissao: "GESTAO_TOTAL"
      }
    ],
    sessions: [],
    configuracao: {
      id: 1,
      limiarControloInsuficiente: 20,
      variacaoDeterioracao: 4,
      atualizadoEm: iso(2),
      atualizadoPor: 3
    },
    caratAvaliacoes: [
      {
        id: 1,
        utenteId: 1,
        medicoId: 1,
        respostas: [2, 2, 2, 3, 2, 2, 2, 2, 2, 2],
        scoreTotal: 21,
        scoreSuperior: 9,
        scoreInferior: 12,
        interpretacao: "Parcialmente controlado",
        recomendacoes: [
          "Manter adesao terapeutica e registar sintomas.",
          "Rever exposicao a alergeneos se os sintomas persistirem."
        ],
        sintomas: ["espirros", "tosse ocasional"],
        data: iso(18)
      },
      {
        id: 2,
        utenteId: 1,
        medicoId: 1,
        respostas: [1, 1, 2, 2, 1, 1, 1, 2, 1, 1],
        scoreTotal: 13,
        scoreSuperior: 6,
        scoreInferior: 7,
        interpretacao: "Nao controlado",
        recomendacoes: [
          "Contactar a equipa clinica se houver falta de ar, pieira intensa ou agravamento rapido.",
          "Rever plano terapeutico com o medico responsavel.",
          "Evitar fatores desencadeantes conhecidos e registar sintomas diariamente."
        ],
        sintomas: ["falta de ar", "pieira", "aperto no peito"],
        data: iso(4)
      },
      {
        id: 3,
        utenteId: 2,
        medicoId: 1,
        respostas: [3, 3, 2, 3, 3, 2, 3, 3, 2, 3],
        scoreTotal: 27,
        scoreSuperior: 11,
        scoreInferior: 16,
        interpretacao: "Controlado",
        recomendacoes: [
          "Manter plano de autocuidado atual.",
          "Repetir avaliacao CARAT dentro do intervalo definido pela equipa clinica."
        ],
        sintomas: ["sem sintomas relevantes"],
        data: iso(7)
      }
    ],
        sintomas: [
      {
        id: 1,
        utenteId: 1,
        avaliacaoId: 2,
        nome: "Falta de ar",
        intensidade: "Intensa",
        dataInicio: iso(5),
        dataFim: null,
        observacoes: "Mais evidente ao subir escadas.",
        criadoEm: iso(5)
      },
      {
        id: 2,
        utenteId: 1,
        avaliacaoId: 2,
        nome: "Pieira",
        intensidade: "Moderada",
        dataInicio: iso(4),
        dataFim: null,
        observacoes: "Agravamento durante a noite.",
        criadoEm: iso(4)
      },
      {
        id: 3,
        utenteId: 2,
        avaliacaoId: 3,
        nome: "Tosse ocasional",
        intensidade: "Ligeira",
        dataInicio: iso(8),
        dataFim: iso(6),
        observacoes: "Resolvida sem necessidade de contacto clinico.",
        criadoEm: iso(8)
      }
    ],
    alertas: [
      {
        id: 1,
        utenteId: 1,
        medicoId: 1,
        avaliacaoId: 2,
        prioridade: "Alta",
        motivo: "Score CARAT abaixo do limiar e deterioracao face a avaliacao anterior.",
        estado: "NOVO",
        criadoEm: iso(4),
        fechadoEm: null,
        configSnapshot: {
          limiarControloInsuficiente: 20,
          variacaoDeterioracao: 4
        },
        acoes: []
      }
    ],
    medicacoes: [
      {
        id: 1,
        utenteId: 1,
        medicoId: 1,
        nome: "Corticosteroide inalado",
        dose: "1 inalacao de 12/12h",
        estado: "Ativa",
        criadoEm: iso(10)
      },
      {
        id: 2,
        utenteId: 2,
        medicoId: 1,
        nome: "Broncodilatador SOS",
        dose: "Segundo plano clinico",
        estado: "Ativa",
        criadoEm: iso(20)
      }
    ],
    exames: [
      {
        id: 1,
        utenteId: 1,
        medicoId: 1,
        nome: "Espirometria",
        codigo: "ESP1",
        estado: "Prescrito",
        resultado: "",
        criadoEm: iso(3)
      },
      {
        id: 2,
        utenteId: 2,
        medicoId: 1,
        nome: "Prova de broncodilatacao",
        codigo: "PBD1",
        estado: "Realizado",
        resultado: "Sem agravamento relevante.",
        criadoEm: iso(14)
      }
    ],
    auditoria: [
      {
        id: 1,
        atorId: 3,
        acao: "SEED_INICIAL",
        detalhe: "Dados iniciais gerados para demonstracao da aplicacao.",
        data: iso(0)
      }
    ],
    fhirExports: []
  };
}

module.exports = { seedData };