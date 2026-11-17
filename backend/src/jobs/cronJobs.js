const cron = require('node-cron');
const { generarReporteDiario } = require('../agents/analistaAgent');
const { ejecutarIngestaCompleta } = require('../agents/ingestaAgent');

/**
 * Inicializa las tareas programadas del backend.
 */
function initCronJobs() {
  console.log('⏰ Inicializando cron jobs de TicoTech HR Portal...');

  // 1. Reporte diario a las 07:00 a.m. (Costa Rica / local) (RF-BE-12)
  cron.schedule(
    '0 7 * * *',
    async () => {
      console.log('🌅 [Cron 07:00 AM] Ejecutando generación automática del Reporte Diario RRHH...');
      try {
        const reporte = await generarReporteDiario(null, 'cronJobs_0700_analistaAgent');
        console.log(`✅ [Cron] Reporte diario generado para ${reporte.fecha}`);
      } catch (err) {
        console.error('❌ [Cron] Error al generar reporte diario:', err.message);
      }
    },
    {
      timezone: 'America/Costa_Rica',
    }
  );

  // 2. Sincronización incremental con Drive diaria a las 06:30 a.m. (RF-BE-06)
  cron.schedule(
    '30 6 * * *',
    async () => {
      console.log('🔄 [Cron 06:30 AM] Ejecutando sincronización automática con Google Drive...');
      try {
        await ejecutarIngestaCompleta();
        console.log('✅ [Cron] Sincronización con Drive finalizada.');
      } catch (err) {
        console.error('❌ [Cron] Error en sincronización con Drive:', err.message);
      }
    },
    {
      timezone: 'America/Costa_Rica',
    }
  );

  console.log('✅ Cron jobs configurados: 07:00 a.m. (Reporte Diario) y 06:30 a.m. (Drive Sync).');
}

module.exports = {
  initCronJobs,
};
