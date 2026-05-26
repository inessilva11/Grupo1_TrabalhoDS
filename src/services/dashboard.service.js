const store = require("../database/jsonStore");
const { publicUser } = require("../models/utilizador.model");

function sortByDateDesc(items, field = "data") {
  return [...items].sort((a, b) => new Date(b[field]) - new Date(a[field]));
}

function patientLabel(data, utente) {
  const user = data.users.find((candidate) => candidate.id === utente.userId);
  return {
    ...utente,
    user: publicUser(user)
  };
}

function latest(items, field = "data") {
  return sortByDateDesc(items, field)[0] || null;
}

class DashboardService {
  utente(utenteId) {
    const data = store.read();
    const utente = data.utentes.find((candidate) => candidate.id === Number(utenteId));
    if (!utente) {
      const error = new Error("Utente nao encontrado.");
      error.statusCode = 404;
      throw error;
    }

    const medico = data.medicos.find((candidate) => candidate.id === utente.medicoId);
    const medicoUser = medico ? data.users.find((candidate) => candidate.id === medico.userId) : null;
    const avaliacoes = sortByDateDesc(data.caratAvaliacoes.filter((avaliacao) => avaliacao.utenteId === utente.id));
    const alertas = sortByDateDesc(
      data.alertas.filter((alerta) => alerta.utenteId === utente.id),
      "criadoEm"
    );
    const medicacoes = sortByDateDesc(
      data.medicacoes.filter((medicacao) => medicacao.utenteId === utente.id),
      "criadoEm"
    );
    const exames = sortByDateDesc(
      data.exames.filter((exame) => exame.utenteId === utente.id),
      "criadoEm"
    );

    return {
      perfil: patientLabel(data, utente),
      medico: medico
        ? {
            ...medico,
            user: publicUser(medicoUser)
          }
        : null,
      resumo: {
        ultimaAvaliacao: avaliacoes[0] || null,
        alertasAtivos: alertas.filter((alerta) => alerta.estado !== "FECHADO").length,
        scoreMedio:
          avaliacoes.length > 0
            ? Math.round(avaliacoes.reduce((sum, item) => sum + item.scoreTotal, 0) / avaliacoes.length)
            : null,
        tendencia:
          avaliacoes.length >= 2 ? avaliacoes[0].scoreTotal - avaliacoes[1].scoreTotal : 0
      },
      avaliacoes,
      alertas,
      medicacoes,
      exames,
      configuracao: data.configuracao
    };
  }

  medico(medicoId) {
    const data = store.read();
    const medico = data.medicos.find((candidate) => candidate.id === Number(medicoId));
    if (!medico) {
      const error = new Error("Medico nao encontrado.");
      error.statusCode = 404;
      throw error;
    }

    const user = data.users.find((candidate) => candidate.id === medico.userId);
    const utentes = data.utentes
      .filter((utente) => utente.medicoId === medico.id)
      .map((utente) => {
        const avaliacoes = data.caratAvaliacoes.filter((avaliacao) => avaliacao.utenteId === utente.id);
        const alertas = data.alertas.filter((alerta) => alerta.utenteId === utente.id);
        return {
          ...patientLabel(data, utente),
          ultimaAvaliacao: latest(avaliacoes),
          alertasAtivos: alertas.filter((alerta) => alerta.estado !== "FECHADO").length
        };
      });

    const alertas = sortByDateDesc(
      data.alertas.filter((alerta) => alerta.medicoId === medico.id),
      "criadoEm"
    );

    return {
      medico: {
        ...medico,
        user: publicUser(user)
      },
      resumo: {
        utentes: utentes.length,
        alertasNovos: alertas.filter((alerta) => alerta.estado === "NOVO").length,
        alertasAtivos: alertas.filter((alerta) => alerta.estado !== "FECHADO").length
      },
      utentes,
      alertas,
      configuracao: data.configuracao
    };
  }

  admin() {
    const data = store.read();
    return {
      resumo: {
        utilizadores: data.users.length,
        utentes: data.utentes.length,
        medicos: data.medicos.length,
        avaliacoes: data.caratAvaliacoes.length,
        alertasAtivos: data.alertas.filter((alerta) => alerta.estado !== "FECHADO").length
      },
      configuracao: data.configuracao,
      auditoria: sortByDateDesc(data.auditoria, "data").slice(0, 20)
    };
  }
}

module.exports = new DashboardService();