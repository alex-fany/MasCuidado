// Validación pura del archivo, sin acceso a base de datos, variables de entorno, red ni sistema de archivos.
const { createHash } = require('node:crypto');
const { TextDecoder } = require('node:util');

const LIMITS = Object.freeze({ fileBytes: 20 * 1024 * 1024, imageBytes: 5 * 1024 * 1024,
  assets: 21, photos: 20, records: 10000, inventories: 1000, clinics: 100, text: 10000 });
const FORMAT = 'mascuidado.pet-backup';
const VERSION = 2;
const fail = (path, code) => { throw new BackupValidationError(path, code); };
class BackupValidationError extends Error {
  constructor(path, code) {
    super(`Respaldo inválido: ${path} (${code})`);
    this.name = 'BackupValidationError'; this.path = path; this.code = code;
  }
}
const string = (max, nonempty = false) => (v, p) => {
  if (typeof v !== 'string' || v.length > max || (nonempty && !v.trim()) || /[\u0000]/u.test(v)) fail(p, 'STRING');
};
const number = (max = Number.MAX_SAFE_INTEGER, integer = false, min = 0) => (v, p) => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || (integer && !Number.isInteger(v))) fail(p, 'NUMBER');
};
const nullable = rule => (v, p) => { if (v !== null) rule(v, p); };
const literal = values => (v, p) => { if (!values.includes(v)) fail(p, 'ENUM'); };
const array = (rule, max = LIMITS.records) => (v, p) => {
  if (!Array.isArray(v) || v.length > max) fail(p, 'ARRAY_LIMIT');
  v.forEach((item, i) => rule(item, `${p}[${i}]`));
};
const object = (fields, optional = []) => (v, p) => {
  if (!v || typeof v !== 'object' || Array.isArray(v) || Object.getPrototypeOf(v) !== Object.prototype) fail(p, 'OBJECT');
  for (const key of Object.keys(v)) if (!Object.hasOwn(fields, key)) fail(`${p}.${key}`, 'UNKNOWN_FIELD');
  for (const [key, rule] of Object.entries(fields)) {
    if (!Object.hasOwn(v, key)) { if (!optional.includes(key)) fail(`${p}.${key}`, 'REQUIRED'); }
    else rule(v[key], `${p}.${key}`);
  }
};
const date = (v, p) => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || v.slice(0, 4) === '0000') fail(p, 'DATE');
  const parsed = new Date(`${v}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== v) fail(p, 'DATE');
};
const instant = (v, p) => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.test(v)) fail(p, 'INSTANT');
  date(v.slice(0, 10), p);
  if (/[+-]14:(?!00)/.test(v) || !Number.isFinite(Date.parse(v))) fail(p, 'INSTANT');
};
const decimal = digits => (v, p) => {
  if (typeof v !== 'string' || !new RegExp(`^(?:0|[1-9]\\d{0,${digits - 1}})(?:\\.\\d{1,2})?$`).test(v)) fail(p, 'DECIMAL');
};
const ref = (v, p) => { if (typeof v !== 'string' || !/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(v)) fail(p, 'REFERENCE'); };
const text = nullable(string(LIMITS.text));
const unit = literal(['g', 'kg', 'oz', 'lb', 't']);
const generalFields = { nombre: string(100, true), tipo: nullable(string(50)), raza: nullable(string(100)),
  edad: nullable(number(2147483647, true)), peso: nullable(number()), genero: nullable(string(100)),
  sexo: nullable(string(1)), color: nullable(string(100)), senasParticulares: text,
  fechaNacimiento: nullable(date), medicamentos: text, padecimientos: text };
const vaccineFields = { nombreVacuna: string(150, true), fechaAplicacion: date, proximaDosis: nullable(date), lote: nullable(string(100)) };
const historyFields = { tipoEvento: nullable(string(100)), fechaEvento: date, descripcion: text,
  veterinarioClinica: nullable(string(150)), pesoKg: nullable(decimal(3)) };
const reminderFields = { titulo: string(150, true), descripcion: text, fechaHora: instant, estado: nullable(literal([true, false])) };
const config = object({ metaAguaDiaria: number(2147483647, true), reinicioAguaDias: number(2147483647, true, 1),
  porcionDiaria: number(), unidadMedida: unit });
const clinic = object({ placeId: string(255, true), nombre: nullable(string(150)), direccion: nullable(string(255)), notasUsuario: text });
const inventory = object({ ref, marca: string(100, true), tipo: string(50, true), fechaCompra: instant,
  costo: nullable(decimal(8)), estado: literal(['Activo', 'Agotado']), cantidadTotal: number(), cantidadRestante: number(),
  unidadMedida: unit, source: literal(['owned', 'shared']),
  balance: object({ basis: literal(['stored', 'unknown']), observedAt: nullable(instant) }) });
const asset = object({ ref, mimeType: literal(['image/jpeg', 'image/png', 'image/webp']),
  byteLength: number(LIMITS.imageBytes, true, 1),
  sha256: (v, p) => { if (typeof v !== 'string' || !/^[a-f0-9]{64}$/.test(v)) fail(p, 'HASH'); },
  base64: string(4 * Math.ceil(LIMITS.imageBytes / 3), true) });
const v2 = object({ format: literal([FORMAT]), version: literal([VERSION]),
  backupId: (v, p) => { if (typeof v !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v)) fail(p, 'UUID'); },
  exportedAt: instant,
  pet: object({ general: object(generalFields), species: nullable(object({ nombreEspecie: string(50, true) })),
    medicalRecord: object({ vaccines: array(object(vaccineFields)), history: array(object(historyFields)), photoRefs: array(ref, LIMITS.photos) }),
    nutrition: object({ configuration: nullable(config), inventories: array(inventory, LIMITS.inventories),
      hydration: array(object({ fechaHora: instant, cantidad: number(2147483647, true, 1) })) }),
    reminders: array(object(reminderFields)), favoriteClinics: array(clinic, LIMITS.clinics), imageRef: nullable(ref) }),
  assets: array(asset, LIMITS.assets), warnings: array(string(500, true), 100) });

// Solo se valida la estructura explícita generada por el exportador existente.
// No se inventan valores ausentes ni se convierten las URLs remotas en imágenes autocontenidas.
const legacyDate = (v, p) => { if (typeof v === 'string' && v.length === 10) date(v, p); else instant(v, p); };
const legacyUrl = (v, p) => {
  string(2048, true)(v, p);
  let url; try { url = new URL(v); } catch { fail(p, 'URL'); }
  if (url.protocol !== 'https:' || url.username || url.password) fail(p, 'URL');
};
const { sexo, ...legacyGeneral } = generalFields;
const { estado, ...legacyReminder } = reminderFields;
const legacyHistory = { ...historyFields, fechaEvento: legacyDate,
  pesoKg: nullable((v, p) => { if (typeof v === 'number') { number(999.99)(v, p); decimal(3)(String(v), p); } else decimal(3)(v, p); }) };
const legacyFields = { ...legacyGeneral, fechaNacimiento: nullable(legacyDate), imagen: nullable(legacyUrl),
  fotosCartilla: nullable(array(legacyUrl, LIMITS.photos)), vacunas: array(object({ ...vaccineFields, fechaAplicacion: legacyDate, proximaDosis: nullable(legacyDate) })),
  historialMedico: array(object(legacyHistory)), recordatorios: array(object(legacyReminder)),
  nutricionConfig: nullable(config), clinicasFavoritas: array(clinic, LIMITS.clinics) };
const v1 = object({ app: literal(['+Cuidado']), version: literal(['1.0']), exportedAt: instant,
  pet: object(legacyFields, Object.keys(legacyFields).filter(key => key !== 'nombre')) });

function unique(values, path) {
  if (new Set(values).size !== values.length) fail(path, 'DUPLICATE_REFERENCE');
}
function validateV2Relations(data) {
  const refs = data.assets.map(a => a.ref);
  unique(refs, '$.assets');
  unique(data.pet.medicalRecord.photoRefs, '$.pet.medicalRecord.photoRefs');
  unique(data.pet.nutrition.inventories.map(i => i.ref), '$.pet.nutrition.inventories');
  const used = [data.pet.imageRef, ...data.pet.medicalRecord.photoRefs].filter(r => r !== null);
  for (const r of used) if (!refs.includes(r)) fail('$.pet', 'BROKEN_REFERENCE');
  if (refs.some(r => !used.includes(r))) fail('$.assets', 'UNUSED_ASSET');
  data.pet.nutrition.inventories.forEach((i, n) => {
    if (i.cantidadRestante > i.cantidadTotal) fail(`$.pet.nutrition.inventories[${n}]`, 'BALANCE');
    if ((i.balance.basis === 'stored') !== (i.balance.observedAt !== null)) fail(`$.pet.nutrition.inventories[${n}].balance`, 'BALANCE');
  });
  data.assets.forEach((a, n) => {
    const p = `$.assets[${n}]`;
    // La comprobación simple de caracteres evita la recursión de expresiones regulares con imágenes grandes.
    if (a.base64.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(a.base64)) fail(p, 'BASE64');
    const bytes = Buffer.from(a.base64, 'base64');
    if (bytes.length !== a.byteLength || bytes.toString('base64') !== a.base64) fail(p, 'IMAGE_SIZE');
    if (createHash('sha256').update(bytes).digest('hex') !== a.sha256) fail(p, 'HASH_MISMATCH');
    const matches = a.mimeType === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
      : a.mimeType === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    if (!matches) fail(p, 'IMAGE_SIGNATURE');
  });
}

function validateBackupFile(input) {
  if (typeof input !== 'string' && !Buffer.isBuffer(input)) fail('$', 'FILE_TYPE');
  const size = Buffer.isBuffer(input) ? input.length : Buffer.byteLength(input, 'utf8');
  if (size > LIMITS.fileBytes) fail('$', 'FILE_SIZE');
  let data;
  try {
    const source = Buffer.isBuffer(input) ? new TextDecoder('utf-8', { fatal: true }).decode(input) : input;
    data = JSON.parse(source);
  } catch { fail('$', 'JSON_ENCODING'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail('$', 'OBJECT');
  if (data.version === VERSION) {
    v2(data, '$'); validateV2Relations(data);
    const warnings = [];
    if (data.pet.nutrition.inventories.some(i => i.source === 'shared')) warnings.push('SHARED_INVENTORY_REQUIRES_INDEPENDENT_COPY');
    if (data.pet.nutrition.inventories.some(i => i.balance.basis === 'unknown')) warnings.push('INVENTORY_CURRENT_BALANCE_UNKNOWN');
    // Una omisión declarada por el exportador solo puede marcar el respaldo como incompleto;
    // no otorga confianza, omite validaciones ni autoriza operaciones externas.
    const imagesOmitted = data.warnings.includes('IMAGES_OMITTED_PHASE_2');
    if (imagesOmitted) warnings.push('IMAGES_OMITTED_PHASE_2');
    return { version: VERSION, data, incomplete: imagesOmitted, warnings };
  }
  if (data.version === '1.0') {
    v1(data, '$');
    return { version: '1.0', data, incomplete: true, warnings: ['LEGACY_INCOMPLETE', 'LEGACY_IMAGES_NOT_SELF_CONTAINED',
      'LEGACY_MISSING_INVENTORIES_HYDRATION_SEX_SPECIES_REMINDER_STATE'] };
  }
  fail('$.version', 'UNSUPPORTED_VERSION');
}

module.exports = { validateBackupFile, BackupValidationError, LIMITS, FORMAT, VERSION };
