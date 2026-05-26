const clinicoService = require("../services/clinico.service");
const { sendJson } = require("../utils/http");
const { requireAuth } = require("../utils/authGuard");

class ClinicoController {
  listarMedicacoes(req, res) {
    requireAuth(req, ["utente", "medico", "administrador"]);
    sendJson(res, 200, clinicoService.listarMedicacoes(req.query));
  }

  criarMedicacao(req, res) {
    requireAuth(req, ["medico", "administrador"]);
    sendJson(res, 201, clinicoService.criarMedicacao(req.body));
  }

  listarExames(req, res) {
    requireAuth(req, ["utente", "medico", "administrador"]);
    sendJson(res, 200, clinicoService.listarExames(req.query));
  }

  criarExame(req, res) {
    requireAuth(req, ["medico", "administrador"]);
    sendJson(res, 201, clinicoService.criarExame(req.body));
  }
}

module.exports = new ClinicoController();
