'use strict';

const fs = require('fs');
const path = require('path');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const candidates = [
      path.resolve(__dirname, '../../../database/rrhh_ticotech.sql'),
      path.resolve(__dirname, '../../database/rrhh_ticotech.sql'),
      path.resolve(__dirname, '../../rrhh_ticotech.sql'),
    ];
    const sqlPath = candidates.find((p) => fs.existsSync(p));
    if (!sqlPath) {
      throw new Error('No se encontró el archivo rrhh_ticotech.sql para la migración');
    }

    let fullSql = fs.readFileSync(sqlPath, 'utf8');

    // Remover DROP DATABASE, CREATE DATABASE y USE rrhh_ticotech
    // para NO eliminar la tabla SequelizeMeta que Sequelize CLI necesita para registrar la migración
    fullSql = fullSql.replace(/DROP\s+DATABASE\s+IF\s+EXISTS\s+[^;]+;/gi, '');
    fullSql = fullSql.replace(/CREATE\s+DATABASE\s+[^;]+;/gi, '');
    fullSql = fullSql.replace(/USE\s+[^;]+;/gi, '');

    // Desactivar temporalmente foreign keys durante la migración para evitar conflictos de orden
    const cleanSql = `
      SET FOREIGN_KEY_CHECKS = 0;
      ${fullSql}
      SET FOREIGN_KEY_CHECKS = 1;
    `;

    await queryInterface.sequelize.query(cleanSql, { raw: true });
  },

  async down(queryInterface) {
    const tables = [
      'reportes_diarios', 'tickets_escalamiento', 'consultas_chat', 'documentos_politicas',
      'denuncias_etica', 'capacitaciones_inscripciones', 'capacitaciones', 'evaluaciones_desempeno',
      'colaborador_beneficios', 'beneficios', 'planillas', 'periodos_pago', 'horas_extra',
      'registro_asistencia', 'feriados', 'movimientos_personal', 'incapacidades', 'solicitudes',
      'saldos_vacaciones', 'colaboradores', 'puestos', 'departamentos',
    ];

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;', { raw: true });
    for (const table of tables) {
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS \`${table}\`;`, { raw: true });
    }
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;', { raw: true });
  },
};
