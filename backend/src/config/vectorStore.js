const fs = require('fs');
const path = require('path');
const { ChromaClient } = require('chromadb');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
  quiet: true,
});

const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';
const COLLECTION_NAME = process.env.CHROMA_COLLECTION || 'politicas_rrhh_ticotech';
const LOCAL_STORAGE_DIR = path.resolve(__dirname, '../../chroma_data');
const LOCAL_STORAGE_FILE = path.join(LOCAL_STORAGE_DIR, 'local_vectors.json');

/**
 * Generador de embeddings ligero y semántico (384 dimensiones normalizadas).
 * Permite vectorizar texto en cualquier entorno sin depender de descargas pesadas de modelos.
 */
function generateLocalEmbedding(text, dimensions = 384) {
  const vec = new Float32Array(dimensions);
  const words = String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/\b\w+\b/g) || [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    const sign = (hash & 1) ? 1 : -1;
    vec[idx] += sign * (1 + 1 / (i + 1));
  }

  // Normalización L2
  let norm = 0;
  for (let i = 0; i < dimensions; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) vec[i] /= norm;
  }

  return Array.from(vec);
}

/**
 * Almacén vectorial local (fallback persistente si ChromaDB no está activo en segundo plano).
 */
class LocalVectorStore {
  constructor() {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }
    this.records = [];
    this.load();
  }

  load() {
    if (fs.existsSync(LOCAL_STORAGE_FILE)) {
      try {
        this.records = JSON.parse(fs.readFileSync(LOCAL_STORAGE_FILE, 'utf8'));
      } catch {
        this.records = [];
      }
    }
  }

  save() {
    fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(this.records, null, 2), 'utf8');
  }

  add({ ids, documents, metadatas, embeddings }) {
    for (let i = 0; i < ids.length; i++) {
      const idx = this.records.findIndex((r) => r.id === ids[i]);
      const record = {
        id: ids[i],
        document: documents[i],
        metadata: metadatas[i],
        embedding: embeddings[i],
      };
      if (idx >= 0) {
        this.records[idx] = record;
      } else {
        this.records.push(record);
      }
    }
    this.save();
  }

  count() {
    return this.records.length;
  }

  query(queryText, nResults = 5) {
    const qVec = generateLocalEmbedding(queryText);
    const scored = this.records.map((r) => {
      // Similitud de coseno
      let dot = 0;
      for (let i = 0; i < qVec.length; i++) {
        dot += qVec[i] * (r.embedding[i] || 0);
      }
      return { ...r, score: dot };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, nResults);

    return {
      ids: [top.map((t) => t.id)],
      documents: [top.map((t) => t.document)],
      metadatas: [top.map((t) => t.metadata)],
      distances: [top.map((t) => 1 - t.score)],
    };
  }

  reset() {
    this.records = [];
    this.save();
  }
}

const localStore = new LocalVectorStore();
let chromaClient = null;

function getChromaClient() {
  if (!chromaClient) {
    chromaClient = new ChromaClient({ path: CHROMA_URL });
  }
  return chromaClient;
}

const customEmbeddingFunction = {
  generate: async (texts) => {
    return texts.map((t) => generateLocalEmbedding(t));
  },
};

/**
 * Obtiene o crea la colección en ChromaDB (con fallback automático al almacén local).
 */
async function getOrCreateCollection(name = COLLECTION_NAME) {
  try {
    const client = getChromaClient();
    const collection = await client.getOrCreateCollection({
      name,
      embeddingFunction: customEmbeddingFunction,
    });
    return { type: 'chroma', collection };
  } catch (error) {
    return { type: 'local', collection: localStore };
  }
}

/**
 * Guarda documentos y metadatos en la base vectorial.
 * Metadatos requeridos: titulo, seccion, version, url_drive
 */
async function addDocuments({ ids, documents, metadatas, embeddings }) {
  const finalEmbeddings = embeddings || documents.map((doc) => generateLocalEmbedding(doc));

  // Siempre guardamos en el almacén local persistente
  localStore.add({ ids, documents, metadatas, embeddings: finalEmbeddings });

  // Si ChromaDB está en línea, guardamos también en ChromaDB
  try {
    const client = getChromaClient();
    const collection = await client.getOrCreateCollection({
      name: COLLECTION_NAME,
      embeddingFunction: customEmbeddingFunction,
    });
    await collection.upsert({
      ids,
      documents,
      metadatas,
      embeddings: finalEmbeddings,
    });
  } catch {
    // Modo local transparente
  }

  return { count: ids.length, success: true };
}

/**
 * Realiza una consulta semántica contra la base vectorial.
 */
async function queryVectorStore(queryText, nResults = 5) {
  try {
    const client = getChromaClient();
    const collection = await client.getOrCreateCollection({ name: COLLECTION_NAME });
    const qVec = generateLocalEmbedding(queryText);
    return await collection.query({
      queryEmbeddings: [qVec],
      nResults,
    });
  } catch {
    return localStore.query(queryText, nResults);
  }
}

/**
 * Retorna el número total de fragmentos vectorizados.
 */
async function getVectorCount() {
  try {
    const client = getChromaClient();
    const collection = await client.getOrCreateCollection({ name: COLLECTION_NAME });
    return await collection.count();
  } catch {
    return localStore.count();
  }
}

module.exports = {
  COLLECTION_NAME,
  getChromaClient,
  getOrCreateCollection,
  generateLocalEmbedding,
  addDocuments,
  queryVectorStore,
  getVectorCount,
  localStore,
};
