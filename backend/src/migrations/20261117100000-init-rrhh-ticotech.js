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

    const fullSql = fs.readFileSync(sqlPath, 'utf8');

    // Ejecutar el script SQL completo con soporte de múltiples sentencias
    await queryInterface.sequelize.query(fullSql, { raw: true });
  },

  async down(queryInterface) {
    // Si se revierte la migración
    await queryInterface.sequelize.query('DROP DATABASE IF EXISTS rrhh_ticotech;', { raw: true });
  },
};
