// Las comprobaciones del navegador son preliminares; la validación definitiva corresponde al backend.
export const BACKUP_FILE_BYTES = 20 * 1024 * 1024;
const IMAGE_BYTES = 5 * 1024 * 1024;
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (value, key) => Object.hasOwn(value, key);

export class BackupClientError extends Error {
  constructor(code, { message = code, server = false, uncertain = false, cleanupRequired = false, attemptId = '' } = {}) {
    super(message); this.name = 'BackupClientError'; this.code = code; this.server = server;
    this.uncertain = uncertain; this.cleanupRequired = cleanupRequired; this.attemptId = attemptId;
  }
}
const invalid = () => { throw new BackupClientError('INVALID_FILE'); };
function array(value, max, optional = false) {
  if (optional && value === undefined) return null;
  if (!Array.isArray(value) || value.length > max) invalid();
  return value;
}
function text(value, max, nullable = false) {
  if (nullable && value === null) return null;
  if (typeof value !== 'string' || value.length > max || (!nullable && !value.trim())) invalid();
  return value;
}
function warnings(value = []) {
  return array(value, 100).map(code => text(code, 500));
}
function count(value) { return value === null ? null : value.length; }

export function getBackupPreview(data) {
  if (!isRecord(data)) invalid();
  const legacy = data.version === '1.0';
  if (!legacy && data.version !== 2) throw new BackupClientError('UNKNOWN_VERSION');
  const allowed = legacy ? ['app', 'version', 'exportedAt', 'pet'] : ['format', 'version', 'backupId', 'exportedAt', 'pet', 'assets', 'warnings'];
  if (Object.keys(data).some(key => !allowed.includes(key)) || !isRecord(data.pet)) invalid();
  if (legacy ? data.app !== '+Cuidado' : data.format !== 'mascuidado.pet-backup') invalid();
  if (typeof data.exportedAt !== 'string' || !Number.isFinite(Date.parse(data.exportedAt))) invalid();
  const p = data.pet, g = legacy ? p : p.general;
  if (!isRecord(g)) invalid();
  const name = text(g.nombre, 100);
  const petType = g.tipo == null ? '' : text(g.tipo, 50, true);
  const breed = g.raza == null ? '' : text(g.raza, 100, true);
  const forbidden = ['id', 'usuarioId', 'mascotaId', 'especieId', 'password', 'googleRefreshToken', 'idEventoGoogle', 'public_id'];
  if ([p, g].some(obj => forbidden.some(key => own(obj, key)))) invalid();
  let metrics, codes, speciesName = null;
  if (legacy) {
    metrics = { vacunas: count(array(p.vacunas, 10000, true)), historialMedico: count(array(p.historialMedico, 10000, true)),
      recordatorios: count(array(p.recordatorios, 10000, true)), configuracionNutricional: p.nutricionConfig == null ? null : 1,
      inventariosAlimento: null, hidratacion: null, clinicasFavoritas: count(array(p.clinicasFavoritas, 100, true)),
      imagenPrincipal: 0, fotosCartilla: 0, recursosImagen: 0 };
    codes = ['LEGACY_INCOMPLETE', 'LEGACY_IMAGES_NOT_SELF_CONTAINED', 'LEGACY_MISSING_INVENTORIES_HYDRATION_SEX_SPECIES_REMINDER_STATE'];
  } else {
    if (p.species !== null) {
      if (!isRecord(p.species)) invalid();
      speciesName = text(p.species.nombreEspecie, 50);
    }
    if (!isRecord(p.medicalRecord) || !isRecord(p.nutrition) || (p.nutrition.configuration !== null && !isRecord(p.nutrition.configuration))) invalid();
    if (typeof data.backupId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(data.backupId)) invalid();
    const assets = array(data.assets, 21), photos = array(p.medicalRecord.photoRefs, 20);
    const refs = assets.map(asset => {
      if (!isRecord(asset) || !['image/png', 'image/jpeg', 'image/webp'].includes(asset.mimeType)
        || !Number.isInteger(asset.byteLength) || asset.byteLength < 1 || asset.byteLength > IMAGE_BYTES
        || typeof asset.base64 !== 'string' || asset.base64.length > 4 * Math.ceil(IMAGE_BYTES / 3)
        || typeof asset.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(asset.sha256)) invalid();
      const ref = text(asset.ref, 64);
      if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(ref)) invalid();
      return ref;
    });
    if (new Set(refs).size !== refs.length || new Set(photos).size !== photos.length
      || (p.imageRef !== null && !refs.includes(p.imageRef)) || photos.some(ref => typeof ref !== 'string' || !refs.includes(ref))
      || refs.some(ref => ref !== p.imageRef && !photos.includes(ref))) invalid();
    const inventories = array(p.nutrition.inventories, 1000);
    metrics = { vacunas: count(array(p.medicalRecord.vaccines, 10000)), historialMedico: count(array(p.medicalRecord.history, 10000)),
      recordatorios: count(array(p.reminders, 10000)), configuracionNutricional: p.nutrition.configuration === null ? 0 : 1,
      inventariosAlimento: inventories.length, hidratacion: count(array(p.nutrition.hydration, 10000)),
      clinicasFavoritas: count(array(p.favoriteClinics, 100)), imagenPrincipal: p.imageRef === null ? 0 : 1,
      fotosCartilla: photos.length, recursosImagen: assets.length };
    codes = warnings(data.warnings);
    if (inventories.some(i => !isRecord(i))) invalid();
    if (inventories.some(i => i.source === 'shared')) codes.push('SHARED_INVENTORY_REQUIRES_INDEPENDENT_COPY');
    if (inventories.some(i => i.balance?.basis === 'unknown')) codes.push('INVENTORY_CURRENT_BALANCE_UNKNOWN');
  }
  // La vista previa no recibe bytes de imágenes, HTML, URLs de origen ni objetos arbitrarios.
  return { version: data.version, name, petType, breed, speciesName, metrics, warnings: [...new Set(codes)],
    incomplete: legacy || codes.includes('IMAGES_OMITTED_PHASE_2') };
}

function checkFile(file) {
  if (!file || typeof file.name !== 'string' || !/\.json$/i.test(file.name) || !Number.isFinite(file.size) || file.size < 1) invalid();
  if (file.size > BACKUP_FILE_BYTES) throw new BackupClientError('FILE_SIZE');
}
async function parseBlob(blob) {
  if (blob.size > BACKUP_FILE_BYTES) throw new BackupClientError('FILE_SIZE');
  let data;
  try { data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await blob.arrayBuffer())); }
  catch { invalid(); }
  return getBackupPreview(data);
}
export async function readBackupPreview(file) {
  checkFile(file);
  return parseBlob(file);
}

export function backupFilename(name, exportedAt = new Date()) {
  const safe = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'mascota';
  return `MasCuidado_${safe}_backup_v2_${exportedAt.toISOString().slice(0, 10)}.json`;
}
async function responseError(response) {
  let data;
  try { data = await response.json(); } catch { /* Los proxies pueden responder con HTML. */ }
  const code = typeof data?.code === 'string' ? data.code : `HTTP_${response.status}`;
  const serverMessage = typeof data?.error === 'string' ? data.error : typeof data?.message === 'string' ? data.message : null;
  return new BackupClientError(code, {
    message: serverMessage === null ? code : serverMessage.slice(0, 3000),
    server: serverMessage !== null, uncertain: response.status >= 500,
    cleanupRequired: data?.cleanupRequired === true,
    attemptId: typeof data?.attemptId === 'string' ? data.attemptId.slice(0, 100) : ''
  });
}
function authorized(token) { if (!token) throw new BackupClientError('SESSION_REQUIRED'); }

export async function exportPetBackup(petId, token, request = globalThis.fetch) {
  authorized(token);
  let response;
  try { response = await request(`/api/mascotas/${encodeURIComponent(petId)}/backup`, { headers: { Authorization: `Bearer ${token}` } }); }
  catch { throw new BackupClientError('NETWORK_EXPORT'); }
  if (!response.ok) throw await responseError(response);
  const blob = await response.blob();
  const preview = await parseBlob(blob);
  if (preview.version !== 2) throw new BackupClientError('UNEXPECTED_RESPONSE');
  return { blob, preview, filename: backupFilename(preview.name) };
}

export async function importPetBackup(file, token, request = globalThis.fetch) {
  authorized(token); checkFile(file);
  const body = new FormData(); body.append('backup', file, file.name);
  let response;
  try { response = await request('/api/mascotas/import-backup', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body }); }
  catch { throw new BackupClientError('NETWORK_IMPORT', { uncertain: true }); }
  if (!response.ok) throw await responseError(response);
  let data;
  try { data = await response.json(); } catch { throw new BackupClientError('UNCONFIRMED_IMPORT', { uncertain: true }); }
  if (response.status !== 201 || !isRecord(data?.mascota) || typeof data.mascota.id !== 'string' || typeof data.mascota.nombre !== 'string'
    || typeof data.message !== 'string' || !Array.isArray(data.warnings) || typeof data.incomplete !== 'boolean' || typeof data.imagesPending !== 'boolean') {
    throw new BackupClientError('UNCONFIRMED_IMPORT', { uncertain: true });
  }
  let safeWarnings;
  try { safeWarnings = warnings(data.warnings); }
  catch { throw new BackupClientError('UNCONFIRMED_IMPORT', { uncertain: true }); }
  return { ...data, warnings: safeWarnings };
}
