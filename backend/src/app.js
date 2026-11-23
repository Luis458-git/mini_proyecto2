const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const solicitudesRoutes = require('./routes/solicitudesRoutes');
const adminRoutes = require('./routes/adminRoutes');
const {
  generateCsrfToken,
  CSRF_COOKIE_OPTIONS,
  verifyCsrfToken,
} = require('./middleware/csrfMiddleware');

const app = express();

// 1. Configuración de Helmet y Content-Security-Policy (CSP)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: [
          "'self'",
          process.env.FRONTEND_URL || 'http://localhost:5173',
          'http://127.0.0.1:5173',
        ],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Configuración estricta de CORS
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = [frontendOrigin, 'http://127.0.0.1:5173'];

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (curl, Postman, server-to-server) o del frontend autorizado
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Bloqueado por política de CORS: origen no permitido.'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
};
app.use(cors(corsOptions));

// 3. Middlewares de parsing y cookies
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 4. Endpoint público para entrega de token anti-CSRF
app.get('/api/csrf-token', (req, res) => {
  const csrfToken = generateCsrfToken();
  res.cookie('csrf_token', csrfToken, CSRF_COOKIE_OPTIONS);
  res.json({ csrfToken });
});

// 5. Middleware global de validación Anti-CSRF para métodos mutantes (POST, PUT, PATCH, DELETE)
app.use(verifyCsrfToken);

// 6. Rutas de la API
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
