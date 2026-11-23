const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'ticotech-super-secret-key-rag-2026';

/**
 * Genera un token firmado criptográficamente con HMAC-SHA256 (RNF-02).
 * Formato: <header_base64url>.<payload_base64url>.<firma_hmac_sha256>
 * @param {object} payload - Datos de identidad { id, rol, ... }
 * @param {number} expiresInMs - Tiempo de validez (por defecto 24 horas)
 * @returns {string} Token firmado a prueba de manipulaciones
 */
function generateToken(payload, expiresInMs = 24 * 60 * 60 * 1000) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Date.now() + expiresInMs;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Valida la firma HMAC-SHA256 y vigencia temporal de un token.
 * Si el token fue alterado o expiró, retorna null.
 * @param {string} token 
 * @returns {object|null} Payload decodificado o null si es inválido
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    // Comparación segura en tiempo constante contra timing attacks
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));

    // Verificar si expiró
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken,
};
