const db = require('./db');
const bcrypt = require('bcrypt');

async function seed() {
    const password = await bcrypt.hash('admin123', 10);

    db.run(`
        INSERT INTO Utilizador
        (nome, email, contacto, password, tipoUtilizador, sexo, dataNascimento, atividade)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
        'Administrador',
        'admin@saudinob.pt',
        912345678,
        password,
        'Administrador',
        'F',
        '1990-01-01',
        1
    ]);

    db.run(`
        INSERT INTO ConfiguracaoLimiar
        (tipoParametro, valor, descricao)
        VALUES (?, ?, ?)
    `,
    ['CARAT_SCORE', 10, 'Limiar mínimo aceitável']);
}

seed();
