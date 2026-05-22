const authService = require("../services/auth.service");

function requireAuth(req, allowedRoles = []) {
  const session = authService.authenticateRequest(req);
  if (allowedRoles.length > 0 && !allowedRoles.includes(session.user.role)) {
    const error = new Error("Sem permissao para aceder a este recurso.");
    error.statusCode = 403;
    throw error;
  }
  req.auth = session;
  return session;
}

module.exports = { requireAuth };
