const sintomaController = require("../controllers/sintoma.controller");

function sintomaRoutes(router) {
  router.get("/api/sintomas", sintomaController.listar.bind(sintomaController));
  router.post("/api/sintomas", sintomaController.criar.bind(sintomaController));
  router.patch("/api/sintomas/:id", sintomaController.atualizar.bind(sintomaController));
}

module.exports = sintomaRoutes;
