const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/saudinob.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Base de dados ligada com sucesso.');
    }
});

module.exports = db;
