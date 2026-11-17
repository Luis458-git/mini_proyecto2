const { runQuery } = require('../config/db');

/**
 * Middleware para extraer el usuario autenticado.
 * Acepta header Authorization: Bearer <base64/id> o cabecera x-user-id.
 */
async function authenticateUser(req, res, next) {
  try {
    let userId = req.headers['x-user-id'];
    const authHeader = req.headers['authorization'];

    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (/^\d+$/.test(token)) {
        userId = token;
      } else {
        try {
          const decoded = Buffer.from(token, 'base64').toString('utf8');
          const parsed = JSON.parse(decoded);
          userId = parsed.id || parsed.userId;
        } catch {
          userId = 3;
        }
      }
    }

    const finalUserId = Number(userId) || 3;

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
