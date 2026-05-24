const caratService = require("../services/carat.service");
const { sendJson } = require("../utils/http");
const { requireAuth } = require("../utils/authGuard");

class CaratController {
  questionario(req, res) {
    sendJson(res, 200, caratService.obterQuestionario());
  }

  listarAvaliacoes(req, res) {
    requireAuth(req, ["utente", "medico", "administrador"]);
    sendJson(res, 200, caratService.listarAvaliacoes(req.query));
  }

  criarAvaliacao(req, res) {
    requireAuth(req, ["utente", "medico", "administrador"]);
    sendJson(res, 201, caratService.criarAvaliacao(req.body));
  }
}

module.exports = new CaratController();
