const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const { deepseek, DEFAULT_MODEL } = require('../config/deepseek');

const PROMPT_PATH = path.resolve(__dirname, '../prompts/agenteAnalista.txt');

function getAnalistaPrompt() {
  if (fs.existsSync(PROMPT_PATH)) {
    return fs.readFileSync(PROMPT_PATH, 'utf8');
  }
  return 'Eres el Agente Analista Ejecutivo de Recursos Humanos de TicoTech Solutions S.A.';
}

/**
 * Calcula determinísticamente en SQL los 7 indicadores requeridos por RF-BE-13.
 */
async function calcularMetricasDeterministas(fechaStr) {
  const targetDate = fechaStr || new Date().toISOString().slice(0, 10);

  // 1. Personas ausentes hoy (desglosadas por vacaciones, permiso, incapacidad y departamento)
  const [ausentesRows] = await pool.query(
    `SELECT s.tipo, d.nombre AS departamento, COUNT(*) AS cantidad
     FROM solicitudes s
     JOIN colaboradores c ON s.colaborador_id = c.id
     LEFT JOIN departamentos d ON c.departamento_id = d.id
     WHERE s.estado = 'aprobada' AND ? BETWEEN s.fecha_inicio AND s.fecha_fin
     GROUP BY s.tipo, d.nombre`,
    [targetDate]
  );

  const [incapacidadesHoy] = await pool.query(
    `SELECT 'incapacidad' AS tipo, d.nombre AS departamento, COUNT(*) AS cantidad
     FROM incapacidades i
     JOIN colaboradores c ON i.colaborador_id = c.id
     LEFT JOIN departamentos d ON c.departamento_id = d.id
     WHERE ? BETWEEN i.fecha_inicio AND i.fecha_fin
     GROUP BY d.nombre`,
    [targetDate]
  );

  const ausenciasDetalle = [...ausentesRows, ...incapacidadesHoy];
  const totalAusentes = ausenciasDetalle.reduce((acc, curr) => acc + Number(curr.cantidad), 0);

  // 2. Solicitudes pendientes de aprobación y cuántas llevan más de 3 días sin respuesta
  const [solicitudesRows] = await pool.query(
    `SELECT 
       COUNT(*) AS total_pendientes,
       SUM(CASE WHEN DATEDIFF(?, creada_en) > 3 THEN 1 ELSE 0 END) AS pendientes_mas_3_dias
     FROM solicitudes
     WHERE estado = 'pendiente'`,
    [targetDate]
  );
  const totalPendientes = Number(solicitudesRows[0]?.total_pendientes || 0);
  const pendientesMas3Dias = Number(solicitudesRows[0]?.pendientes_mas_3_dias || 0);

  // 3. Incapacidades activas y días acumulados en el mes actual
  const [incapRows] = await pool.query(
    `SELECT 
       COUNT(*) AS activas,
       IFNULL(SUM(dias), 0) AS dias_acumulados_mes
     FROM incapacidades
     WHERE estado = 'activa' OR (YEAR(fecha_inicio) = YEAR(?) AND MONTH(fecha_inicio) = MONTH(?))`,
    [targetDate, targetDate]
  );
  const incapacidadesActivas = Number(incapRows[0]?.activas || 0);
  const diasIncapacidadMes = Number(incapRows[0]?.dias_acumulados_mes || 0);

  // 4. Ingresos y salidas del mes, más la tasa de rotación acumulada
  const [movRows] = await pool.query(
    `SELECT 
       SUM(CASE WHEN tipo_movimiento IN ('nuevo_ingreso', 'reingreso') THEN 1 ELSE 0 END) AS ingresos_mes,
       SUM(CASE WHEN tipo_movimiento IN ('renuncia', 'despido_con_responsabilidad', 'despido_sin_responsabilidad') THEN 1 ELSE 0 END) AS salidas_mes
     FROM movimientos_personal
     WHERE YEAR(fecha_efectiva) = YEAR(?) AND MONTH(fecha_efectiva) = MONTH(?)`,
    [targetDate, targetDate]
  );
  const [activosRows] = await pool.query(`SELECT COUNT(*) AS total_activos FROM colaboradores WHERE estado = 'activo'`);
  const totalActivos = Number(activosRows[0]?.total_activos || 50);
  const ingresosMes = Number(movRows[0]?.ingresos_mes || 0);
  const salidasMes = Number(movRows[0]?.salidas_mes || 0);
  const tasaRotacion = totalActivos > 0 ? Number(((salidasMes / totalActivos) * 100).toFixed(2)) : 0;

  // 5. Colaboradores con más de 20 días de vacaciones acumulados (alerta de pasivo laboral)
  const [pasivoRows] = await pool.query(
    `SELECT c.id, c.nombre, d.nombre AS departamento, SUM(sv.dias_disponibles) AS dias_acumulados
     FROM saldos_vacaciones sv
     JOIN colaboradores c ON sv.colaborador_id = c.id
     LEFT JOIN departamentos d ON c.departamento_id = d.id
     GROUP BY c.id, c.nombre, d.nombre
     HAVING dias_acumulados > 20
     ORDER BY dias_acumulados DESC`
  );
  const totalColaboradoresPasivo = pasivoRows.length;

  // 6. Uso del chatbot del día anterior (total consultas, % resuelto sin escalar, latencia promedio)
  const [chatUsoRows] = await pool.query(
    `SELECT 
       COUNT(*) AS total_consultas,
       IFNULL(ROUND(AVG(latencia_ms), 0), 0) AS latencia_promedio_ms,
       IFNULL(ROUND(SUM(CASE WHEN escalada = FALSE THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 1), 100.0) AS porcentaje_resueltas
     FROM consultas_chat
     WHERE DATE(fecha) = DATE_SUB(?, INTERVAL 1 DAY)`,
    [targetDate]
  );
  const totalConsultasAyer = Number(chatUsoRows[0]?.total_consultas || 0);
  const latenciaPromedioAyer = Number(chatUsoRows[0]?.latencia_promedio_ms || 0);
  const porcentajeResueltoAyer = Number(chatUsoRows[0]?.porcentaje_resueltas || 100);

  // 7. Top 5 de temas más consultados y preguntas sin respuesta / escaladas
  const [topTemas] = await pool.query(
    `SELECT intencion, COUNT(*) AS total
     FROM consultas_chat
     GROUP BY intencion
     ORDER BY total DESC
     LIMIT 5`
  );
  const [preguntasEscaladas] = await pool.query(
    `SELECT pregunta, fecha
     FROM consultas_chat
     WHERE escalada = TRUE OR resuelta = FALSE
     ORDER BY fecha DESC
     LIMIT 5`
  );

  return {
    fecha: targetDate,
    '1_personas_ausentes': {
      total: totalAusentes,
      desglose: ausenciasDetalle,
    },
    '2_solicitudes_pendientes': {
      total: totalPendientes,
      mas_de_3_dias: pendientesMas3Dias,
    },
    '3_incapacidades': {
      activas: incapacidadesActivas,
      dias_acumulados_mes: diasIncapacidadMes,
    },
    '4_rotacion_personal': {
      ingresos_mes: ingresosMes,
      salidas_mes: salidasMes,
      total_activos: totalActivos,
      tasa_rotacion_pct: tasaRotacion,
    },
    '5_pasivo_laboral_vacaciones': {
      total_colaboradores_alerta: totalColaboradoresPasivo,
      colaboradores_mas_20_dias: pasivoRows.slice(0, 5),
    },
    '6_chatbot_uso_dia_anterior': {
      total_consultas: totalConsultasAyer,
      latencia_promedio_ms: latenciaPromedioAyer,
      porcentaje_resueltas: porcentajeResueltoAyer,
    },
    '7_top_temas_consultados': {
      temas: topTemas,
      preguntas_sin_resolver: preguntasEscaladas,
    },
  };
}

/**
 * Genera el reporte diario completo con resumen ejecutivo redactado por DeepSeek.
 */
async function generarReporteDiario(fecha = null, generadoPor = 'cronJobs_analistaAgent') {
  const metricas = await calcularMetricasDeterministas(fecha);
  const fechaReporte = metricas.fecha;

  const promptTemplate = getAnalistaPrompt();
  const systemPrompt = promptTemplate.replace('{{metricas_json}}', JSON.stringify(metricas, null, 2));

  let resumenTexto = '';

  try {
    const completion = await deepseek.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content:
            `Por favor redacta el resumen ejecutivo para la gerencia de Recursos Humanos correspondiente al día ${fechaReporte}. ` +
            `Recuerda la regla estricta: entre 3 y 5 frases concisas, sin alterar ni inventar ninguna cifra numérica.`,
        },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });
    resumenTexto = completion.choices[0]?.message?.content?.trim() || '';
  } catch (err) {
    console.error('Fallo en LLM para redactar resumen, usando redacción determinista:', err.message);
    resumenTexto =
      `Para el día de hoy se registran ${metricas['1_personas_ausentes'].total} colaboradores ausentes entre permisos y vacaciones. ` +
      `Se mantienen ${metricas['2_solicitudes_pendientes'].total} solicitudes de personal pendientes en el portal, de las cuales ${metricas['2_solicitudes_pendientes'].mas_de_3_dias} superan el umbral de 3 días de espera. ` +
      `En materia de pasivo vacacional, se identifican ${metricas['5_pasivo_laboral_vacaciones'].total_colaboradores_alerta} colaboradores con más de 20 días de vacaciones acumulados. ` +
      `El chatbot corporativo registró ${metricas['6_chatbot_uso_dia_anterior'].total_consultas} consultas con una tasa de resolución del ${metricas['6_chatbot_uso_dia_anterior'].porcentaje_resueltas}%.`;
  }

  // Guardar en MySQL tabla reportes_diarios (UPSERT por fecha)
  try {
    await pool.query(
      `INSERT INTO reportes_diarios (fecha, datos_json, resumen_texto, generado_por)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         datos_json = VALUES(datos_json),
         resumen_texto = VALUES(resumen_texto),
         generado_por = VALUES(generado_por)`,
      [fechaReporte, JSON.stringify(metricas), resumenTexto, generadoPor]
    );
  } catch (dbErr) {
    console.error('Error al guardar reporte diario en base de datos:', dbErr.message);
  }

  return {
    fecha: fechaReporte,
    metricas,
    resumen_ejecutivo: resumenTexto,
    generado_por: generadoPor,
  };
}

module.exports = {
  calcularMetricasDeterministas,
  generarReporteDiario,
};
