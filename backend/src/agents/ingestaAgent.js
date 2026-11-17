const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');

const { hasValidCredentials, listDriveFiles, downloadOrExportFile } = require('../config/googleDrive');
const { addDocuments, getVectorCount } = require('../config/vectorStore');
const { pool } = require('../config/db');

// Directorios de respaldo donde residen los 10 documentos del proyecto
const LOCAL_POLICIES_DIR = path.resolve(__dirname, '../../../docs/politicas');
const DOCS_DIR = path.resolve(__dirname, '../../../docs');

/**
 * Metadatos oficiales predefinidos para los 10 documentos de políticas de TicoTech
 */
const METADATA_MAP = {
  1: {
    titulo: 'Documento 1 - Política de Vacaciones y Calendario de Feriados Oficiales',
    version: '2.1',
    drive_file_id: '1drv_tt_pol_01_vacaciones_2026',
    url_drive: 'https://drive.google.com/file/d/1drv_tt_pol_01_vacaciones_2026/view',
    tipo: 'pdf',
  },
  2: {
    titulo: 'Documento 2 - Política de Permisos y Licencias Especiales',
    version: '1.4',
    drive_file_id: '1drv_tt_pol_02_permisos_2026',
    url_drive: 'https://drive.google.com/file/d/1drv_tt_pol_02_permisos_2026/view',
    tipo: 'doc',
  },
  3: {
    titulo: 'Documento 3 - Protocolo de Gestión de Incapacidades CCSS e INS',
    version: '2.0',
    drive_file_id: '1drv_tt_pol_03_incapacidades_2026',
    url_drive: 'https://drive.google.com/file/d/1drv_tt_pol_03_incapacidades_2026/view',
    tipo: 'doc',
  },
  4: {
    titulo: 'Documento 4 - Reglamento de Jornada Laboral, Asistencia y Teletrabajo',
    version: '3.0',
    drive_file_id: '1drv_tt_pol_04_teletrabajo_2026',
    url_drive: 'https://drive.google.com/file/d/1drv_tt_pol_04_teletrabajo_2026/view',
    tipo: 'doc',
  },
  5: {
    titulo: 'Documento 5 - Política de Remuneración, Planilla y Aguinaldo',
    version: '1.5',
    drive_file_id: '1drv_tt_pol_05_remuneracion_2026',
    url_drive: 'https://drive.google.com/file/d/1drv_tt_pol_05_remuneracion_2026/view',
    tipo: 'sheet',
  },
  6: {
    titulo: 'Documento 6 - Guía de Beneficios Corporativos y Asociación Solidarista',
    version: '2.2',
    drive_file_id: '1drv_tt_pol_06_beneficios_2026',
    url_drive: 'https://drive.google.com/file/d/1drv_tt_pol_06_beneficios_2026/view',
    tipo: 'doc',
  },
  7: {
    titulo: 'Documento 7 - Manual de Onboarding, Periodo de Prueba y Salida',
    version: '1.3',
    drive_file_id: '1drv_tt_pol_07_onboarding_salida_2026',
    url_drive: 'https://drive.google.com/file/d/1drv_tt_pol_07_onboarding_salida_2026/view',
    tipo: 'doc',
  },
  8: {
    titulo: 'Documento 8 - Modelo de Evaluación de Desempeño y Plan de Mejora (PIP)',
    version: '1.8',
    drive_file_id: '1drv_tt_pol_08_desempeno_pip_2026',
    url_drive: 'https://drive.google.com/file/d/1drv_tt_pol_08_desempeno_pip_2026/view',
    tipo: 'doc',
  },
  9: {
    titulo: 'Documento 9 - Código de Conducta y Prevención del Hostigamiento (Ley 7476)',
    version: '2.4',
    drive_file_id: '1drv_tt_pol_09_conducta_acoso_2026',
    url_drive: 'https://drive.google.com/file/d/1drv_tt_pol_09_conducta_acoso_2026/view',
    tipo: 'doc',
  },
  10: {
    titulo: 'Documento 10 - Política de Protección de Datos Personales (Ley 8968)',
    version: '2.0',
    drive_file_id: '1drv_tt_pol_10_privacidad_datos_2026',
    url_drive: 'https://drive.google.com/file/d/1drv_tt_pol_10_privacidad_datos_2026/view',
    tipo: 'doc',
  },
};

/**
 * Extrae texto de un buffer PDF con pdf-parse
 */
async function parsePdfBuffer(buffer) {
  const parser = new PDFParse(new Uint8Array(buffer));
  const res = await parser.getText();
  return res.text;
}

/**
 * Extrae texto de un buffer DOCX con mammoth
 */
async function parseDocxBuffer(buffer) {
  const res = await mammoth.extractRawText({ buffer });
  return res.value;
}

/**
 * Extrae texto de un buffer XLSX con xlsx (hoja a CSV formateado)
 */
function parseXlsxBuffer(buffer) {
  const wb = xlsx.read(buffer, { type: 'buffer' });
  const sheetTexts = wb.SheetNames.map((name) => {
    const csv = xlsx.utils.sheet_to_csv(wb.Sheets[name]);
    return `--- Hoja: ${name} ---\n${csv}`;
  });
  return sheetTexts.join('\n\n');
}

/**
 * Divide el texto de una política en fragmentos lógicos por sección.
 * Cada fragmento retiene la información de la sección y del documento.
 */
function chunkDocumentText(fullText, docMeta) {
  const chunks = [];
  const lines = fullText.split('\n').map((l) => l.trim()).filter(Boolean);

  let currentSection = 'Introducción y Disposiciones Generales';
  let buffer = [];

  const sectionRegex = /^(\d+[\.\)]|\bsección\b|\bcapítulo\b|\bartículo\b|\bcalendario\b|\bpolítica\b)/i;

  for (const line of lines) {
    // Si la línea parece ser un encabezado de sección
    if (sectionRegex.test(line) && line.length < 90) {
      if (buffer.length > 0) {
        chunks.push({
          texto: buffer.join('\n'),
          seccion: currentSection,
        });
        buffer = [];
      }
      currentSection = line.replace(/^[●\-\*\s]+/, '');
    } else {
      buffer.push(line);
      // Límite de tamaño por chunk (alrededor de 600 caracteres)
      if (buffer.join(' ').length >= 650) {
        chunks.push({
          texto: buffer.join('\n'),
          seccion: currentSection,
        });
        buffer = [];
      }
    }
  }

  if (buffer.length > 0) {
    chunks.push({
      texto: buffer.join('\n'),
      seccion: currentSection,
    });
  }

  // Mapear con los metadatos requeridos: titulo, seccion, version, url_drive
  return chunks.map((c, idx) => ({
    id: `${docMeta.drive_file_id}_chunk_${String(idx + 1).padStart(3, '0')}`,
    document: `[${docMeta.titulo} | Sección: ${c.seccion}]\n${c.texto}`,
    metadata: {
      titulo: docMeta.titulo,
      seccion: c.seccion,
      version: docMeta.version,
      url_drive: docMeta.url_drive,
      drive_file_id: docMeta.drive_file_id,
      chunk_index: idx + 1,
    },
  }));
}

/**
 * Carga los 10 documentos desde archivos locales (fallback / entorno de desarrollo)
 */
async function loadLocalDocuments() {
  const documents = [];

  for (let i = 1; i <= 10; i++) {
    const meta = METADATA_MAP[i];
    let text = '';

    if (i === 1) {
      // Documento 1: PDF oficial
      const pdfPath = path.join(DOCS_DIR, 'Documento 1 - Política de Vacaciones y Calendario de Feriados Oficiales.pdf');
      if (fs.existsSync(pdfPath)) {
        text = await parsePdfBuffer(fs.readFileSync(pdfPath));
      } else {
        const docxPath = path.join(LOCAL_POLICIES_DIR, 'Documento 1 - Política de Vacaciones y Calendario de Feriados Oficiales.docx');
        text = await parseDocxBuffer(fs.readFileSync(docxPath));
      }
    } else if (i === 5) {
      // Documento 5: Hoja de cálculo XLSX / Sheets
      const xlsxPath = path.join(LOCAL_POLICIES_DIR, 'Documento 5 - Fechas de Pago, Aguinaldo y Feriados.xlsx');
      text = parseXlsxBuffer(fs.readFileSync(xlsxPath));
    } else {
      // Documentos 2, 3, 4, 6, 7, 8, 9, 10: Google Docs / Word
      const files = fs.readdirSync(LOCAL_POLICIES_DIR);
      const target = files.find((f) => f.startsWith(`Documento ${i} `) && f.endsWith('.docx'));
      if (target) {
        text = await parseDocxBuffer(fs.readFileSync(path.join(LOCAL_POLICIES_DIR, target)));
      }
    }

    if (text) {
      documents.push({ meta, text, source: 'local' });
    }
  }

  return documents;
}

/**
 * Carga documentos desde Google Drive API v3
 */
async function loadDriveDocuments() {
  const driveFiles = await listDriveFiles();
  const documents = [];

  for (let i = 1; i <= 10; i++) {
    const meta = METADATA_MAP[i];
    const match = driveFiles.find((df) => df.name && df.name.toLowerCase().includes(`documento ${i}`));
    if (!match) continue;

    const downloaded = await downloadOrExportFile(match);
    let text = '';

    if (downloaded.type === 'text' || downloaded.type === 'csv') {
      text = downloaded.content;
    } else if (downloaded.type === 'binary') {
      if (match.mimeType === 'application/pdf' || match.name.endsWith('.pdf')) {
        text = await parsePdfBuffer(downloaded.buffer);
      } else if (match.name.endsWith('.docx')) {
        text = await parseDocxBuffer(downloaded.buffer);
      } else if (match.name.endsWith('.xlsx')) {
        text = parseXlsxBuffer(downloaded.buffer);
      }
    }

    if (text) {
      documents.push({
        meta: {
          ...meta,
          drive_file_id: match.id,
          url_drive: match.webViewLink || meta.url_drive,
        },
        text,
        source: 'google_drive',
      });
    }
  }

  return documents;
}

/**
 * Actualiza los chunks y fecha en la tabla documentos_politicas de MySQL
 */
async function syncMysqlMetadata(docMeta, totalChunks) {
  try {
    await pool.query(
      `UPDATE documentos_politicas 
       SET total_chunks = ?, ultima_sincronizacion = NOW() 
       WHERE drive_file_id = ?`,
      [totalChunks, docMeta.drive_file_id]
    );
  } catch (err) {
    // Si la BD relacional no está conectada o no existe la tabla, no interrumpe el pipeline vectorial
  }
}

/**
 * Función principal del agente de ingesta:
 * 1. Verifica credenciales de Google Service Account (fuera de Git).
 * 2. Lee los 10 documentos (PDF, Docs y Sheets).
 * 3. Segmenta y guarda vectores + metadatos (titulo, seccion, version, url_drive) en ChromaDB.
 */
async function ejecutarIngesta(options = {}) {
  const credStatus = hasValidCredentials();
  console.log('--- [IngestaAgent] Verificando credenciales de Google Cloud Console ---');
  if (credStatus.exists) {
    console.log(`✅ Archivo de credenciales encontrado en: ${credStatus.path}`);
    console.log(`🔑 Service Account autenticada como: ${credStatus.clientEmail}`);
  } else {
    console.log(`ℹ️ No se detectó service-account.json en disco o GOOGLE_APPLICATION_CREDENTIALS no está configurado.`);
    console.log(`📂 Ejecutando ingesta con los 10 documentos del repositorio (PDF, Docs y Sheets)...`);
  }

  // 1. Cargar documentos
  let loadedDocs = [];
  let origen = 'local';

  if (credStatus.exists && process.env.GOOGLE_DRIVE_FOLDER_ID && !options.forzarLocal) {
    try {
      console.log('📡 Conectando a Google Drive API v3...');
      loadedDocs = await loadDriveDocuments();
      origen = 'google_drive';
    } catch (err) {
      console.warn(`⚠️ Error al leer de Drive (${err.message}). Cambiando a documentos locales.`);
      loadedDocs = await loadLocalDocuments();
    }
  } else {
    loadedDocs = await loadLocalDocuments();
  }

  console.log(`📄 Se leyeron ${loadedDocs.length} documentos de políticas (formato PDF, Docs y Sheets).`);

  // 2. Fragmentación y Vectorización
  let totalChunksIngestados = 0;
  const resumenPorDocumento = [];

  for (const doc of loadedDocs) {
    const chunks = chunkDocumentText(doc.text, doc.meta);
    if (chunks.length === 0) continue;

    const ids = chunks.map((c) => c.id);
    const documents = chunks.map((c) => c.document);
    const metadatas = chunks.map((c) => c.metadata);

    // Guardar en la base vectorial con sus metadatos requeridos
    await addDocuments({ ids, documents, metadatas });

    // Sincronizar conteo en MySQL
    await syncMysqlMetadata(doc.meta, chunks.length);

    totalChunksIngestados += chunks.length;
    resumenPorDocumento.push({
      id: doc.meta.drive_file_id,
      titulo: doc.meta.titulo,
      version: doc.meta.version,
      tipo: doc.meta.tipo,
      chunks: chunks.length,
      url_drive: doc.meta.url_drive,
    });
  }

  const vectorCount = await getVectorCount();

  const resultado = {
    ok: true,
    origen,
    credenciales_google: credStatus,
    documentos_leidos: loadedDocs.length,
    total_chunks: totalChunksIngestados,
    vectores_en_base: vectorCount,
    documentos: resumenPorDocumento,
  };

  console.log(`✅ Ingesta finalizada exitosamente: ${totalChunksIngestados} vectores guardados con metadatos (titulo, seccion, version, url_drive).`);
  return resultado;
}

if (require.main === module) {
  ejecutarIngesta()
    .then((res) => {
      console.log(JSON.stringify(res, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error en el proceso de ingesta:', err);
      process.exit(1);
    });
}

module.exports = {
  ejecutarIngesta,
  hasValidCredentials,
  METADATA_MAP,
  chunkDocumentText,
};
