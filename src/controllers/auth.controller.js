const authService = require("../services/auth.service");
const { sendJson } = require("../utils/http");
const { requireAuth } = require("../utils/authGuard");

class AuthController {
  login(req, res) {
    const result = authService.login(req.body);
    sendJson(res, 200, result);
  }

  listarUtilizadores(req, res) {
    requireAuth(req, ["administrador"]);
    sendJson(res, 200, authService.listUsers());
  }

  obterUtilizador(req, res) {
    requireAuth(req, ["administrador"]);
    sendJson(res, 200, authService.getUserById(req.params.id));
  }

  me(req, res) {
    sendJson(res, 200, authService.authenticateRequest(req));
  }

  logout(req, res) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : req.headers["x-session-token"];
    sendJson(res, 200, authService.logout(token));
  }
}

module.exports = new AuthController();