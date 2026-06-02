const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { seedData } = require("./seed");

class SqliteStore {
  constructor(filePath = path.join(__dirname, "..", "..", "data", "saudinob.sqlite")) {
    this.filePath = filePath;
    this.ensureDatabase();
  }

  ensureDatabase() {
    const folder = path.dirname(this.filePath);
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    if (!this.db) {
      this.db = new DatabaseSync(this.filePath);
      this.db.exec("PRAGMA foreign_keys = ON");
      this.ensureSchema();
      this.ensureColumns();
      this.seedIfEmpty();
    }
  }

  ensureSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        ativo INTEGER NOT NULL DEFAULT 1,
        telefone TEXT,
        morada TEXT
      );

      CREATE TABLE IF NOT EXISTS medicos (
        id INTEGER PRIMARY KEY,
        userId INTEGER NOT NULL UNIQUE,
        cedula TEXT,
        especialidade TEXT NOT NULL,
        unidade TEXT,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS utentes (
        id INTEGER PRIMARY KEY,
        userId INTEGER NOT NULL UNIQUE,
        medicoId INTEGER NOT NULL,
        numeroProcesso TEXT NOT NULL UNIQUE,
        dataNascimento TEXT,
        profissao TEXT,
        estadoCivil TEXT,
        diagnosticos TEXT NOT NULL DEFAULT '[]',
        notasClinicas TEXT,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (medicoId) REFERENCES medicos(id)
      );

      CREATE TABLE IF NOT EXISTS administradores (
        id INTEGER PRIMARY KEY,
        userId INTEGER NOT NULL UNIQUE,
        permissao TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS configuracao (
        id INTEGER PRIMARY KEY,
        limiarControloInsuficiente REAL NOT NULL,
        variacaoDeterioracao REAL NOT NULL,
        atualizadoEm TEXT NOT NULL,
        atualizadoPor INTEGER
      );

      CREATE TABLE IF NOT EXISTS caratAvaliacoes (
        id INTEGER PRIMARY KEY,
        utenteId INTEGER NOT NULL,
        medicoId INTEGER NOT NULL,
        respostas TEXT NOT NULL,
        scoreTotal INTEGER NOT NULL,
        scoreSuperior INTEGER NOT NULL,
        scoreInferior INTEGER NOT NULL,
        interpretacao TEXT NOT NULL,
        recomendacoes TEXT NOT NULL,
        sintomas TEXT NOT NULL DEFAULT '[]',
        comentarios TEXT NOT NULL DEFAULT '',
        data TEXT NOT NULL,
        FOREIGN KEY (utenteId) REFERENCES utentes(id) ON DELETE CASCADE,
        FOREIGN KEY (medicoId) REFERENCES medicos(id)
      );

      CREATE TABLE IF NOT EXISTS alertas (
        id INTEGER PRIMARY KEY,
        utenteId INTEGER NOT NULL,
        medicoId INTEGER NOT NULL,
        avaliacaoId INTEGER,
        prioridade TEXT NOT NULL,
        motivo TEXT NOT NULL,
        estado TEXT NOT NULL,
        criadoEm TEXT NOT NULL,
        fechadoEm TEXT,
        configSnapshot TEXT NOT NULL,
        acoes TEXT NOT NULL DEFAULT '[]',
        FOREIGN KEY (utenteId) REFERENCES utentes(id) ON DELETE CASCADE,
        FOREIGN KEY (medicoId) REFERENCES medicos(id),
        FOREIGN KEY (avaliacaoId) REFERENCES caratAvaliacoes(id)
      );

      CREATE TABLE IF NOT EXISTS medicacoes (
        id INTEGER PRIMARY KEY,
        utenteId INTEGER NOT NULL,
        medicoId INTEGER NOT NULL,
        nome TEXT NOT NULL,
        dose TEXT,
        estado TEXT NOT NULL,
        criadoEm TEXT NOT NULL,
        FOREIGN KEY (utenteId) REFERENCES utentes(id) ON DELETE CASCADE,
        FOREIGN KEY (medicoId) REFERENCES medicos(id)
      );

      CREATE TABLE IF NOT EXISTS exames (
        id INTEGER PRIMARY KEY,
        utenteId INTEGER NOT NULL,
        medicoId INTEGER NOT NULL,
        nome TEXT NOT NULL,
        codigo TEXT NOT NULL,
        estado TEXT NOT NULL,
        resultado TEXT,
        criadoEm TEXT NOT NULL,
        FOREIGN KEY (utenteId) REFERENCES utentes(id) ON DELETE CASCADE,
        FOREIGN KEY (medicoId) REFERENCES medicos(id)
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        userId INTEGER NOT NULL,
        role TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS auditoria (
        id INTEGER PRIMARY KEY,
        atorId INTEGER,
        acao TEXT NOT NULL,
        detalhe TEXT NOT NULL,
        data TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS fhirExports (
        id INTEGER PRIMARY KEY,
        utenteId INTEGER NOT NULL,
        resourceTypes TEXT NOT NULL,
        exportedAt TEXT NOT NULL,
        FOREIGN KEY (utenteId) REFERENCES utentes(id) ON DELETE CASCADE
      );
    `);
  }

  ensureColumns() {
    this.ensureColumn("caratAvaliacoes", "comentarios", "TEXT NOT NULL DEFAULT ''");
  }

  ensureColumn(table, column, definition) {
    const columns = this.db.prepare(`PRAGMA table_info(${table})`).all();
    if (!columns.some((item) => item.name === column)) {
      this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }

  seedIfEmpty() {
    const row = this.db.prepare("SELECT COUNT(*) AS total FROM users").get();
    if (row.total === 0) {
      this.write(this.loadInitialData());
    }
  }

  loadInitialData() {
    const legacyPath = path.join(__dirname, "..", "..", "data", "db.json");
    if (fs.existsSync(legacyPath)) {
      try {
        return JSON.parse(fs.readFileSync(legacyPath, "utf8"));
      } catch (error) {
        return seedData();
      }
    }
    return seedData();
  }

  read() {
    this.ensureDatabase();
    const data = {
      meta: this.readMeta(),
      users: this.db.prepare("SELECT * FROM users ORDER BY id").all().map((row) => ({
        ...row,
        ativo: Boolean(row.ativo)
      })),
      utentes: this.db.prepare("SELECT * FROM utentes ORDER BY id").all().map((row) => ({
        ...row,
        diagnosticos: this.parseJson(row.diagnosticos, [])
      })),
      medicos: this.db.prepare("SELECT * FROM medicos ORDER BY id").all(),
      administradores: this.db.prepare("SELECT * FROM administradores ORDER BY id").all(),
      configuracao: this.db.prepare("SELECT * FROM configuracao ORDER BY id LIMIT 1").get() || seedData().configuracao,
      caratAvaliacoes: this.db.prepare("SELECT * FROM caratAvaliacoes ORDER BY id").all().map((row) => ({
        ...row,
        respostas: this.parseJson(row.respostas, []),
        recomendacoes: this.parseJson(row.recomendacoes, []),
        sintomas: this.parseJson(row.sintomas, []),
        comentarios: row.comentarios || ""
      })),
      alertas: this.db.prepare("SELECT * FROM alertas ORDER BY id").all().map((row) => ({
        ...row,
        configSnapshot: this.parseJson(row.configSnapshot, {}),
        acoes: this.parseJson(row.acoes, [])
      })),
      medicacoes: this.db.prepare("SELECT * FROM medicacoes ORDER BY id").all(),
      exames: this.db.prepare("SELECT * FROM exames ORDER BY id").all(),
      auditoria: this.db.prepare("SELECT * FROM auditoria ORDER BY id").all(),
      sessions: this.db.prepare("SELECT * FROM sessions ORDER BY id").all(),
      fhirExports: this.db.prepare("SELECT * FROM fhirExports ORDER BY id").all().map((row) => ({
        ...row,
        resourceTypes: this.parseJson(row.resourceTypes, [])
      }))
    };

    return this.normalizeSchema(data).data;
  }

  write(data) {
    this.ensureDatabase();
    const normalized = this.normalizeSchema(data).data;
    this.db.exec("BEGIN");
    try {
      this.clearTables();
      this.insertMeta(normalized.meta);
      normalized.users.forEach((item) => this.insertUser(item));
      normalized.medicos.forEach((item) => this.insertMedico(item));
      normalized.utentes.forEach((item) => this.insertUtente(item));
      normalized.administradores.forEach((item) => this.insertAdministrador(item));
      this.insertConfiguracao(normalized.configuracao);
      normalized.caratAvaliacoes.forEach((item) => this.insertCaratAvaliacao(item));
      normalized.alertas.forEach((item) => this.insertAlerta(item));
      normalized.medicacoes.forEach((item) => this.insertMedicacao(item));
      normalized.exames.forEach((item) => this.insertExame(item));
      normalized.sessions.forEach((item) => this.insertSession(item));
      normalized.auditoria.forEach((item) => this.insertAuditoria(item));
      normalized.fhirExports.forEach((item) => this.insertFhirExport(item));
      this.db.exec("COMMIT");
      return normalized;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  reset() {
    return this.write(seedData());
  }

  nextId(collectionName) {
    const table = this.tableName(collectionName);
    const row = this.db.prepare(`SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM ${table}`).get();
    return row.nextId;
  }

  addAudit(atorId, acao, detalhe) {
    const entry = {
      id: this.nextId("auditoria"),
      atorId: atorId ? Number(atorId) : null,
      acao,
      detalhe,
      data: new Date().toISOString()
    };
    this.insertAuditoria(entry);
    return entry;
  }

  readMeta() {
    const rows = this.db.prepare("SELECT key, value FROM meta").all();
    return rows.reduce((acc, row) => {
      acc[row.key] = this.parseJson(row.value, row.value);
      return acc;
    }, {});
  }

  clearTables() {
    [
      "fhirExports",
      "sessions",
      "auditoria",
      "exames",
      "medicacoes",
      "alertas",
      "caratAvaliacoes",
      "configuracao",
      "administradores",
      "utentes",
      "medicos",
      "users",
      "meta"
    ].forEach((table) => this.db.prepare(`DELETE FROM ${table}`).run());
  }

  insertMeta(meta = {}) {
    const stmt = this.db.prepare("INSERT INTO meta (key, value) VALUES (?, ?)");
    Object.entries(meta).forEach(([key, value]) => stmt.run(key, JSON.stringify(value)));
  }

  insertUser(item) {
    this.db
      .prepare("INSERT INTO users (id, nome, email, password, role, ativo, telefone, morada) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(item.id, item.nome, item.email, item.password, item.role, item.ativo ? 1 : 0, item.telefone || "", item.morada || "");
  }

  insertUtente(item) {
    this.db
      .prepare(`INSERT INTO utentes
        (id, userId, medicoId, numeroProcesso, dataNascimento, profissao, estadoCivil, diagnosticos, notasClinicas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        item.id,
        item.userId,
        item.medicoId,
        item.numeroProcesso,
        item.dataNascimento || "",
        item.profissao || "",
        item.estadoCivil || "",
        JSON.stringify(item.diagnosticos || []),
        item.notasClinicas || ""
      );
  }

  insertMedico(item) {
    this.db
      .prepare("INSERT INTO medicos (id, userId, cedula, especialidade, unidade) VALUES (?, ?, ?, ?, ?)")
      .run(item.id, item.userId, item.cedula || "", item.especialidade, item.unidade || "");
  }

  insertAdministrador(item) {
    this.db
      .prepare("INSERT INTO administradores (id, userId, permissao) VALUES (?, ?, ?)")
      .run(item.id, item.userId, item.permissao);
  }

  insertConfiguracao(item) {
    this.db
      .prepare(`INSERT INTO configuracao
        (id, limiarControloInsuficiente, variacaoDeterioracao, atualizadoEm, atualizadoPor)
        VALUES (?, ?, ?, ?, ?)`)
      .run(item.id, item.limiarControloInsuficiente, item.variacaoDeterioracao, item.atualizadoEm, item.atualizadoPor || null);
  }

  insertCaratAvaliacao(item) {
    this.db
      .prepare(`INSERT INTO caratAvaliacoes
        (id, utenteId, medicoId, respostas, scoreTotal, scoreSuperior, scoreInferior, interpretacao, recomendacoes, sintomas, comentarios, data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        item.id,
        item.utenteId,
        item.medicoId,
        JSON.stringify(item.respostas || []),
        item.scoreTotal,
        item.scoreSuperior,
        item.scoreInferior,
        item.interpretacao,
        JSON.stringify(item.recomendacoes || []),
        JSON.stringify(item.sintomas || []),
        item.comentarios || "",
        item.data
      );
  }

  insertAlerta(item) {
    this.db
      .prepare(`INSERT INTO alertas
        (id, utenteId, medicoId, avaliacaoId, prioridade, motivo, estado, criadoEm, fechadoEm, configSnapshot, acoes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        item.id,
        item.utenteId,
        item.medicoId,
        item.avaliacaoId || null,
        item.prioridade,
        item.motivo,
        item.estado,
        item.criadoEm,
        item.fechadoEm || null,
        JSON.stringify(item.configSnapshot || {}),
        JSON.stringify(item.acoes || [])
      );
  }

  insertMedicacao(item) {
    this.db
      .prepare("INSERT INTO medicacoes (id, utenteId, medicoId, nome, dose, estado, criadoEm) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(item.id, item.utenteId, item.medicoId, item.nome, item.dose || "", item.estado, item.criadoEm);
  }

  insertExame(item) {
    this.db
      .prepare("INSERT INTO exames (id, utenteId, medicoId, nome, codigo, estado, resultado, criadoEm) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(item.id, item.utenteId, item.medicoId, item.nome, item.codigo, item.estado, item.resultado || "", item.criadoEm);
  }

  insertSession(item) {
    this.db
      .prepare("INSERT INTO sessions (id, token, userId, role, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?)")
      .run(item.id, item.token, item.userId, item.role, item.createdAt, item.expiresAt);
  }

  insertAuditoria(item) {
    this.db
      .prepare("INSERT INTO auditoria (id, atorId, acao, detalhe, data) VALUES (?, ?, ?, ?, ?)")
      .run(item.id, item.atorId || null, item.acao, item.detalhe, item.data);
  }

  insertFhirExport(item) {
    this.db
      .prepare("INSERT INTO fhirExports (id, utenteId, resourceTypes, exportedAt) VALUES (?, ?, ?, ?)")
      .run(item.id, item.utenteId, JSON.stringify(item.resourceTypes || []), item.exportedAt);
  }

  normalizeSchema(data) {
    const defaults = seedData();
    Object.keys(defaults).forEach((key) => {
      if (data[key] === undefined) {
        data[key] = Array.isArray(defaults[key]) ? [] : defaults[key];
      }
    });
    if (!data.meta || typeof data.meta !== "object") {
      data.meta = defaults.meta;
    }
    if (!data.configuracao) {
      data.configuracao = defaults.configuracao;
    }
    return { data, changed: false };
  }

  parseJson(value, fallback) {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  tableName(collectionName) {
    const allowed = new Set([
      "users",
      "utentes",
      "medicos",
      "administradores",
      "caratAvaliacoes",
      "alertas",
      "medicacoes",
      "exames",
      "sessions",
      "auditoria",
      "fhirExports"
    ]);
    if (!allowed.has(collectionName)) {
      const error = new Error(`Colecao SQLite desconhecida: ${collectionName}`);
      error.statusCode = 500;
      throw error;
    }
    return collectionName;
  }
}

module.exports = new SqliteStore();
