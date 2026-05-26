const clinicoController = require("../controllers/clinico.controller");

function clinicoRoutes(router) {
  router.get("/api/medicacoes", clinicoController.listarMedicacoes.bind(clinicoController));
  router.post("/api/medicacoes", clinicoController.criarMedicacao.bind(clinicoController));
  router.get("/api/exames", clinicoController.listarExames.bind(clinicoController));
  router.post("/api/exames", clinicoController.criarExame.bind(clinicoController));
}

module.exports = clinicoRoutes;
