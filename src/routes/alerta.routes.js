const alertaController = require("../controllers/alerta.controller");

function alertaRoutes(router) {
  router.get("/api/alertas", alertaController.listar.bind(alertaController));
  router.patch("/api/alertas/:id", alertaController.atualizar.bind(alertaController));
}

module.exports = alertaRoutes;
