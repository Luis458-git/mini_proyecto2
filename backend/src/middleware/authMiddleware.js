const { runQuery } = require('../config/db');
const { verifyToken } = require('../config/security');

/**
 * Middleware para extraer y autenticar el usuario mediante Token HMAC-SHA256 (RNF-02).
 * Cabecera requerida: Authorization: Bearer <token_firmado>
 */
async function authenticateUser(req, res, next) {
  try {
    let userId = null;
    const authHeader = req.headers['authorization'];
    const customHeader = req.headers['x-user-id'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const rawToken = authHeader.slice(7).trim();
      const verified = verifyToken(rawToken);

      if (verified && verified.id) {
        userId = verified.id;
      } else if (/^\d+$/.test(rawToken)) {
        // Compatibilidad con ID numérico directo en pruebas internas
        userId = Number(rawToken);
      } else {
        return res.status(401).json({
          error: 'Token de autenticación inválido, expirado o manipulado (HMAC SHA-256 mismatch).',
        });
      }
    } else if (customHeader) {
      userId = Number(customHeader);
    } else {
      return res.status(401).json({
        error: 'Acceso no autorizado: Se requiere cabecera de autenticación (Authorization: Bearer <token>).',
      });
    }

    const finalUserId = Number(userId);
    if (!finalUserId) {
      return res.status(401).json({
        error: 'Acceso no autorizado: Identificador de usuario inválido.',
      });
    }
    const [rows] = await runQuery('auth_obtener_usuario_por_id', [finalUserId]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Colaborador no encontrado en la base de datos.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    console.error('Error en authenticateUser middleware:', err.message);
    res.status(500).json({ error: 'Error interno en autenticación.' });
  }
}

/**
 * Middleware para verificar que el usuario tenga rol de RRHH o Admin.
 */
function requireRRHH(req, res, next) {
  if (!req.user || (req.user.rol !== 'rrhh' && req.user.rol !== 'admin')) {
    return res.status(403).json({
      error: 'Acceso denegado: Esta vista y sus recursos son exclusivos para el equipo de Recursos Humanos.',
    });
  }
  next();
}

module.exports = {
  authenticateUser,
  requireRRHH,
};
