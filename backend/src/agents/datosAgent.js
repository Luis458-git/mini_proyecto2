const fs = require('fs');
const path = require('path');
const { runQuery } = require('../config/db');
const { deepseek, DEFAULT_MODEL } = require('../config/deepseek');

const PROMPT_PATH = path.resolve(__dirname, '../prompts/agenteDatos.txt');

function getSystemPrompt() {
  if (fs.existsSync(PROMPT_PATH)) {
    return fs.readFileSync(PROMPT_PATH, 'utf8');
  }
  return 'Eres el Agente de Datos de RRHH de TicoTech Solutions S.A.';
}

/**
 * Agente de datos con aislamiento estricto de seguridad por userId.
 * Todas las consultas provienen de database/consultas.sql.
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
    // CONSULTAS EXCLUSIVAS DE RRHH (Agregadas de equipo)
    if (
      esRRHH &&
      (pregLower.includes('cuántas personas') ||
        pregLower.includes('ausentes hoy') ||
        pregLower.includes('equipo') ||
        pregLower.includes('global') ||
        pregLower.includes('departamentos') ||
        pregLower.includes('pasivo'))
    ) {
      if (pregLower.includes('ausente') || pregLower.includes('vacaciones hoy')) {
        tipoConsulta = 'ausentes_hoy_rrhh';
        const [rows] = await runQuery('datos_rrhh_ausentes_hoy');
        sqlData = { total_ausentes: rows.length, lista: rows };
      } else if (pregLower.includes('pasivo') || pregLower.includes('> 20') || pregLower.includes('20 días')) {
        tipoConsulta = 'pasivo_vacaciones_rrhh';
        const [rows] = await runQuery('datos_rrhh_pasivo_vacaciones');
        sqlData = { total_en_riesgo: rows.length, colaboradores: rows };
      } else {
        tipoConsulta = 'metricas_generales_rrhh';
        const [solPend] = await runQuery('datos_rrhh_conteo_solicitudes_pendientes');
        const [incapAct] = await runQuery('datos_rrhh_conteo_incapacidades_activas');
        sqlData = {
          solicitudes_pendientes: solPend[0]?.total || 0,
          incapacidades_activas: incapAct[0]?.total || 0,
        };
      }
    }

    // CONSULTAS PERSONALES DEL COLABORADOR (Filtradas por userId)
    else if (
      pregLower.includes('vacacion') ||
      pregLower.includes('dias') ||
      pregLower.includes('saldo') ||
      pregLower.includes('quedan')
    ) {
      tipoConsulta = 'vacaciones';
      const [saldos] = await runQuery('datos_colab_saldos_vacaciones', [userId]);
      const [solicitudes] = await runQuery('datos_colab_solicitudes_vacaciones', [userId]);
      sqlData = { saldos, solicitudes_recientes: solicitudes };
    } else if (
      pregLower.includes('salario') ||
      pregLower.includes('planilla') ||
      pregLower.includes('ccss') ||
      pregLower.includes('deduccion') ||
      pregLower.includes('pago') ||
      pregLower.includes('aguinaldo') ||
      pregLower.includes('renta')
    ) {
      tipoConsulta = 'planilla';
      const [planillas] = await runQuery('datos_colab_planillas', [userId]);
      sqlData = { planillas };
    } else if (
      pregLower.includes('incapacidad') ||
      pregLower.includes('ins') ||
      pregLower.includes('medica')
    ) {
      tipoConsulta = 'incapacidades';
      const [incapacidades] = await runQuery('datos_colab_incapacidades', [userId]);
      sqlData = { incapacidades };
    } else if (
      pregLower.includes('solicitud') ||
      pregLower.includes('permiso') ||
      pregLower.includes('aprobacion') ||
      pregLower.includes('tramite')
    ) {
      tipoConsulta = 'solicitudes';
      const [solicitudes] = await runQuery('datos_colab_solicitudes_todas', [userId]);
      sqlData = { solicitudes };
    } else if (
      pregLower.includes('beneficio') ||
      pregLower.includes('asociacion') ||
      pregLower.includes('seguro')
    ) {
      tipoConsulta = 'beneficios';
      const [beneficios] = await runQuery('datos_colab_beneficios', [userId]);
      sqlData = { beneficios };
    } else {
      tipoConsulta = 'perfil';
      const [colab] = await runQuery('datos_colab_perfil', [userId]);
      const [vac] = await runQuery('datos_colab_total_vacaciones', [userId]);
      sqlData = {
        colaborador: colab[0] || {},
        vacaciones_disponibles: vac[0]?.total_vacaciones_disponibles || 0,
      };
    }
  } catch (dbErr) {
    console.error('Error al consultar base de datos en datosAgent:', dbErr.message);
    return {
      respuesta: `Ocurrió un error al consultar tu información personal en el sistema: ${dbErr.message}`,
      datos: null,
      tipoConsulta,
    };
  }

  // Redacción mediante DeepSeek con el contexto estructurado
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
          content: `Pregunta del colaborador: "${pregunta}"\nDatos reales en sistema:\n${JSON.stringify(
            sqlData,
            null,
            2
          )}\n\nRedacta la respuesta confirmando de forma precisa las cifras oficiales encontradas.`,
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
        fallbackText += `Última planilla (${p.nombre_periodo}): Salario Bruto ₡${Number(
          p.salario_bruto
        ).toLocaleString()}, Deducción CCSS (10.67%) ₡${Number(
          p.deduccion_ccss
        ).toLocaleString()}, Salario Neto ₡${Number(p.salario_neto).toLocaleString()}.`;
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
