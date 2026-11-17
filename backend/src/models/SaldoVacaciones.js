const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SaldoVacaciones = sequelize.define(
    'SaldoVacaciones',
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
      periodo: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      dias_asignados: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 15.0,
      },
      dias_tomados: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      dias_disponibles: {
        type: DataTypes.DECIMAL(5, 2),
        // Columna virtual o generada en MySQL
      },
    },
    {
      tableName: 'saldos_vacaciones',
      timestamps: false,
    }
  );

  return SaldoVacaciones;
};
