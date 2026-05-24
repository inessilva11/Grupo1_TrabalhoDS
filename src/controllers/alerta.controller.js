const alertaService = require("../services/alerta.service");
const { sendJson } = require("../utils/http");
const { requireAuth } = require("../utils/authGuard");

class AlertaController {
  listar(req, res) {
    requireAuth(req, ["utente", "medico", "administrador"]);
    sendJson(res, 200, alertaService.listar(req.query));
  }

  atualizar(req, res) {
    requireAuth(req, ["medico", "administrador"]);
    sendJson(res, 200, alertaService.atualizarEstado(req.params.id, req.body));
  }
}

module.exports = new AlertaController();
