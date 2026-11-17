const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Departamento = sequelize.define(
    'Departamento',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      centro_costo: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },
      presupuesto_anual: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
      },
      gerente_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
    },
    {
      tableName: 'departamentos',
      timestamps: false,
    }
  );

  return Departamento;
};
