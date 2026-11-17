const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Puesto = sequelize.define(
    'Puesto',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      departamento_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      titulo: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      nivel: {
        type: DataTypes.ENUM('Junior', 'Mid', 'Senior', 'Lead', 'Gerencia'),
        allowNull: false,
      },
      salario_base_min: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      salario_base_max: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
    },
    {
      tableName: 'puestos',
      timestamps: false,
    }
  );

  return Puesto;
};
