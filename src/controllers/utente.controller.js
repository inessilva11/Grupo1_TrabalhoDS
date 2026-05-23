const utenteService = require("../services/utente.service");
const { sendJson } = require("../utils/http");
const { requireAuth } = require("../utils/authGuard");

class UtenteController {
  listar(req, res) {
    requireAuth(req, ["medico", "administrador"]);
    sendJson(res, 200, utenteService.listar(req.query));
  }

  obter(req, res) {
    requireAuth(req, ["utente", "medico", "administrador"]);
    sendJson(res, 200, utenteService.obter(req.params.id));
  }

  criar(req, res) {
    requireAuth(req, ["administrador"]);
    sendJson(res, 201, utenteService.criar(req.body));
  }

  atualizar(req, res) {
    requireAuth(req, ["utente", "medico", "administrador"]);
    sendJson(res, 200, utenteService.atualizar(req.params.id, req.body));
  }
}

module.exports = new UtenteController();
