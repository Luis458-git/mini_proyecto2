const express = require('express');
const router = express.Router();
const { runQuery } = require('../config/db');
const { authenticateUser } = require('../middleware/authMiddleware');
const { procesarMensaje } = require('../agents/orquestador');

/**
 * POST /api/chat
 * Envío de mensaje al Agente Orquestador.
 */
router.post('/', authenticateUser, async (req, res) => {
  const { message, sessionId = 'sesion_web' } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'El campo "message" es obligatorio.' });
  }

  try {
    const resultado = await procesarMensaje(message.trim(), req.user, sessionId);
    res.json(resultado);
  } catch (err) {
    console.error('Error en POST /api/chat:', err);
    res.status(500).json({
      error: 'Error interno al procesar el mensaje con el orquestador.',
      detalle: err.message,
    });
  }
});

/**
 * GET /api/chat/historial
 * Obtiene el historial de consultas del usuario autenticado.
 */
router.get('/historial', authenticateUser, async (req, res) => {
  try {
    const [rows] = await runQuery('chat_historial_usuario', [req.user.id]);
    res.json({ historial: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/chat/escalar
 * Crea un ticket de escalamiento formal a RRHH si el RAG no supo responder (RF-FE-07).
 */
router.post('/escalar', authenticateUser, async (req, res) => {
  const { consultaId, asunto, motivo } = req.body;

  try {
    const [insertResult] = await runQuery('chat_crear_ticket_escalamiento', [
      consultaId || null,
      req.user.id,
      asunto || motivo || 'Duda sobre política no encontrada en documentos oficiales',
    ]);

    if (consultaId) {
      await runQuery('chat_marcar_consulta_escalada', [consultaId]);
    }

    res.json({
      ok: true,
      ticket_id: insertResult.insertId,
      mensaje:
        'Ticket de escalamiento a Recursos Humanos creado exitosamente. Un especialista revisará tu duda a la brevedad.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/chat/sugerencias
 * Sugerencias rápidas para la pantalla de chat vacía (RF-FE-06).
 */
router.get('/sugerencias', (req, res) => {
  res.json({
    sugerencias: [
      {
        categoria: 'Vacaciones',
        texto: '¿Cuántos días de vacaciones me quedan disponibles?',
      },
      {
        categoria: 'Permisos',
        texto: '¿Cómo solicito un permiso con goce de salario por duelo o fallecimiento?',
      },
      {
        categoria: 'Planilla y CCSS',
        texto: '¿Cuándo se paga el aguinaldo y cómo se calcula según la ley de Costa Rica?',
      },
      {
        categoria: 'Incapacidades',
        texto: '¿Cuál es el subsidio que paga la CCSS a partir del cuarto día de incapacidad?',
      },
      {
        categoria: 'Teletrabajo',
        texto: '¿Cuáles son las reglas de desconexión digital y jornada de teletrabajo?',
      },
    ],
  });
});

module.exports = router;
