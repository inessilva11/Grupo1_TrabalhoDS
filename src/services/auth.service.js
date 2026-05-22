const store = require("../database/jsonStore");
const crypto = require("crypto");
const { normalizeEmail, publicUser } = require("../models/utilizador.model");

class AuthService {
  login({ email, password }) {
    const data = store.read();
    const user = data.users.find((candidate) => {
      return normalizeEmail(candidate.email) === normalizeEmail(email) && candidate.password === password;
    });

    if (!user || !user.ativo) {
      const error = new Error("Credenciais invalidas ou utilizador inativo.");
      error.statusCode = 401;
      throw error;
    }

    this.removeExpiredSessions(data);
    const session = {
      id: store.nextId("sessions"),
      token: crypto.randomBytes(32).toString("hex"),
      userId: user.id,
      role: user.role,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
    };
    data.sessions.push(session);
    store.write(data);
    store.addAudit(user.id, "LOGIN", `Sessao iniciada por ${user.email}.`);

    return {
      user: publicUser(user),
      profile: this.getProfileForUser(data, user),
      token: session.token,
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
      const error = new Error("Sessao em falta.");
      error.statusCode = 401;
      throw error;
    }

    this.removeExpiredSessions(data);
    const session = data.sessions.find((candidate) => candidate.token === token);
    if (!session) {
      const error = new Error("Sessao invalida ou expirada.");
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