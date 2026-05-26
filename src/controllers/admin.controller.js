const adminService = require("../services/admin.service");
const { sendJson } = require("../utils/http");
const { requireAuth } = require("../utils/authGuard");

class AdminController {
  obterConfiguracao(req, res) {
    requireAuth(req, ["administrador", "medico", "utente"]);
    sendJson(res, 200, adminService.obterConfiguracao());
  }

  atualizarConfiguracao(req, res) {
    requireAuth(req, ["administrador"]);
    sendJson(res, 200, adminService.atualizarConfiguracao(req.body));
  }

  auditoria(req, res) {
    requireAuth(req, ["administrador"]);
    sendJson(res, 200, adminService.listarAuditoria());
  }

  resetDados(req, res) {
    requireAuth(req, ["administrador"]);
    sendJson(res, 200, adminService.resetDados());
  }
}

module.exports = new AdminController();
