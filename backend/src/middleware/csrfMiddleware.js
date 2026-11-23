const crypto = require('crypto');

/**
 * Genera un token criptográficamente seguro de 32 bytes en formato hexadecimal.
 */
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Configuración estricta de la cookie que contiene el token anti-CSRF.
 * - httpOnly: true (inmune a lectura desde document.cookie por scripts XSS)
 * - sameSite: 'lax' (protección contra peticiones cross-site no deseadas)
 * - secure: activo en producción sobre HTTPS
 */
const CSRF_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

/**
 * Middleware para validar el token anti-CSRF en rutas que modifican estado (POST, PUT, PATCH, DELETE).
 * Requiere que la cabecera 'X-CSRF-Token' coincida exactamente con la cookie 'csrf_token'.
 */
function verifyCsrfToken(req, res, next) {
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  // Solo se valida en métodos mutantes
  if (!mutatingMethods.includes(req.method)) {
    return next();
  }

  // Rutas exentas de validación de token previo (como login y obtención del token)
  const exemptPaths = ['/api/auth/login', '/api/csrf-token'];
  if (exemptPaths.some((p) => req.originalUrl?.startsWith(p) || req.path?.startsWith(p))) {
    return next();
  }

  const clientToken = req.headers['x-csrf-token'];
  const cookieToken = req.cookies && req.cookies['csrf_token'];

  if (!clientToken || !cookieToken) {
    return res.status(403).json({
      error: 'Acceso denegado: Token anti-CSRF faltante. Se requiere la cabecera X-CSRF-Token y la cookie csrf_token.',
    });
  }

  try {
    const clientBuf = Buffer.from(clientToken, 'hex');
    const cookieBuf = Buffer.from(cookieToken, 'hex');

    if (clientBuf.length !== cookieBuf.length || !crypto.timingSafeEqual(clientBuf, cookieBuf)) {
      return res.status(403).json({
        error: 'Acceso denegado: Token anti-CSRF inválido o manipulado.',
      });
    }
  } catch {
    return res.status(403).json({
      error: 'Acceso denegado: Error al verificar token anti-CSRF.',
    });
  }

  next();
}

module.exports = {
  generateCsrfToken,
  CSRF_COOKIE_OPTIONS,
  verifyCsrfToken,
};
