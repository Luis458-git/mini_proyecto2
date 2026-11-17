const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
  quiet: true,
});

/**
 * Rutas candidatas donde puede ubicarse el archivo de credenciales de Google Service Account.
 */
function getCredentialsPath() {
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const candidates = [
    envPath ? path.resolve(process.cwd(), envPath) : null,
    envPath ? path.resolve(__dirname, '../../', envPath) : null,
    path.resolve(__dirname, '../../service-account.json'),
    path.resolve(__dirname, '../../../service-account.json'),
    path.resolve(__dirname, '../../credentials.json'),
    path.resolve(__dirname, '../../../credentials.json'),
  ].filter(Boolean);

  return candidates.find((p) => fs.existsSync(p)) || null;
}

/**
 * Verifica si existe un archivo de credenciales de Google válido.
 * @returns {{ exists: boolean, path: string|null, clientEmail: string|null }}
 */
function hasValidCredentials() {
  const credPath = getCredentialsPath();
  if (!credPath) {
    return { exists: false, path: null, clientEmail: null };
  }

  try {
    const raw = fs.readFileSync(credPath, 'utf8');
    const json = JSON.parse(raw);
    if (json.type === 'service_account' && json.client_email && json.private_key) {
      return { exists: true, path: credPath, clientEmail: json.client_email };
    }
    return { exists: false, path: credPath, clientEmail: null, error: 'Formato no es service_account' };
  } catch (error) {
    return { exists: false, path: credPath, clientEmail: null, error: error.message };
  }
}

/**
 * Obtiene el cliente autenticado de Google Drive v3.
 */
function getDriveClient() {
  const cred = hasValidCredentials();
  if (!cred.exists) {
    throw new Error(
      'No se encontró el archivo de credenciales de Google Service Account. ' +
      'Asegúrate de colocar tu service-account.json en backend/ y configurar GOOGLE_APPLICATION_CREDENTIALS.'
    );
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: cred.path,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * Lista los archivos dentro de una carpeta de Google Drive.
 * @param {string} folderId 
 */
async function listDriveFiles(folderId = process.env.GOOGLE_DRIVE_FOLDER_ID) {
  const drive = getDriveClient();
  const q = folderId
    ? `'${folderId}' in parents and trashed = false`
    : 'trashed = false';

  const res = await drive.files.list({
    q,
    fields: 'files(id, name, mimeType, webViewLink, modifiedTime, version, description)',
    pageSize: 50,
  });

  return res.data.files || [];
}

/**
 * Descarga o exporta el contenido de un archivo de Google Drive según su tipo.
 * - Google Docs (application/vnd.google-apps.document) -> text/plain
 * - Google Sheets (application/vnd.google-apps.spreadsheet) -> text/csv
 * - Archivos binarios (PDF, docx, xlsx) -> buffer
 */
async function downloadOrExportFile(file) {
  const drive = getDriveClient();

  if (file.mimeType === 'application/vnd.google-apps.document') {
    const res = await drive.files.export({
      fileId: file.id,
      mimeType: 'text/plain',
    });
    return { type: 'text', content: String(res.data) };
  }

  if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
    const res = await drive.files.export({
      fileId: file.id,
      mimeType: 'text/csv',
    });
    return { type: 'csv', content: String(res.data) };
  }

  // Binarios (PDF, docx, xlsx subidos como archivos normales)
  const res = await drive.files.get(
    { fileId: file.id, alt: 'media' },
    { responseType: 'arraybuffer' }
  );
  return { type: 'binary', buffer: Buffer.from(res.data) };
}

module.exports = {
  getCredentialsPath,
  hasValidCredentials,
  getDriveClient,
  listDriveFiles,
  downloadOrExportFile,
};
