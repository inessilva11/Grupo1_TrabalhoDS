const fhirService = require("../services/fhir.service");
const { requireAuth } = require("../utils/authGuard");

function fhirRoutes(router) {
  router.get("/api/fhir/observations", (req, res) => {
    requireAuth(req, ["utente", "medico", "administrador"]);

    const code = typeof req.query.code === "string" ? req.query.code : "CARAT-TOTAL";
    const patient = typeof req.query.patient === "string" ? req.query.patient : undefined;

    res.json(fhirService.getObservations(code, patient));
  });

  router.get("/api/fhir/observations/:id", (req, res) => {
    requireAuth(req, ["utente", "medico", "administrador"]);
    res.json(fhirService.getObservation(req.params.id));
  });
}

module.exports = fhirRoutes;