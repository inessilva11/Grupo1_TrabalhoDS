const express = require("express");
const path = require("path");
const { sendJson, sendError } = require("./utils/http");

const authRoutes = require("./routes/auth.routes");
const utenteRoutes = require("./routes/utente.routes");
const medicoRoutes = require("./routes/medico.routes");
const caratRoutes = require("./routes/carat.routes");
const alertaRoutes = require("./routes/alerta.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const clinicoRoutes = require("./routes/clinico.routes");
const adminRoutes = require("./routes/admin.routes");
const fhirRoutes = require("./routes/fhir.routes");

const app = express();
const apiRouter = express.Router();

app.use(express.json({ limit: "1mb" }));
const publicDir = path.join(__dirname, "..", "/public");
app.use(express.static(publicDir));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((req, res, next) => {
  res.set({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS"
  });

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});


[
  authRoutes,
  utenteRoutes,
  medicoRoutes,
  caratRoutes,
  alertaRoutes,
  dashboardRoutes,
  clinicoRoutes,
  adminRoutes,
  fhirRoutes
].forEach((register) => register(apiRouter));

apiRouter.get("/api/health", (req, res) => {
  sendJson(res, 200, {
    status: "ok",
    app: "SauDInoB",
    arquitetura: "Express + MVC + Service + SQLite"
  });
});

app.use(apiRouter);

app.use("/api", (req, res) => {
  sendError(res, 404, "Endpoint nao encontrado.");
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  sendError(res, error.statusCode || 500, error.message || "Erro interno.");
});

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`SauDInoB Express MVC a correr em http://localhost:${port}`);
  });
}

module.exports = app;
