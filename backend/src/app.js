const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const solicitudesRoutes = require('./routes/solicitudesRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/admin', adminRoutes);

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    sistema: 'TicoTech HR Portal API',
    version: '1.0.0',
    pais: 'Costa Rica',
    timestamp: new Date().toISOString(),
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error no controlado en Express:', err);
  res.status(500).json({
    error: 'Error interno en el servidor de TicoTech',
    mensaje: err.message,
  });
});

module.exports = app;
