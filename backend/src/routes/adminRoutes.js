const express = require('express');
const router = express.Router();
const { authenticateUser, requireRRHH } = require('../middleware/authMiddleware');
const { ejecutarIngestaCompleta } = require('../agents/ingestaAgent');

/**
 * POST /api/admin/sync-drive
 * Fuerza la sincronización manual con Google Drive y actualización de ChromaDB (RF-BE-06).
 */
router.post('/sync-drive', authenticateUser, requireRRHH, async (req, res) => {
  try {
    const resultado = await ejecutarIngestaCompleta();
    res.json({
      ok: true,
      mensaje: 'Sincronización con Google Drive y actualización de ChromaDB completada exitosamente.',
      resultado,
    });
  } catch (err) {
    console.error('Error en POST /api/admin/sync-drive:', err);
    res.status(500).json({
      error: 'Error al ejecutar sincronización con Google Drive.',
      detalle: err.message,
    });
  }
});

module.exports = router;
