const store = require("../database/jsonStore");

class AdminService {
  obterConfiguracao() {
    return store.read().configuracao;
  }

  atualizarConfiguracao(payload) {
    const data = store.read();
    const limiar = Number(payload.limiarControloInsuficiente);
    const variacao = Number(payload.variacaoDeterioracao);

    if (!Number.isFinite(limiar) || limiar < 0 || limiar > 30) {
      const error = new Error("O limiar de controlo deve estar entre 0 e 30.");
      error.statusCode = 400;
      throw error;
    }
    if (!Number.isFinite(variacao) || variacao < 1 || variacao > 30) {
      const error = new Error("A variacao de deterioracao deve estar entre 1 e 30.");
      error.statusCode = 400;
      throw error;
    }

    data.configuracao = {
      ...data.configuracao,
      limiarControloInsuficiente: limiar,
      variacaoDeterioracao: variacao,
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: payload.atorId ? Number(payload.atorId) : null
    };

    store.write(data);
    store.addAudit(payload.atorId, "ATUALIZAR_CONFIGURACAO", `Limiar ${limiar}; deterioracao ${variacao}.`);
    return store.read().configuracao;
  }

  listarAuditoria() {
    return store.read().auditoria.sort((a, b) => new Date(b.data) - new Date(a.data));
  }

  resetDados() {
    const data = store.reset();
    return {
      mensagem: "Base JSON reposta com dados simulados.",
      totais: {
        users: data.users.length,
        utentes: data.utentes.length,
        medicos: data.medicos.length,
        avaliacoes: data.caratAvaliacoes.length,
        alertas: data.alertas.length
      }
    };
  }
}

module.exports = new AdminService();