const medicoController = require("../controllers/medico.controller");

function medicoRoutes(router) {
  router.get("/api/medicos", medicoController.listar.bind(medicoController));
  router.get("/api/medicos/:id", medicoController.obter.bind(medicoController));
  router.post("/api/medicos", medicoController.criar.bind(medicoController));
  router.patch("/api/medicos/:id", medicoController.atualizar.bind(medicoController));
}

module.exports = medicoRoutes;
