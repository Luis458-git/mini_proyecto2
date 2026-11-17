const path = require('path');
const { Sequelize } = require('sequelize');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
  quiet: true,
});

const sequelize = new Sequelize(
  process.env.DB_NAME || 'rrhh_ticotech',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    timezone: '-06:00',
    logging: false,
    pool: {
      max: Number(process.env.DB_CONNECTION_LIMIT || 10),
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Inicializar Modelos
const Departamento = require('./Departamento')(sequelize);
const Puesto = require('./Puesto')(sequelize);
const Colaborador = require('./Colaborador')(sequelize);
const SaldoVacaciones = require('./SaldoVacaciones')(sequelize);
const Solicitud = require('./Solicitud')(sequelize);
const Incapacidad = require('./Incapacidad')(sequelize);
const ConsultaChat = require('./ConsultaChat')(sequelize);
const TicketEscalamiento = require('./TicketEscalamiento')(sequelize);
const ReporteDiario = require('./ReporteDiario')(sequelize);

// Definir Relaciones / Asociaciones ORM
Departamento.hasMany(Colaborador, { foreignKey: 'departamento_id', as: 'colaboradores' });
Colaborador.belongsTo(Departamento, { foreignKey: 'departamento_id', as: 'departamento' });

Puesto.hasMany(Colaborador, { foreignKey: 'puesto_id', as: 'colaboradores' });
Colaborador.belongsTo(Puesto, { foreignKey: 'puesto_id', as: 'puesto' });

Colaborador.hasMany(SaldoVacaciones, { foreignKey: 'colaborador_id', as: 'saldos_vacaciones' });
SaldoVacaciones.belongsTo(Colaborador, { foreignKey: 'colaborador_id', as: 'colaborador' });

Colaborador.hasMany(Solicitud, { foreignKey: 'colaborador_id', as: 'solicitudes' });
Solicitud.belongsTo(Colaborador, { foreignKey: 'colaborador_id', as: 'colaborador' });

Colaborador.hasMany(Incapacidad, { foreignKey: 'colaborador_id', as: 'incapacidades' });
Incapacidad.belongsTo(Colaborador, { foreignKey: 'colaborador_id', as: 'colaborador' });

Colaborador.hasMany(ConsultaChat, { foreignKey: 'colaborador_id', as: 'consultas' });
ConsultaChat.belongsTo(Colaborador, { foreignKey: 'colaborador_id', as: 'colaborador' });

ConsultaChat.hasOne(TicketEscalamiento, { foreignKey: 'consulta_id', as: 'ticket' });
TicketEscalamiento.belongsTo(ConsultaChat, { foreignKey: 'consulta_id', as: 'consulta' });

Colaborador.hasMany(TicketEscalamiento, { foreignKey: 'colaborador_id', as: 'tickets_creados' });
TicketEscalamiento.belongsTo(Colaborador, { foreignKey: 'colaborador_id', as: 'colaborador' });

module.exports = {
  sequelize,
  Sequelize,
  Departamento,
  Puesto,
  Colaborador,
  SaldoVacaciones,
  Solicitud,
  Incapacidad,
  ConsultaChat,
  TicketEscalamiento,
  ReporteDiario,
};
