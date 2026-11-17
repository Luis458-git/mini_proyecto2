const fs = require('fs');
const path = require('path');
const { queryVectorStore, localStore } = require('../config/vectorStore');
const { deepseek, DEFAULT_MODEL } = require('../config/deepseek');

const PROMPT_PATH = path.resolve(__dirname, '../prompts/agentePoliticas.txt');

/**
 * Carga el system prompt desacoplado desde disco.
 */
function getSystemPrompt() {
  if (fs.existsSync(PROMPT_PATH)) {
    return fs.readFileSync(PROMPT_PATH, 'utf8');
  }
  return 'Eres el Agente de Políticas de RRHH de TicoTech Solutions S.A. en Costa Rica.';
}

/**
 * Ejecuta la consulta de políticas en la base vectorial y genera una respuesta fundamentada con citas.
 * @param {string} pregunta - Pregunta en lenguaje natural
 * @param {object} opciones - { nResults = 4, threshold = 0.35 }
 * @returns {Promise<{ respuesta: string, fuentes: Array, escalable: boolean, maxScore: number }>}
 */
async function consultarPoliticas(pregunta, opciones = {}) {
  const { nResults = 4, threshold = 0.35 } = opciones;
  const pregLower = pregunta.toLowerCase();

  // Caso especial: El usuario pide consultar qué documentos/archivos hay en Google Drive
  if (
    pregLower.includes('lo que hay en el drive') ||
    pregLower.includes('que hay en el drive') ||
    pregLower.includes('qué hay en el drive') ||
    pregLower.includes('que documentos hay') ||
    pregLower.includes('qué documentos hay') ||
    pregLower.includes('cuales documentos') ||
    pregLower.includes('cuáles documentos') ||
    pregLower.includes('lista de politicas') ||
    pregLower.includes('documentos en drive') ||
    pregLower.includes('archivos en drive')
  ) {
    localStore.load();
    const docsUnicos = new Map();
    for (const rec of localStore.records) {
      const m = rec.metadata || {};
      if (m.titulo && !docsUnicos.has(m.titulo)) {
        docsUnicos.set(m.titulo, {
          titulo: m.titulo,
          seccion: 'Catálogo Oficial',
          version: m.version || '1.0',
          url_drive: m.url_drive || 'https://drive.google.com/',
          fecha_vigencia: m.fecha_vigencia || '2026',
        });
      }
    }
    const listaFuentes = Array.from(docsUnicos.values());
    const listadoTexto = listaFuentes
      .map((f, idx) => `${idx + 1}. **${f.titulo}** (Versión ${f.version})`)
      .join('\n');

    return {
      respuesta:
        `📂 **Documentos Oficiales Sincronizados desde Google Drive (${listaFuentes.length} documentos, ${localStore.records.length} fragmentos vectorizados en ChromaDB):**\n\n` +
        `${listadoTexto}\n\n` +
        `Puedes hacer clic en cualquiera de las tarjetas de abajo para abrir el archivo original en Google Drive, o preguntarme sobre cualquier tema contenido en ellos.`,
      fuentes: listaFuentes,
      escalable: false,
      maxScore: 1.0,
    };
  }

  // 1. Consultar base vectorial (ChromaDB / VectorStore local)
  const queryResult = await queryVectorStore(pregunta, nResults);
  const docs = (queryResult && queryResult.documents && queryResult.documents[0]) || [];
  const metadatas = (queryResult && queryResult.metadatas && queryResult.metadatas[0]) || [];
  const distances = (queryResult && queryResult.distances && queryResult.distances[0]) || [];

  // Calcular similitud estimada (score = 1 - distance)
  const scores = distances.map((d) => Math.max(0, 1 - (d || 0)));
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;

  // Si no hay documentos o la similitud es demasiado baja
  if (docs.length === 0 || maxScore < threshold) {
    return {
      respuesta:
        'Esta política o beneficio específico no se encuentra registrado en los documentos oficiales vigentes de TicoTech Solutions S.A. ' +
        '¿Deseas que aperturemos un ticket para que el equipo de Recursos Humanos atienda tu consulta personalizada?',
      fuentes: [],
      escalable: true,
      maxScore,
    };
  }

  // 2. Preparar contexto con los fragmentos y metadatos
  const fuentesMap = new Map();
  const contextChunks = [];

  for (let i = 0; i < docs.length; i++) {
    const meta = metadatas[i] || {};
    const chunkText = docs[i];
    const docId = meta.titulo || `Documento ${i + 1}`;

    if (!fuentesMap.has(docId)) {
      fuentesMap.set(docId, {
        titulo: meta.titulo || 'Política Interna TicoTech',
        seccion: meta.seccion || 'General',
        version: meta.version || '1.0',
        url_drive: meta.url_drive || 'https://drive.google.com/',
        fecha_vigencia: meta.fecha_vigencia || '2026',
      });
    }

    contextChunks.push(
      `--- [${meta.titulo || 'Doc'} | Sección: ${meta.seccion || 'N/A'} | Versión: ${meta.version || '1.0'}] ---\n${chunkText}`
    );
  }

  const fuentes = Array.from(fuentesMap.values());
  const fragmentosText = contextChunks.join('\n\n');

  // 3. Formular prompt para DeepSeek
  const systemPromptTemplate = getSystemPrompt();
  const systemPrompt = systemPromptTemplate
    .replace('{{pregunta}}', pregunta)
    .replace('{{fragmentos_politicas}}', fragmentosText);

  try {
    const completion = await deepseek.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content:
            `Consulta del colaborador: "${pregunta}"\n\n` +
            `Responde de forma clara citando al final el documento oficial y su URL a Google Drive. ` +
            `Si los fragmentos no responden directamente la consulta (por ejemplo, si preguntan por un beneficio inexistente), indícalo honestamente y ofrece crear un ticket con RRHH.`,
        },
      ],
      temperature: 0.2,
      max_tokens: 800,
    });

    let respuesta = completion.choices[0]?.message?.content?.trim() || '';

    const escalable =
      respuesta.toLowerCase().includes('no se encuentra') ||
      respuesta.toLowerCase().includes('ticket') ||
      respuesta.toLowerCase().includes('escalar') ||
      fuentes.length === 0;

    return {
      respuesta,
      fuentes,
      escalable,
      maxScore,
    };
  } catch (err) {
    console.error('Error al invocar DeepSeek en politicasAgent:', err.message);

    const primerFuente = fuentes[0];
    return {
      respuesta:
        `Según la documentación oficial de TicoTech:\n\n${docs[0].slice(0, 400)}...\n\n` +
        `Fuente: [${primerFuente.titulo} (v${primerFuente.version})](${primerFuente.url_drive})`,
      fuentes,
      escalable: false,
      maxScore,
    };
  }
}

module.exports = {
  consultarPoliticas,
};
