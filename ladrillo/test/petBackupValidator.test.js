const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { validateBackupFile, BackupValidationError, LIMITS } = require('../src/validators/petBackupValidator');
const instant = '2026-11-10T12:30:00.000Z';
function fixture() {
  return { format: 'mascuidado.pet-backup', version: 2, backupId: '23671a39-1234-4234-8234-123456789abc', exportedAt: instant,
    pet: { general: { nombre: 'Coni', tipo: 'Gato', raza: null, edad: 0, peso: 0, genero: null, sexo: null,
      color: null, senasParticulares: null, fechaNacimiento: '2024-02-29', medicamentos: null, padecimientos: null },
    species: { nombreEspecie: 'Gato' }, medicalRecord: { vaccines: [{ nombreVacuna: 'Rabia', fechaAplicacion: '2024-02-29', proximaDosis: null, lote: null }],
      history: [{ tipoEvento: null, fechaEvento: '2024-02-29', descripcion: null, veterinarioClinica: null, pesoKg: '4.25' }], photoRefs: [] },
    nutrition: { configuration: { metaAguaDiaria: 0, reinicioAguaDias: 1, porcionDiaria: 0, unidadMedida: 'g' },
      inventories: [{ ref: 'food-1', marca: 'Marca', tipo: 'Croquetas', fechaCompra: instant, costo: '100.50', estado: 'Activo',
        cantidadTotal: 10, cantidadRestante: 8, unidadMedida: 'kg', source: 'shared', balance: { basis: 'unknown', observedAt: null } }],
      hydration: [{ fechaHora: instant, cantidad: 1 }] }, reminders: [{ titulo: 'Consulta', descripcion: null, fechaHora: instant, estado: false }],
    favoriteClinics: [{ placeId: 'external-place', nombre: null, direccion: null, notasUsuario: null }], imageRef: null }, assets: [], warnings: [] };
}
function validate(data) { return validateBackupFile(JSON.stringify(data)); }
function rejected(name, mutate, code) {
  test(name, () => { const data = fixture(); mutate(data); assert.throws(() => validate(data), e => e instanceof BackupValidationError && e.code === code); });
}
test('complete v2 preserves values and reports shared unknown balance without inventing consumption', () => {
  const input = fixture(); const before = structuredClone(input); const result = validate(input);
  assert.equal(result.incomplete, false); assert.deepEqual(result.data, before); assert.deepEqual(input, before);
  assert.deepEqual(result.warnings, ['SHARED_INVENTORY_REQUIRES_INDEPENDENT_COPY', 'INVENTORY_CURRENT_BALANCE_UNKNOWN']);
});
test('empty collections and nullable configuration are valid', () => {
  const d = fixture(); d.pet.nutrition = { configuration: null, inventories: [], hydration: [] };
  d.pet.medicalRecord = { vaccines: [], history: [], photoRefs: [] }; d.pet.reminders = []; d.pet.favoriteClinics = [];
  assert.equal(validateBackupFile(Buffer.from(JSON.stringify(d))).version, 2);
});
test('exporter image omission marker makes v2 explicitly incomplete', () => {
  const d = fixture(); d.warnings = ['IMAGES_OMITTED_PHASE_2']; const result = validate(d);
  assert.equal(result.incomplete, true); assert.ok(result.warnings.includes('IMAGES_OMITTED_PHASE_2'));
});
test('legacy envelope stays explicitly incomplete without defaults', () => {
  const d = { app: '+Cuidado', version: '1.0', exportedAt: instant, pet: { nombre: 'Coni', imagen: 'https://example.test/photo.jpg' } };
  const result = validate(d); assert.equal(result.incomplete, true); assert.deepEqual(result.data, d);
  assert.equal(Object.hasOwn(result.data.pet, 'inventariosAlimento'), false);
  assert.ok(result.warnings.includes('LEGACY_IMAGES_NOT_SELF_CONTAINED'));
});
test('legacy serialized Prisma decimal and UTC date accepted', () => {
  const d = { app: '+Cuidado', version: '1.0', exportedAt: instant, pet: { nombre: 'Coni', historialMedico: [
    { tipoEvento: null, fechaEvento: '2024-02-29T00:00:00.000Z', descripcion: null, veterinarioClinica: null, pesoKg: '4.25' }] } };
  assert.equal(validate(d).incomplete, true);
});
rejected('unknown version', d => { d.version = 3; }, 'UNSUPPORTED_VERSION');
rejected('string v2 version is not silently coerced', d => { d.version = '2'; }, 'UNSUPPORTED_VERSION');
rejected('missing required collection', d => { delete d.pet.nutrition.hydration; }, 'REQUIRED');
rejected('wrong type', d => { d.pet.general.edad = '2'; }, 'NUMBER');
rejected('negative quantity', d => { d.pet.nutrition.hydration[0].cantidad = -1; }, 'NUMBER');
rejected('fractional bowl quantity', d => { d.pet.nutrition.hydration[0].cantidad = 1.2; }, 'NUMBER');
rejected('invalid leap day', d => { d.pet.general.fechaNacimiento = '2025-02-29'; }, 'DATE');
rejected('invalid day in timestamp', d => { d.exportedAt = '2026-02-30T12:00:00Z'; }, 'DATE');
rejected('timestamp requires timezone', d => { d.pet.reminders[0].fechaHora = '2026-11-10T12:00:00'; }, 'INSTANT');
rejected('invalid time', d => { d.exportedAt = '2026-11-10T24:00:00Z'; }, 'INSTANT');
rejected('invalid UTC offset', d => { d.exportedAt = '2026-11-10T12:00:00+14:30'; }, 'INSTANT');
test('explicit local UTC offset accepted', () => { const d = fixture(); d.exportedAt = '2026-11-10T12:00:00-06:00'; assert.equal(validate(d).version, 2); });
rejected('broken image reference', d => { d.pet.imageRef = 'missing'; }, 'BROKEN_REFERENCE');
rejected('duplicate photo references', d => { d.pet.medicalRecord.photoRefs = ['a', 'a']; }, 'DUPLICATE_REFERENCE');
rejected('duplicate inventory references', d => { d.pet.nutrition.inventories.push(structuredClone(d.pet.nutrition.inventories[0])); }, 'DUPLICATE_REFERENCE');
rejected('balance exceeding total', d => { d.pet.nutrition.inventories[0].cantidadRestante = 11; }, 'BALANCE');
rejected('stored balance requires observation date', d => { d.pet.nutrition.inventories[0].balance.basis = 'stored'; }, 'BALANCE');
rejected('decimal precision', d => { d.pet.medicalRecord.history[0].pesoKg = '4.255'; }, 'DECIMAL');
rejected('decimal precision matches PostgreSQL', d => { d.pet.nutrition.inventories[0].costo = '100000000.00'; }, 'DECIMAL');
rejected('record limit', d => { d.pet.nutrition.hydration = Array(LIMITS.records + 1).fill({ fechaHora: instant, cantidad: 1 }); }, 'ARRAY_LIMIT');
for (const [name, target, field] of [
  ['owner', d => d.pet.general, 'usuarioId'], ['pet ID', d => d.pet.general, 'id'],
  ['external relationship', d => d.pet.nutrition.inventories[0], 'compartidoCon'],
  ['OAuth token', d => d, 'googleRefreshToken'], ['Google event', d => d.pet.reminders[0], 'idEventoGoogle'],
  ['prototype key', d => d.pet.general, '__proto__']]) {
  rejected(`rejects forbidden ${name}`, d => { Object.defineProperty(target(d), field, { value: 'forbidden', enumerable: true }); }, 'UNKNOWN_FIELD');
}
test('legacy owner fields rejected', () => assert.throws(() => validate({ app: '+Cuidado', version: '1.0', exportedAt: instant,
  pet: { nombre: 'Coni', usuarioId: 'someone' } }), e => e.code === 'UNKNOWN_FIELD'));
test('bare legacy pet is not accepted', () => assert.throws(() => validate({ nombre: 'Coni' }), e => e.code === 'UNSUPPORTED_VERSION'));
test('malformed file and invalid UTF-8', () => {
  for (const input of ['{', Buffer.from([0xff]), 'null', '[]']) assert.throws(() => validateBackupFile(input), BackupValidationError);
});
test('size checked before JSON parsing', () => assert.throws(() => validateBackupFile(Buffer.alloc(LIMITS.fileBytes + 1)), e => e.code === 'FILE_SIZE'));
test('object input rejected: use bounded file API', () => assert.throws(() => validateBackupFile(fixture()), e => e.code === 'FILE_TYPE'));
function imageFixture() {
  const d = fixture(); const bytes = Buffer.from('89504e470d0a1a0a', 'hex');
  d.pet.imageRef = 'photo-1'; d.assets = [{ ref: 'photo-1', mimeType: 'image/png', byteLength: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'), base64: bytes.toString('base64') }]; return d;
}
test('asset envelope validates signature, checksum and size (not full image decoding)', () => assert.equal(validate(imageFixture()).version, 2));
test('image at 5 MiB boundary validates without recursive regex failure', () => {
  const d = imageFixture(); const bytes = Buffer.alloc(LIMITS.imageBytes);
  Buffer.from('89504e470d0a1a0a', 'hex').copy(bytes);
  Object.assign(d.assets[0], { byteLength: bytes.length, base64: bytes.toString('base64'), sha256: createHash('sha256').update(bytes).digest('hex') });
  assert.equal(validate(d).version, 2);
});
test('legacy invalid dates do not receive invented replacements', () => assert.throws(() => validate({
  app: '+Cuidado', version: '1.0', exportedAt: instant, pet: { nombre: 'Coni', fechaNacimiento: '2025-02-29' }
}), e => e.code === 'DATE'));
test('v2 raw numeric NaN/Infinity tokens rejected as malformed JSON', () => {
  for (const token of ['NaN', 'Infinity']) assert.throws(() => validateBackupFile(JSON.stringify(fixture()).replace('"peso":0', `"peso":${token}`)), e => e.code === 'JSON_ENCODING');
});
test('finite overflow JSON number rejected', () => assert.throws(() => validateBackupFile(
  JSON.stringify(fixture()).replace('"peso":0', '"peso":1e999')), e => e.code === 'NUMBER'));
for (const [name, mutate, code] of [
  ['bad hash', d => { d.assets[0].sha256 = '0'.repeat(64); }, 'HASH_MISMATCH'],
  ['bad size', d => { d.assets[0].byteLength++; }, 'IMAGE_SIZE'],
  ['bad base64', d => { d.assets[0].base64 = '!!!!'; }, 'BASE64'],
  ['MIME mismatch', d => { d.assets[0].mimeType = 'image/jpeg'; }, 'IMAGE_SIGNATURE'],
  ['unused asset', d => { d.pet.imageRef = null; }, 'UNUSED_ASSET'],
  ['duplicate asset', d => { d.assets.push(structuredClone(d.assets[0])); }, 'DUPLICATE_REFERENCE'],
  ['image size limit', d => { d.assets[0].byteLength = LIMITS.imageBytes + 1; }, 'NUMBER']]) {
  test(name, () => { const d = imageFixture(); mutate(d); assert.throws(() => validate(d), e => e.code === code); });
}
