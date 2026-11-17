const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticateUser, requireRRHH } = require('../middleware/authMiddleware');

/**
 * GET /api/solicitudes/pendientes
 * Lista solicitudes sin aprobar para la tabla del dashboard de RRHH (RF-FE-11).
 */
router.get('/pendientes', authenticateUser, requireRRHH, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         s.id,
         s.tipo,
         s.fecha_inicio,
         s.fecha_fin,
         s.dias_solicitados,
         s.motivo,
         s.estado,
         s.creada_en,
         DATEDIFF(CURRENT_TIMESTAMP, s.creada_en) AS dias_en_espera,
         (DATEDIFF(CURRENT_TIMESTAMP, s.creada_en) > 3) AS alerta_retraso,
         c.nombre AS colaborador_nombre,
         c.email AS colaborador_email,
         d.nombre AS departamento
       FROM solicitudes s
       JOIN colaboradores c ON s.colaborador_id = c.id
       LEFT JOIN departamentos d ON c.departamento_id = d.id
       WHERE s.estado = 'pendiente'
       ORDER BY dias_en_espera DESC, s.creada_en ASC`
    );

    res.json({
      total: rows.length,
      solicitudes: rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
