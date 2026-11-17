const express = require('express');
const router = express.Router();
const { runQuery } = require('../config/db');
const { authenticateUser } = require('../middleware/authMiddleware');

/**
 * GET /api/auth/perfiles-demo
 * Retorna los colaboradores representativos para pruebas rápidas de la rúbrica.
 */
router.get('/perfiles-demo', async (req, res) => {
  try {
    const [rows] = await runQuery('auth_perfiles_demo');

    const perfiles = rows.map((u) => ({
      ...u,
      etiqueta: u.rol === 'rrhh' ? `[RRHH] ${u.nombre}` : `[Colaborador] ${u.nombre}`,
      token: Buffer.from(JSON.stringify({ id: u.id, rol: u.rol })).toString('base64'),
    }));

    res.json({ perfiles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  const { email, userId } = req.body;

  try {
    let rows = [];
    if (userId) {
      [rows] = await runQuery('auth_obtener_usuario_por_id', [userId]);
    } else if (email) {
      [rows] = await runQuery('auth_obtener_usuario_por_email', [email]);
    } else {
      [rows] = await runQuery('auth_obtener_usuario_por_id', [3]);
    }

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas o usuario no encontrado.' });
    }

    const user = rows[0];
    const token = Buffer.from(JSON.stringify({ id: user.id, rol: user.rol })).toString('base64');

    res.json({
      ok: true,
      user,
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticateUser, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
