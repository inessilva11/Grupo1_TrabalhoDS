const authController = require("../controllers/auth.controller");

function authRoutes(router) {
  router.post("/api/auth/login", authController.login.bind(authController));
  router.get("/api/auth/me", authController.me.bind(authController));
  router.post("/api/auth/logout", authController.logout.bind(authController));
  router.get("/api/auth/users", authController.listarUtilizadores.bind(authController));
  router.get("/api/auth/users/:id", authController.obterUtilizador.bind(authController));
}

module.exports = authRoutes;
