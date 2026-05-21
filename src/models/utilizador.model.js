const ROLES = {
  UTENTE: "utente",
  MEDICO: "medico",
  ADMINISTRADOR: "administrador"
};

function publicUser(user) {
  if (!user) {
    return null;
  }

  const { password, ...safeUser } = user;
  return safeUser;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

module.exports = {
  ROLES,
  publicUser,
  normalizeEmail
};
