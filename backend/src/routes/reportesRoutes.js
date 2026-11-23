const express = require('express');
const router = express.Router();
const { runQuery } = require('../config/db');
const { authenticateUser, requireRRHH } = require('../middleware/authMiddleware');
const { generarReporteDiario } = require('../agents/analistaAgent');

/**
 * GET /api/reportes/ultimo
 * Retorna el reporte diario más reciente guardado en base de datos.
 */
router.get('/ultimo', authenticateUser, requireRRHH, async (req, res) => {
  try {
    const [rows] = await runQuery('reportes_obtener_ultimo');

    if (rows.length === 0) {
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
    const [reportes] = await runQuery('reportes_obtener_historial');
    const [tendenciaRows] = await runQuery('reportes_tendencia_30d');
    const [departamentosRows] = await runQuery('reportes_colaboradores_por_departamento');

    const reportesConMetricas = reportes.map((r) => ({
      ...r,
      metricas: typeof r.datos_json === 'string' ? JSON.parse(r.datos_json) : r.datos_json,
    }));

    res.json({
      reportes: reportesConMetricas,
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
