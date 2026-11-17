const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReporteDiario = sequelize.define(
    'ReporteDiario',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        unique: true,
      },
      datos_json: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      resumen_texto: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      generado_por: {
        type: DataTypes.STRING(100),
        defaultValue: 'cronJobs_analistaAgent',
      },
      creado_en: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'reportes_diarios',
      timestamps: false,
    }
  );

  return ReporteDiario;
};
