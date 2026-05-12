const express = require('express');
const path = require('path');
const cors = require('cors');
const { initDb } = require('./db/database');

const authRoutes = require('./routes/auth');
const caratRoutes = require('./routes/carat');
const alertsRoutes = require('./routes/alerts');
const patientsRoutes = require('./routes/patients');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializa a base de dados
initDb();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/carat', caratRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/admin', adminRoutes);

// Tratamento de erros consistente (RNF10)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor'
  });
});

app.listen(2006, () => {
  console.log(`SauDInoB a correr em http://localhost:2006`);
  // console.log(`   Para popular a BD: npm run seed`);
});