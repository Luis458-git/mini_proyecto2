const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticateUser, requireRRHH } = require('../middleware/authMiddleware');
const { generarReporteDiario } = require('../agents/analistaAgent');

/**
 * GET /api/reportes/ultimo
 * Retorna el reporte diario más reciente guardado en base de datos.
 */
router.get('/ultimo', authenticateUser, requireRRHH, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, fecha, datos_json, resumen_texto, generado_por, creado_en
       FROM reportes_diarios
       ORDER BY fecha DESC, id DESC
       LIMIT 1`
    );

    if (rows.length === 0) {
      // Si no existe, generarlo automáticamente para hoy
      const nuevo = await generarReporteDiario();
      return res.json({ reporte: nuevo });
    }

    const row = rows[0];
    const datos = typeof row.datos_json === 'string' ? JSON.parse(row.datos_json) : row.datos_json;

    res.json({
      reporte: {
        id: row.id,
        fecha: row.fecha,
        metricas: datos,
        resumen_ejecutivo: row.resumen_texto,
        generado_por: row.generado_por,
        creado_en: row.creado_en,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/reportes/historial
 * Lista reportes anteriores y datos de tendencia para el gráfico de 30 días (RF-FE-10).
 */
router.get('/historial', authenticateUser, requireRRHH, async (req, res) => {
  try {
    const [reportes] = await pool.query(
      `SELECT id, fecha, resumen_texto, generado_por, creado_en
       FROM reportes_diarios
       ORDER BY fecha DESC
       LIMIT 30`
    );

    // Métricas para gráfico de tendencia de 30 días (consultas del chatbot por día)
    const [tendenciaRows] = await pool.query(
      `SELECT DATE(fecha) AS fecha_dia, COUNT(*) AS total_consultas,
              SUM(CASE WHEN escalada = TRUE THEN 1 ELSE 0 END) AS escaladas,
              ROUND(AVG(latencia_ms), 0) AS latencia_promedio
       FROM consultas_chat
       WHERE fecha >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
       GROUP BY DATE(fecha)
       ORDER BY fecha_dia ASC`
    );

    // Métricas por departamento para gráfico categórico de barras/dona
    const [departamentosRows] = await pool.query(
      `SELECT d.nombre AS departamento, COUNT(c.id) AS total_colaboradores
       FROM departamentos d
       LEFT JOIN colaboradores c ON d.id = c.departamento_id
       GROUP BY d.id, d.nombre`
    );

    res.json({
      reportes,
      grafico_tendencia_30d: tendenciaRows,
      grafico_departamentos: departamentosRows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/reportes/generar
 * Dispara la generación manual del reporte del día (RF-BE-12).
 */
router.post('/generar', authenticateUser, requireRRHH, async (req, res) => {
  const { fecha } = req.body;
  try {
    const reporte = await generarReporteDiario(fecha, `manual_${req.user.nombre}`);
    res.json({
      ok: true,
      mensaje: 'Reporte diario generado exitosamente por el Agente Analista.',
      reporte,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
