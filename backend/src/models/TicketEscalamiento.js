const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TicketEscalamiento = sequelize.define(
    'TicketEscalamiento',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      consulta_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      colaborador_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      asignado_rrhh_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      asunto: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      prioridad: {
        type: DataTypes.ENUM('baja', 'media', 'alta', 'urgente'),
        defaultValue: 'media',
      },
      estado: {
        type: DataTypes.ENUM('abierto', 'en_revision', 'resuelto', 'cerrado'),
        defaultValue: 'abierto',
      },
      respuesta_rrhh: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      creado_en: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'tickets_escalamiento',
      timestamps: false,
    }
  );

  return TicketEscalamiento;
};
