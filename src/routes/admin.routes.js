const adminController = require("../controllers/admin.controller");

function adminRoutes(router) {
  router.get("/api/admin/configuracao", adminController.obterConfiguracao.bind(adminController));
  router.patch("/api/admin/configuracao", adminController.atualizarConfiguracao.bind(adminController));
  router.get("/api/admin/auditoria", adminController.auditoria.bind(adminController));
  router.post("/api/admin/seed", adminController.resetDados.bind(adminController));
}

module.exports = adminRoutes;
