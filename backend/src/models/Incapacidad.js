const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Incapacidad = sequelize.define(
    'Incapacidad',
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
        type: DataTypes.ENUM('enfermedad_comun_ccss', 'maternidad_ccss', 'fase_terminal_ccss', 'riesgo_trabajo_ins'),
        allowNull: false,
      },
      diagnostico: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },
      centro_emisor: {
        type: DataTypes.STRING(150),
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
      dias: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      subsidio_ccss: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.0,
      },
      subsidio_empresa: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.0,
      },
      estado: {
        type: DataTypes.ENUM('activa', 'finalizada', 'prorrogada'),
        defaultValue: 'activa',
      },
    },
    {
      tableName: 'incapacidades',
      timestamps: false,
    }
  );

  return Incapacidad;
};
