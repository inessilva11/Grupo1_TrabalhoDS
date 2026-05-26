const dashboardController = require("../controllers/dashboard.controller");

function dashboardRoutes(router) {
  router.get("/api/dashboard/utente/:id", dashboardController.utente.bind(dashboardController));
  router.get("/api/dashboard/medico/:id", dashboardController.medico.bind(dashboardController));
  router.get("/api/dashboard/admin", dashboardController.admin.bind(dashboardController));
}

module.exports = dashboardRoutes;