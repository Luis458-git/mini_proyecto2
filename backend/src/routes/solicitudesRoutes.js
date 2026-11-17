const express = require('express');
const router = express.Router();
const { runQuery } = require('../config/db');
const { authenticateUser, requireRRHH } = require('../middleware/authMiddleware');

/**
 * GET /api/solicitudes/pendientes
 * Lista solicitudes sin aprobar para la tabla del dashboard de RRHH (RF-FE-11).
 */
router.get('/pendientes', authenticateUser, requireRRHH, async (req, res) => {
  try {
    const [rows] = await runQuery('solicitudes_listar_pendientes');

    res.json({
      total: rows.length,
      solicitudes: rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
