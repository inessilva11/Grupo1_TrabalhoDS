const fs = require("fs");
const path = require("path");
const { seedData } = require("./seed");

class JsonStore {
  constructor(filePath = path.join(__dirname, "..", "..", "data", "db.json")) {
    this.filePath = filePath;
    this.ensureDatabase();
  }

  ensureDatabase() {
    const folder = path.dirname(this.filePath);
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    if (!fs.existsSync(this.filePath)) {
      this.write(seedData());
    }
  }

  read() {
    this.ensureDatabase();
    const raw = fs.readFileSync(this.filePath, "utf8");
    const data = JSON.parse(raw);
    const normalized = this.normalizeSchema(data);
    if (normalized.changed) {
      this.write(normalized.data);
    }
    return normalized.data;
  }

  write(data) {
    fs.writeFileSync(this.filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    return data;
  }

  reset() {
    return this.write(seedData());
  }

  nextId(collectionName) {
    const data = this.read();
    const collection = data[collectionName] || [];
    const highest = collection.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
    return highest + 1;
  }

  addAudit(atorId, acao, detalhe) {
    const data = this.read();
    const entry = {
      id: this.nextId("auditoria"),
      atorId: atorId ? Number(atorId) : null,
      acao,
      detalhe,
      data: new Date().toISOString()
    };
    data.auditoria.push(entry);
    this.write(data);
    return entry;
  }

  normalizeSchema(data) {
    let changed = false;
    const defaults = seedData();
    Object.keys(defaults).forEach((key) => {
      if (data[key] === undefined) {
        data[key] = Array.isArray(defaults[key]) ? [] : defaults[key];
        changed = true;
      }
    });

    if (!Array.isArray(data.sessions)) {
      data.sessions = [];
      changed = true;
    }
    if (!Array.isArray(data.fhirExports)) {
      data.fhirExports = [];
      changed = true;
    }

    return { data, changed };
  }
}

module.exports = new JsonStore();
