const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const { deepseek, DEFAULT_MODEL } = require('../config/deepseek');

const PROMPT_PATH = path.resolve(__dirname, '../prompts/agenteDatos.txt');

function getSystemPrompt() {
  if (fs.existsSync(PROMPT_PATH)) {
    return fs.readFileSync(PROMPT_PATH, 'utf8');
  }
  return 'Eres el Agente de Datos de RRHH de TicoTech Solutions S.A.';
}

/**
 * Agente de datos SQL con aislamiento estricto de seguridad.
 * Inyecta WHERE colaborador_id = :id garantizando cero fugas de privacidad.
 */
async function consultarDatos(pregunta, usuario) {
  if (!usuario || !usuario.id) {
    throw new Error('Usuario no autenticado para consulta de datos personales.');
  }

  const pregLower = pregunta.toLowerCase();
  const userId = usuario.id;
  const esRRHH = usuario.rol === 'rrhh' || usuario.rol === 'admin';

  let sqlData = null;
  let tipoConsulta = 'general';

  try {
    // 1. Detección de tema para extraer los datos necesarios con consultas preparadas estables

    // CONSULTAS EXCLUSIVAS DE RRHH (Agregadas de equipo)
    if (esRRHH && (pregLower.includes('cuántas personas') || pregLower.includes('ausentes hoy') || pregLower.includes('equipo') || pregLower.includes('global') || pregLower.includes('departamentos') || pregLower.includes('pasivo'))) {
      if (pregLower.includes('ausente') || pregLower.includes('vacaciones hoy')) {
        tipoConsulta = 'ausentes_hoy_rrhh';
        const [rows] = await pool.query(
          `SELECT c.nombre, d.nombre AS departamento, s.tipo, s.fecha_inicio, s.fecha_fin
           FROM solicitudes s
           JOIN colaboradores c ON s.colaborador_id = c.id
           LEFT JOIN departamentos d ON c.departamento_id = d.id
           WHERE s.estado = 'aprobada' AND CURRENT_DATE BETWEEN s.fecha_inicio AND s.fecha_fin`
        );
        sqlData = { total_ausentes: rows.length, lista: rows };
      } else if (pregLower.includes('pasivo') || pregLower.includes('> 20') || pregLower.includes('20 días')) {
        tipoConsulta = 'pasivo_vacaciones_rrhh';
        const [rows] = await pool.query(
          `SELECT c.nombre, d.nombre AS departamento, SUM(sv.dias_disponibles) AS dias_acumulados
           FROM saldos_vacaciones sv
           JOIN colaboradores c ON sv.colaborador_id = c.id
           LEFT JOIN departamentos d ON c.departamento_id = d.id
           GROUP BY c.id, c.nombre, d.nombre
           HAVING dias_acumulados > 20
           ORDER BY dias_acumulados DESC`
        );
        sqlData = { total_en_riesgo: rows.length, colaboradores: rows };
      } else {
        tipoConsulta = 'metricas_generales_rrhh';
        const [solPend] = await pool.query(`SELECT COUNT(*) AS total FROM solicitudes WHERE estado = 'pendiente'`);
        const [incapAct] = await pool.query(`SELECT COUNT(*) AS total FROM incapacidades WHERE estado = 'activa'`);
        sqlData = { solicitudes_pendientes: solPend[0].total, incapacidades_activas: incapAct[0].total };
      }
    }

    // CONSULTAS PERSONALES DEL COLABORADOR (Inyección forzada de colaborador_id = userId)
    else if (pregLower.includes('vacacion') || pregLower.includes('dias') || pregLower.includes('saldo') || pregLower.includes('quedan')) {
      tipoConsulta = 'vacaciones';
      const [saldos] = await pool.query(
        `SELECT periodo, dias_asignados, dias_tomados, dias_disponibles
         FROM saldos_vacaciones
         WHERE colaborador_id = ?
         ORDER BY periodo DESC`,
        [userId]
      );
      const [solicitudes] = await pool.query(
        `SELECT id, tipo, fecha_inicio, fecha_fin, dias_solicitados, estado
         FROM solicitudes
         WHERE colaborador_id = ? AND tipo = 'vacaciones'
         ORDER BY creada_en DESC LIMIT 5`,
        [userId]
      );
      sqlData = { saldos, solicitudes_recientes: solicitudes };
    } else if (pregLower.includes('salario') || pregLower.includes('planilla') || pregLower.includes('ccss') || pregLower.includes('deduccion') || pregLower.includes('pago') || pregLower.includes('aguinaldo') || pregLower.includes('renta')) {
      tipoConsulta = 'planilla';
      const [planillas] = await pool.query(
        `SELECT p.salario_bruto, p.monto_horas_extra, p.deduccion_ccss, p.deduccion_renta, p.deduccion_asociacion, p.salario_neto,
                pp.nombre_periodo, pp.fecha_inicio, pp.fecha_fin
         FROM planillas p
         JOIN periodos_pago pp ON p.periodo_id = pp.id
         WHERE p.colaborador_id = ?
         ORDER BY pp.fecha_fin DESC LIMIT 3`,
        [userId]
      );
      sqlData = { planillas };
    } else if (pregLower.includes('incapacidad') || pregLower.includes('ins') || pregLower.includes('medica')) {
      tipoConsulta = 'incapacidades';
      const [incapacidades] = await pool.query(
        `SELECT tipo, diagnostico, fecha_inicio, fecha_fin, dias, subsidio_ccss, subsidio_empresa, estado
         FROM incapacidades
         WHERE colaborador_id = ?
         ORDER BY fecha_inicio DESC LIMIT 5`,
        [userId]
      );
      sqlData = { incapacidades };
    } else if (pregLower.includes('solicitud') || pregLower.includes('permiso') || pregLower.includes('aprobacion') || pregLower.includes('tramite')) {
      tipoConsulta = 'solicitudes';
      const [solicitudes] = await pool.query(
        `SELECT id, tipo, fecha_inicio, fecha_fin, dias_solicitados, motivo, estado, creada_en
         FROM solicitudes
         WHERE colaborador_id = ?
         ORDER BY creada_en DESC LIMIT 8`,
        [userId]
      );
      sqlData = { solicitudes };
    } else if (pregLower.includes('beneficio') || pregLower.includes('asociacion') || pregLower.includes('seguro')) {
      tipoConsulta = 'beneficios';
      const [beneficios] = await pool.query(
        `SELECT b.nombre, b.categoria, b.descripcion, cb.fecha_afiliacion, cb.estado
         FROM colaborador_beneficios cb
         JOIN beneficios b ON cb.beneficio_id = b.id
         WHERE cb.colaborador_id = ?`,
        [userId]
      );
      sqlData = { beneficios };
    } else {
      // Consulta de perfil laboral general
      tipoConsulta = 'perfil';
      const [colab] = await pool.query(
        `SELECT c.id, c.nombre, c.email, c.fecha_ingreso, c.modalidad, c.tipo_contrato,
                d.nombre AS departamento, p.titulo AS puesto
         FROM colaboradores c
         LEFT JOIN departamentos d ON c.departamento_id = d.id
         LEFT JOIN puestos p ON c.puesto_id = p.id
         WHERE c.id = ?`,
        [userId]
      );
      const [vac] = await pool.query(
        `SELECT SUM(dias_disponibles) AS total_vacaciones_disponibles
         FROM saldos_vacaciones WHERE colaborador_id = ?`,
        [userId]
      );
      sqlData = { colaborador: colab[0] || {}, vacaciones_disponibles: vac[0]?.total_vacaciones_disponibles || 0 };
    }
  } catch (dbErr) {
    console.error('Error al consultar base de datos en datosAgent:', dbErr.message);
    return {
      respuesta: `Ocurrió un error al consultar tu información personal en el sistema: ${dbErr.message}`,
      datos: null,
      tipoConsulta,
    };
  }

  // 2. Redacción mediante DeepSeek con el contexto estructurado
  const systemPromptTemplate = getSystemPrompt();
  const systemPrompt = systemPromptTemplate
    .replace('{{usuario_id}}', String(userId))
    .replace('{{usuario_nombre}}', usuario.nombre || 'Colaborador')
    .replace('{{usuario_rol}}', usuario.rol || 'colaborador')
    .replace('{{usuario_departamento}}', usuario.departamento || 'General')
    .replace('{{pregunta}}', pregunta)
    .replace('{{datos_sql}}', JSON.stringify(sqlData, null, 2));

  try {
    const completion = await deepseek.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Pregunta del colaborador: "${pregunta}"\nDatos reales en sistema:\n${JSON.stringify(sqlData, null, 2)}\n\nRedacta la respuesta confirmando de forma precisa las cifras oficiales encontradas.`,
        },
      ],
      temperature: 0.1,
      max_tokens: 600,
    });

    return {
      respuesta: completion.choices[0]?.message?.content?.trim() || '',
      datos: sqlData,
      tipoConsulta,
    };
  } catch (aiErr) {
    console.error('Fallback determinista en datosAgent:', aiErr.message);

    // Fallback determinista en caso de corte o desconexión
    let fallbackText = `Información oficial registrada en el sistema para ${usuario.nombre}:\n`;
    if (tipoConsulta === 'vacaciones') {
      const saldos = sqlData.saldos || [];
      const totalDisp = saldos.reduce((acc, s) => acc + Number(s.dias_disponibles || 0), 0);
      fallbackText += `Tienes un total de **${totalDisp} días de vacaciones disponibles** acumulados.\n`;
      saldos.forEach((s) => {
        fallbackText += `• Período ${s.periodo}: ${s.dias_disponibles} días disponibles (${s.dias_tomados} tomados de ${s.dias_asignados} asignados).\n`;
      });
    } else if (tipoConsulta === 'planilla') {
      const p = sqlData.planillas?.[0];
      if (p) {
        fallbackText += `Última planilla (${p.nombre_periodo}): Salario Bruto ₡${Number(p.salario_bruto).toLocaleString()}, Deducción CCSS (10.67%) ₡${Number(p.deduccion_ccss).toLocaleString()}, Salario Neto ₡${Number(p.salario_neto).toLocaleString()}.`;
      }
    } else {
      fallbackText += JSON.stringify(sqlData);
    }

    return {
      respuesta: fallbackText,
      datos: sqlData,
      tipoConsulta,
    };
  }
}

module.exports = {
  consultarDatos,
};
