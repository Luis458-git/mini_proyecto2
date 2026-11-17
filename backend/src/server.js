const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
  quiet: true,
});

const app = require('./app');
const { testConnection } = require('./config/db');
const { initCronJobs } = require('./jobs/cronJobs');

const PORT = process.env.PORT || 3000;

async function startServer() {
  console.log('🚀 Iniciando TicoTech HR Portal Backend...');

  // 1. Probar conexión a la base de datos MySQL (resiliente)
  try {
    await testConnection();
    console.log('✅ Conexión con base de datos MySQL establecida exitosamente.');
  } catch (dbErr) {
    console.warn('⚠️ Advertencia de conexión a MySQL:', dbErr.message);
    console.warn('ℹ️ El servidor continuará ejecutándose para atender peticiones web.');
  }

  // 2. Iniciar cron jobs
  try {
    initCronJobs();
  } catch (cronErr) {
    console.warn('⚠️ Advertencia en cron jobs:', cronErr.message);
  }

  // 3. Levantar servidor HTTP
  app.listen(PORT, () => {
    console.log(`🌐 Servidor corriendo exitosamente en http://localhost:${PORT}`);
    console.log(`📡 API lista para recibir peticiones en http://localhost:${PORT}/api`);
  });
}

startServer().catch((err) => {
  console.error('❌ Error fatal al iniciar el servidor:', err);
  process.exit(1);
});
