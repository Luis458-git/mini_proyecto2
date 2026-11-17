const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticateUser } = require('../middleware/authMiddleware');

/**
 * GET /api/auth/perfiles-demo
 * Retorna los colaboradores representativos para pruebas rápidas de la rúbrica.
 */
router.get('/perfiles-demo', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.nombre, c.email, c.rol, d.nombre AS departamento, p.titulo AS puesto
       FROM colaboradores c
       LEFT JOIN departamentos d ON c.departamento_id = d.id
       LEFT JOIN puestos p ON c.puesto_id = p.id
       WHERE c.id IN (2, 3, 6, 9)
       ORDER BY c.rol DESC, c.nombre ASC`
    );

    // Mapear con etiquetas claras para la UI
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
    let query = `
      SELECT c.id, c.nombre, c.email, c.rol, c.departamento_id, d.nombre AS departamento, p.titulo AS puesto
      FROM colaboradores c
      LEFT JOIN departamentos d ON c.departamento_id = d.id
      LEFT JOIN puestos p ON c.puesto_id = p.id
    `;
    let params = [];

    if (userId) {
      query += ' WHERE c.id = ?';
      params.push(userId);
    } else if (email) {
      query += ' WHERE c.email = ?';
      params.push(email);
    } else {
      query += ' WHERE c.id = 3'; // Por defecto Andrés Monge (Colaborador)
    }

    const [rows] = await pool.query(query, params);
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
