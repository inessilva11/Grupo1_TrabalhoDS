const caratController = require("../controllers/carat.controller");

function caratRoutes(router) {
  router.get("/api/carat/questions", caratController.questionario.bind(caratController));
  router.get("/api/carat/avaliacoes", caratController.listarAvaliacoes.bind(caratController));
  router.post("/api/carat/avaliacoes", caratController.criarAvaliacao.bind(caratController));
}

module.exports = caratRoutes;