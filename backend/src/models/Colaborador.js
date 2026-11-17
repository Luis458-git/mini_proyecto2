const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Colaborador = sequelize.define(
    'Colaborador',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      cedula_ficticia: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      nombre: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
      },
      telefono: {
        type: DataTypes.STRING(25),
        allowNull: false,
      },
      departamento_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      puesto_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      jefe_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      fecha_ingreso: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      tipo_contrato: {
        type: DataTypes.ENUM('indefinido', 'plazo_fijo', 'servicios_profesionales'),
        defaultValue: 'indefinido',
      },
      modalidad: {
        type: DataTypes.ENUM('presencial', 'hibrido', 'teletrabajo'),
        defaultValue: 'hibrido',
      },
      rol: {
        type: DataTypes.ENUM('colaborador', 'rrhh', 'admin'),
        defaultValue: 'colaborador',
      },
      estado: {
        type: DataTypes.ENUM('activo', 'inactivo', 'suspendido'),
        defaultValue: 'activo',
      },
    },
    {
      tableName: 'colaboradores',
      timestamps: false,
    }
  );

  return Colaborador;
};
