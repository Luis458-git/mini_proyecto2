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

/**
 * GET /api/solicitudes/mi-expediente
 * Obtiene los saldos de vacaciones, solicitudes, colillas, beneficios y catálogo de políticas
 * filtrados estrictamente para el colaborador autenticado.
 */
router.get('/mi-expediente', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const [[saldos], [solicitudes], [planillas], [beneficios], [documentos]] = await Promise.all([
      runQuery('datos_colab_saldos_vacaciones', [userId]),
      runQuery('datos_colab_solicitudes_todas', [userId]),
      runQuery('datos_colab_planillas', [userId]),
      runQuery('datos_colab_beneficios', [userId]),
      runQuery('documentos_listar_catalogo'),
    ]);

    const totalDisponible = saldos.reduce((acc, s) => acc + Number(s.dias_disponibles || 0), 0);

    res.json({
      ok: true,
      total_vacaciones_disponibles: totalDisponible,
      saldos,
      solicitudes,
      planillas,
      beneficios,
      documentos,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/solicitudes/crear
 * Permite al colaborador autenticado registrar una nueva solicitud de vacaciones o permiso.
 */
router.post('/crear', authenticateUser, async (req, res) => {
  const { tipo, fecha_inicio, fecha_fin, dias_solicitados, motivo } = req.body;

  if (!tipo || !fecha_inicio || !fecha_fin || !dias_solicitados || !motivo) {
    return res.status(400).json({ error: 'Todos los campos de la solicitud son obligatorios.' });
  }

  try {
    const [result] = await runQuery('solicitudes_crear_colaborador', [
      req.user.id,
      tipo,
      fecha_inicio,
      fecha_fin,
      Number(dias_solicitados),
      String(motivo).trim(),
    ]);

    res.json({
      ok: true,
      id: result.insertId,
      mensaje: 'Solicitud enviada exitosamente a Recursos Humanos.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/solicitudes/:id/resolver
 * Permite a RRHH aprobar o rechazar una solicitud pendiente en tiempo real.
 */
router.patch('/:id/resolver', authenticateUser, requireRRHH, async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!['aprobada', 'rechazada'].includes(estado)) {
    return res.status(400).json({ error: 'El estado debe ser "aprobada" o "rechazada".' });
  }

  try {
    await runQuery('solicitudes_resolver_estado', [estado, req.user.id, Number(id)]);
    res.json({
      ok: true,
      mensaje: `Solicitud #${id} marcada como ${estado}.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
