const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Solicitud = sequelize.define(
    'Solicitud',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      colaborador_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      tipo: {
        type: DataTypes.ENUM(
          'vacaciones',
          'permiso_paternidad',
          'permiso_maternidad',
          'permiso_matrimonio',
          'permiso_fallecimiento',
          'permiso_personal',
          'licencia_sin_goce'
        ),
        allowNull: false,
      },
      fecha_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      fecha_fin: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      dias_solicitados: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      motivo: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      estado: {
        type: DataTypes.ENUM('pendiente', 'aprobada', 'rechazada', 'cancelada'),
        defaultValue: 'pendiente',
      },
      aprobador_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      fecha_resolucion: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      creada_en: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'solicitudes',
      timestamps: false,
    }
  );

  return Solicitud;
};
