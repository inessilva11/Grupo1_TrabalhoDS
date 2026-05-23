const medicoService = require("../services/medico.service");
const { sendJson } = require("../utils/http");
const { requireAuth } = require("../utils/authGuard");

class MedicoController {
  listar(req, res) {
    requireAuth(req, ["administrador"]);
    sendJson(res, 200, medicoService.listar());
  }

  obter(req, res) {
    requireAuth(req, ["medico", "administrador"]);
    sendJson(res, 200, medicoService.obter(req.params.id));
  }

  criar(req, res) {
    requireAuth(req, ["administrador"]);
    sendJson(res, 201, medicoService.criar(req.body));
  }

  atualizar(req, res) {
    requireAuth(req, ["medico", "administrador"]);
    sendJson(res, 200, medicoService.atualizar(req.params.id, req.body));
  }
}

module.exports = new MedicoController();
