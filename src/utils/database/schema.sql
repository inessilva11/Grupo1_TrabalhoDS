CREATE TABLE Utilizador (
    idUtilizador INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    contacto INTEGER,
    password TEXT NOT NULL,
    tipoUtilizador TEXT,
    sexo TEXT,
    dataNascimento TEXT,
    atividade INTEGER
);

CREATE TABLE Administrador (
    idAdministrador INTEGER PRIMARY KEY,
    FOREIGN KEY(idAdministrador) REFERENCES Utilizador(idUtilizador)
);

CREATE TABLE Medico (
    idMedico INTEGER PRIMARY KEY,
    cedulaProfissional TEXT,
    especialidade TEXT,
    FOREIGN KEY(idMedico) REFERENCES Utilizador(idUtilizador)
);

CREATE TABLE Utente (
    idUtente INTEGER PRIMARY KEY,
    medicoAtribuido INTEGER,
    morada TEXT,
    profissao TEXT,
    estadoCivil TEXT,
    observacoesClinicas TEXT,
    FOREIGN KEY(idUtente) REFERENCES Utilizador(idUtilizador),
    FOREIGN KEY(medicoAtribuido) REFERENCES Medico(idMedico)
);

CREATE TABLE AvaliacaoCARAT (
    idAvaliacaoCarat INTEGER PRIMARY KEY AUTOINCREMENT,
    utente INTEGER,
    data TEXT,
    scoreTotal INTEGER,
    nivelControlo TEXT,
    recomendacoes TEXT,
    respostas TEXT,
    FOREIGN KEY(utente) REFERENCES Utente(idUtente)
);

CREATE TABLE ConfiguracaoLimiar (
    idConfig INTEGER PRIMARY KEY AUTOINCREMENT,
    tipoParametro TEXT,
    valor REAL,
    descricao TEXT
);

CREATE TABLE Alerta (
    idAlerta INTEGER PRIMARY KEY AUTOINCREMENT,
    utente INTEGER,
    medico INTEGER,
    avaliacao INTEGER,
    idConfig INTEGER,
    dataInicio TEXT,
    dataFim TEXT,
    acoesTomadas TEXT,
    motivo TEXT,
    estado TEXT,
    prioridade TEXT,
    FOREIGN KEY(utente) REFERENCES Utente(idUtente),
    FOREIGN KEY(medico) REFERENCES Medico(idMedico),
    FOREIGN KEY(avaliacao) REFERENCES AvaliacaoCARAT(idAvaliacaoCarat),
    FOREIGN KEY(idConfig) REFERENCES ConfiguracaoLimiar(idConfig)
);

CREATE TABLE AuditLog (
    idLog INTEGER PRIMARY KEY AUTOINCREMENT,
    entidade TEXT,
    idEntidade INTEGER,
    acao TEXT,
    autor TEXT,
    timestamp TEXT
);
