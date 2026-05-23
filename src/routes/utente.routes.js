const utenteController = require("../controllers/utente.controller");

function utenteRoutes(router) {
  router.get("/api/utentes", utenteController.listar.bind(utenteController));
  router.get("/api/utentes/:id", utenteController.obter.bind(utenteController));
  router.post("/api/utentes", utenteController.criar.bind(utenteController));
  router.patch("/api/utentes/:id", utenteController.atualizar.bind(utenteController));
}

module.exports = utenteRoutes;
