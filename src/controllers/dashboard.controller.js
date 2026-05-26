const dashboardService = require("../services/dashboard.service");
const { sendJson } = require("../utils/http");
const { requireAuth } = require("../utils/authGuard");

class DashboardController {
  utente(req, res) {
    requireAuth(req, ["utente", "medico", "administrador"]);
    sendJson(res, 200, dashboardService.utente(req.params.id));
  }

  medico(req, res) {
    requireAuth(req, ["medico", "administrador"]);
    sendJson(res, 200, dashboardService.medico(req.params.id));
  }

  admin(req, res) {
    requireAuth(req, ["administrador"]);
    sendJson(res, 200, dashboardService.admin());
  }
}

module.exports = new DashboardController();
