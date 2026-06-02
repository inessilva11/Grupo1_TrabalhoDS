const store = require("../database/sqliteStore");
const { normalizeEmail, publicUser } = require("../models/utilizador.model");
const { createJwt, verifyJwt } = require("../utils/jwt");

class AuthService {
  login({ email, password }) {
    const data = store.read();
    const user = data.users.find((candidate) => {
      return normalizeEmail(candidate.email) === normalizeEmail(email) && candidate.password === password;
    });

    if (!user || !user.ativo) {
      const error = new Error("Credenciais inválidas ou utilizador inativo.");
      error.statusCode = 401;
      throw error;
    }

    this.removeExpiredSessions(data);
    const sessionId = store.nextId("sessions");
    const jwt = createJwt({
      sub: user.id,
      role: user.role,
      sid: sessionId,
      email: user.email
    });
    const session = {
      id: sessionId,
      token: jwt.token,
      userId: user.id,
      role: user.role,
      createdAt: new Date().toISOString(),
      expiresAt: jwt.expiresAt
    };
    data.sessions.push(session);
    store.write(data);
    store.addAudit(user.id, "LOGIN", `Sessão iniciada por ${user.email}.`);

    return {
      user: publicUser(user),
      profile: this.getProfileForUser(data, user),
      token: session.token,
      tokenType: "Bearer",
      auth: "JWT",
      expiresAt: session.expiresAt
    };
  }

  getProfileForUser(data, user) {
    if (user.role === "utente") {
      return data.utentes.find((utente) => utente.userId === user.id) || null;
    }
    if (user.role === "medico") {
      return data.medicos.find((medico) => medico.userId === user.id) || null;
    }
    if (user.role === "administrador") {
      return data.administradores.find((admin) => admin.userId === user.id) || null;
    }
    return null;
  }

  getUserById(userId) {
    const data = store.read();
    const user = data.users.find((candidate) => candidate.id === Number(userId));
    return publicUser(user);
  }

  listUsers() {
    const data = store.read();
    return data.users.map(publicUser);
  }

  me(token) {
    const data = store.read();
    const session = this.findValidSession(data, token);
    const user = data.users.find((candidate) => candidate.id === session.userId);
    return {
      user: publicUser(user),
      profile: this.getProfileForUser(data, user),
      token: session.token,
      tokenType: "Bearer",
      auth: "JWT",
      expiresAt: session.expiresAt
    };
  }

  logout(token) {
    const data = store.read();
    const before = data.sessions.length;
    data.sessions = data.sessions.filter((session) => session.token !== token);
    store.write(data);
    return { terminado: before !== data.sessions.length };
  }

  authenticateRequest(req) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : req.headers["x-session-token"];
    return this.me(token);
  }

  findValidSession(data, token) {
    if (!token) {
      const error = new Error("Sessão em falta.");
      error.statusCode = 401;
      throw error;
    }

    const payload = verifyJwt(token);
    this.removeExpiredSessions(data);
    const session = data.sessions.find((candidate) => {
      return candidate.token === token && candidate.id === Number(payload.sid) && candidate.userId === Number(payload.sub);
    });
    if (!session) {
      const error = new Error("Sessão inválida ou expirada.");
      error.statusCode = 401;
      throw error;
    }
    return session;
  }

  removeExpiredSessions(data) {
    const now = Date.now();
    const before = data.sessions.length;
    data.sessions = data.sessions.filter((session) => new Date(session.expiresAt).getTime() > now);
    return before !== data.sessions.length;
  }
}

module.exports = new AuthService();