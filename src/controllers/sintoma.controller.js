const sintomaService = require("../services/sintoma.service");
const { sendJson } = require("../utils/http");
const { requireAuth } = require("../utils/authGuard");

class SintomaController {
  listar(req, res) {
    requireAuth(req, ["utente", "medico", "administrador"]);
    sendJson(res, 200, sintomaService.listar(req.query));
  }

  criar(req, res) {
    requireAuth(req, ["utente", "medico", "administrador"]);
    sendJson(res, 201, sintomaService.criar(req.body));
  }

  atualizar(req, res) {
    requireAuth(req, ["utente", "medico", "administrador"]);
    sendJson(res, 200, sintomaService.atualizar(req.params.id, req.body));
  }
}

module.exports = new SintomaController();
