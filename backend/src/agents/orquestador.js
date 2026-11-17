const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const { deepseek, DEFAULT_MODEL } = require('../config/deepseek');
const { consultarPoliticas } = require('./politicasAgent');
const { consultarDatos } = require('./datosAgent');

const PROMPT_PATH = path.resolve(__dirname, '../prompts/orquestador.txt');

function getOrquestadorPrompt() {
  if (fs.existsSync(PROMPT_PATH)) {
    return fs.readFileSync(PROMPT_PATH, 'utf8');
  }
  return 'Eres el Orquestador de RRHH de TicoTech Solutions S.A.';
}

/**
 * Detecta patrones directos de violación de privacidad de terceros bajo Ley 8968.
 */
function verificarPrivacidadTerceros(pregunta, usuario) {
  const p = pregunta.toLowerCase();
  const usuarioNombre = (usuario.nombre || '').toLowerCase();

  // Patrones de consulta sobre terceros
  const patronesTerceros = [
    /salario\s+de\s+(?!mi\b|mis\b)/i,
    /cuanto\s+gana\s+(?!yo\b)/i,
    /sueldo\s+de\s+(?!mi\b)/i,
    /vacaciones\s+de\s+(?!mi\b|mis\b)/i,
    /dias\s+de\s+(?!mi\b|mis\b)(?:compañero|colega|jefe|gerente|[a-z]+)/i,
    /evaluacion\s+de\s+(?!mi\b)/i,
    /incapacidad\s+de\s+(?!mi\b)/i,
    /expediente\s+de\s+(?!mi\b)/i,
  ];

  // Si incluye nombres de compañeros o roles de terceros específicos
  const contieneTercero =
    patronesTerceros.some((regex) => regex.test(p)) ||
    (p.includes('de mi compañero') || p.includes('de otro') || p.includes('del gerente general') || p.includes('de carlos') || p.includes('de ana') || p.includes('de maria') || p.includes('de juan'));

  // Asegurarse de que no sea una auto-consulta donde el usuario dice su propio nombre
  if (contieneTercero && !p.includes(usuarioNombre)) {
    return true;
  }
  return false;
}

/**
 * Clasifica la intención del mensaje del usuario.
 */
async function clasificarIntencion(pregunta, usuario) {
  // 1. Chequeo estricto de privacidad determinista
  if (verificarPrivacidadTerceros(pregunta, usuario)) {
    return {
      intencion: 'RESTRINGIDA_PRIVACIDAD',
      justificacion: 'Consulta sobre datos salariales, vacaciones o información confidencial de un tercero.',
      requiere_politicas: false,
      requiere_datos: false,
      mensaje_bloqueo:
        '⛔ **Acceso Restringido por Privacidad (Ley N° 8968)**:\n\n' +
        'Por disposiciones estrictas de la Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales (Ley 8968 de Costa Rica) ' +
        'y las Políticas de Seguridad de la Información de TicoTech Solutions S.A., no es posible consultar salarios, vacaciones, evaluaciones ni datos personales de otros colaboradores o jefaturas.\n\n' +
        'Únicamente puedes consultar tus propios registros o la normativa general de la empresa.',
    };
  }

  // 2. Clasificación mediante DeepSeek
  const promptTemplate = getOrquestadorPrompt();
  const systemPrompt = promptTemplate
    .replace('{{usuario_id}}', String(usuario.id))
    .replace('{{usuario_nombre}}', usuario.nombre || 'Colaborador')
    .replace('{{usuario_rol}}', usuario.rol || 'colaborador')
    .replace('{{usuario_departamento}}', usuario.departamento || 'General');

  try {
    const completion = await deepseek.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Consulta a clasificar: "${pregunta}"\nDevuelve únicamente el JSON requerido.`,
        },
      ],
      temperature: 0.0,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return parsed;
  } catch (err) {
    console.error('Fallo clasificación con LLM en orquestador, aplicando heurística:', err.message);

    // Heurística de respaldo
    const p = pregunta.toLowerCase();
    if (p.includes('cuantos dias me quedan') || p.includes('mi saldo') || p.includes('mi salario') || p.includes('mi deduccion')) {
      if (p.includes('segun la politica') || p.includes('puedo pasarlos') || p.includes('como se calculan')) {
        return { intencion: 'MIXTA', requiere_politicas: true, requiere_datos: true };
      }
      return { intencion: 'DATO_PERSONAL', requiere_politicas: false, requiere_datos: true };
    }
    return { intencion: 'POLITICA', requiere_politicas: true, requiere_datos: false };
  }
}

/**
 * Orquestador principal del Chatbot TicoBot RRHH.
 */
async function procesarMensaje(pregunta, usuario, sesionId = 'default_session') {
  const inicioMs = Date.now();
  let respuestaFinal = '';
  let fuentes = [];
  let escalable = false;
  let agenteUtilizado = 'orquestador';
  let intencionDb = 'general';
  let confianzaRag = 0.85;

  try {
    // 1. Clasificar intención
    const clasif = await clasificarIntencion(pregunta, usuario);
    const intencion = clasif.intencion || 'POLITICA';

    // 2. Procesar según la intención clasificada
    if (intencion === 'RESTRINGIDA_PRIVACIDAD') {
      intencionDb = 'privacidad_rechazada';
      agenteUtilizado = 'orquestador';
      respuestaFinal = clasif.mensaje_bloqueo ||
        '⛔ Consulta rechazada: La Ley 8968 prohíbe el acceso a datos personales de terceros sin consentimiento expreso.';
      escalable = false;
    } else if (intencion === 'FUERA_DE_ALCANCE') {
      intencionDb = 'general';
      agenteUtilizado = 'orquestador';
      respuestaFinal =
        'Hola. Como asistente de Recursos Humanos de TicoTech Solutions S.A., estoy especializado exclusivamente en responder consultas sobre políticas laborales de Costa Rica, beneficios de la empresa, feriados oficiales y tus datos personales de RRHH (vacaciones, planillas, etc.).\n\n' +
        '¿En qué tema laboral o de personal te puedo asistir hoy?';
      escalable = false;
    } else if (intencion === 'MIXTA') {
      intencionDb = 'politicas_rrhh';
      agenteUtilizado = 'orquestador';

      // Ejecución en paralelo de ambos agentes
      const [resPoliticas, resDatos] = await Promise.all([
        consultarPoliticas(pregunta, { nResults: 3 }),
        consultarDatos(pregunta, usuario),
      ]);

      fuentes = resPoliticas.fuentes || [];
      confianzaRag = resPoliticas.maxScore || 0.8;
      escalable = resPoliticas.escalable;

      // Síntesis coherente mediante DeepSeek
      try {
        const sintesisComp = await deepseek.chat.completions.create({
          model: DEFAULT_MODEL,
          messages: [
            {
              role: 'system',
              content:
                'Eres el asistente sintetizador de TicoTech RRHH. ' +
                'Combina la respuesta de la política oficial y los datos del colaborador en un único mensaje armonioso, fluido y claro. ' +
                'Conserva las citas a documentos oficiales y las cifras numéricas exactas.',
            },
            {
              role: 'user',
              content:
                `Pregunta: "${pregunta}"\n\n` +
                `Respuesta de Políticas:\n${resPoliticas.respuesta}\n\n` +
                `Respuesta de Datos Personales:\n${resDatos.respuesta}\n\n` +
                `Sintetiza una sola respuesta amigable.`,
            },
          ],
          temperature: 0.2,
          max_tokens: 700,
        });
        respuestaFinal = sintesisComp.choices[0]?.message?.content?.trim() || `${resDatos.respuesta}\n\n${resPoliticas.respuesta}`;
      } catch {
        respuestaFinal = `${resDatos.respuesta}\n\n${resPoliticas.respuesta}`;
      }
    } else if (intencion === 'DATO_PERSONAL' || (intencion === 'DATO_AGREGADO_RRHH' && usuario.rol === 'rrhh')) {
      intencionDb = intencion === 'DATO_AGREGADO_RRHH' ? 'analitica_rrhh' : 'datos_personales';
      agenteUtilizado = 'datosAgent';

      const resDatos = await consultarDatos(pregunta, usuario);
      respuestaFinal = resDatos.respuesta;
      escalable = false;
    } else {
      // Por defecto: 'POLITICA'
      intencionDb = 'politicas_rrhh';
      agenteUtilizado = 'politicasAgent';

      const resPoliticas = await consultarPoliticas(pregunta, { nResults: 4 });
      respuestaFinal = resPoliticas.respuesta;
      fuentes = resPoliticas.fuentes || [];
      confianzaRag = resPoliticas.maxScore || 0.85;
      escalable = resPoliticas.escalable;
    }
  } catch (error) {
    console.error('Error general en procesarMensaje:', error.message);
    respuestaFinal =
      'Disculpa, ocurrió un error momentáneo al procesar tu solicitud. Por favor intenta nuevamente o solicita abrir un ticket de soporte.';
    escalable = true;
  }

  const latenciaMs = Date.now() - inicioMs;

  // 3. Registrar auditoría en MySQL (tabla consultas_chat)
  let consultaId = null;
  try {
    const [insertResult] = await pool.query(
      `INSERT INTO consultas_chat
       (colaborador_id, sesion_id, pregunta, intencion, agente_utilizado, documentos_citados, confianza_rag, resuelta, escalada, latencia_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario.id,
        sesionId,
        pregunta,
        intencionDb,
        agenteUtilizado,
        fuentes.length > 0 ? JSON.stringify(fuentes) : null,
        confianzaRag,
        !escalable,
        false,
        latenciaMs,
      ]
    );
    consultaId = insertResult.insertId;
  } catch (auditErr) {
    console.error('No se pudo registrar la auditoría en consultas_chat:', auditErr.message);
  }

  return {
    respuesta: respuestaFinal,
    fuentes,
    escalable,
    intencion: intencionDb,
    agente_utilizado: agenteUtilizado,
    latencia_ms: latenciaMs,
    consulta_id: consultaId,
  };
}

module.exports = {
  procesarMensaje,
  clasificarIntencion,
};
