const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConsultaChat = sequelize.define(
    'ConsultaChat',
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
      sesion_id: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      pregunta: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      intencion: {
        type: DataTypes.ENUM(
          'politicas_rrhh',
          'datos_personales',
          'analitica_rrhh',
          'privacidad_rechazada',
          'escalamiento_humano',
          'general'
        ),
        allowNull: false,
      },
      agente_utilizado: {
        type: DataTypes.ENUM('orquestador', 'politicasAgent', 'datosAgent', 'analistaAgent'),
        allowNull: false,
      },
      documentos_citados: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      confianza_rag: {
        type: DataTypes.DECIMAL(4, 3),
        allowNull: true,
      },
      resuelta: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      escalada: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      latencia_ms: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      fecha: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'consultas_chat',
      timestamps: false,
    }
  );

  return ConsultaChat;
};
