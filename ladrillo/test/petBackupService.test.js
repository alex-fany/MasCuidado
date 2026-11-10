const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { createPetBackupService } = require('../src/services/petBackupService');
const { validateBackupFile } = require('../src/validators/petBackupValidator');
const { fakePrisma, sourceState } = require('./helpers/backupPrisma');
const fixed = { now: () => new Date('2026-11-11T00:00:00Z'), newBackupId: () => '23671a39-1234-4234-8234-123456789abc' };
const service = fake => createPetBackupService(fake.prisma, fixed);
async function backup() { return service(fakePrisma()).exportBackup('kevin', 'kevin-coni'); }

test('export is owner scoped, read-only, v2 and excludes identities, URLs and Google IDs', async () => {
  const fake = fakePrisma(); const before = fake.state(); const result = await service(fake).exportBackup('kevin', 'kevin-coni');
  assert.deepEqual(fake.state(), before); assert.equal(validateBackupFile(JSON.stringify(result)).version, 2);
  assert.deepEqual(fake.calls.find(c => c.operation === 'findPet').where, { id: 'kevin-coni', usuarioId: 'kevin' });
  assert.equal(fake.calls[0].options.isolationLevel, 'RepeatableRead');
  for (const forbidden of ['kevin', 'secret-google-event', 'original-', 'cloudinary', 'other-food', 'own-food']) assert.equal(JSON.stringify(result).includes(forbidden), false);
  assert.deepEqual(result.assets, []); assert.equal(result.pet.imageRef, null); assert.equal(result.warnings.includes('IMAGES_OMITTED_PHASE_2'), false);
  assert.deepEqual(result.pet.nutrition.inventories.map(i => i.source), ['owned', 'shared']);
  assert.equal(fake.calls.some(c => c.operation === 'create'), false);
});
test('another account cannot export a pet or tell whether its ID exists', async () => {
  for (const id of ['kevin-coni', 'missing']) await assert.rejects(service(fakePrisma()).exportBackup('josue', id), e => e.status === 404 && e.code === 'PET_NOT_FOUND');
});
test('cross-user import regenerates every record ID and binds all rows to the new pet', async () => {
  const fake = fakePrisma(); const original = fake.state(); const payload = await service(fake).exportBackup('kevin', 'kevin-coni');
  const result = await service(fake).importBackup('josue', JSON.stringify(payload)); const after = fake.state();
  assert.equal(result.mascota.usuarioId, 'josue'); assert.notEqual(result.mascota.id, 'kevin-coni');
  assert.equal(result.mascota.especieId, 42); // ID del catálogo local resuelto por nombre; no procede del archivo
  assert.equal(result.mascota.edad, 0); assert.equal(result.mascota.sexo, 'H');
  assert.equal(result.mascota.fechaNacimiento.toISOString(), '2024-02-29T00:00:00.000Z');
  assert.deepEqual(result.counts, { vacunas: 1, historialMedico: 1, recordatorios: 1, configuracionNutricional: 1, inventariosAlimento: 2, hidratacion: 1, clinicasFavoritas: 1,
    imagenPrincipal: 0, fotosCartilla: 0, recursosImagen: 0 });
  for (const model of ['Vacuna', 'HistorialMedico', 'Recordatorio', 'ConfiguracionNutricion', 'InventarioAlimento', 'RegistroHidratacion', 'ClinicaFavorita']) {
    const rows = after[model].filter(r => r.mascotaId === result.mascota.id);
    assert.equal(rows.length, model === 'InventarioAlimento' ? 2 : 1);
    assert.ok(rows.every(r => !original[model].some(old => old.id === r.id)));
    assert.deepEqual(after[model].filter(r => r.mascotaId !== result.mascota.id), original[model]);
  }
  const reminder = after.Recordatorio.find(r => r.mascotaId === result.mascota.id);
  assert.equal(reminder.usuarioId, 'josue'); assert.equal(reminder.estado, true); assert.equal(reminder.idEventoGoogle, null);
  assert.equal(after.ConfiguracionNutricion.at(-1).metaAguaDiaria, 0); assert.equal(after.ConfiguracionNutricion.at(-1).porcionDiaria, 0);
  assert.equal(after.HistorialMedico.at(-1).pesoKg, '4.25'); assert.equal(after.RegistroHidratacion.at(-1).cantidad, 3);
  assert.equal(after.ClinicaFavorita.at(-1).notasUsuario, 'Urgencias');
  assert.deepEqual(after.CompartirAlimento, original.CompartirAlimento);
  for (let n = 0; n < 2; n++) {
    const imported = after.InventarioAlimento.filter(i => i.mascotaId === result.mascota.id)[n];
    const old = original.InventarioAlimento[n];
    for (const key of ['cantidadTotal', 'cantidadRestante', 'estado', 'unidadMedida', 'costo']) assert.equal(imported[key], old[key]);
    assert.deepEqual(imported.fechaCompra, old.fechaCompra);
  }
  assert.equal(result.incomplete, false); assert.equal(result.imagesPending, false);
  assert.ok(result.warnings.includes('SHARED_INVENTORY_COPIED_WITHOUT_GROUP'));
  assert.equal(fake.calls.filter(c => c.operation === 'create').some(c => Object.hasOwn(c.data, 'id')), false);
  // El nuevo propietario puede exportar la copia sin depender de la cuenta de origen.
  const copied = await service(fake).exportBackup('josue', result.mascota.id);
  assert.deepEqual(copied.pet.general, payload.pet.general);
  assert.deepEqual(copied.pet.medicalRecord, payload.pet.medicalRecord);
  assert.deepEqual(copied.pet.reminders, payload.pet.reminders);
  assert.deepEqual(copied.pet.nutrition.configuration, payload.pet.nutrition.configuration);
  assert.deepEqual(copied.pet.nutrition.hydration, payload.pet.nutrition.hydration);
  assert.deepEqual(after.Mascota.filter(p => p.usuarioId === 'kevin'), original.Mascota);
});
test('species resolved by name in destination, never by source ID', async () => {
  const payload = await backup(); const data = sourceState(); data.CatalogoEspecie[0].id = 99;
  const fake = fakePrisma(data); const result = await service(fake).importBackup('josue', JSON.stringify(payload)); assert.equal(result.mascota.especieId, 99);
});
test('missing species rejects transaction without data loss or global catalog creation', async () => {
  const payload = await backup(); const data = sourceState(); data.CatalogoEspecie = []; const fake = fakePrisma(data);
  await assert.rejects(service(fake).importBackup('josue', JSON.stringify(payload)), e => e.code === 'SPECIES_NOT_AVAILABLE');
  assert.deepEqual(fake.state(), data); assert.equal(fake.calls.at(-1).operation, 'rollback');
});
for (const failModel of ['Mascota', 'Vacuna', 'HistorialMedico', 'Recordatorio', 'ConfiguracionNutricion', 'InventarioAlimento', 'RegistroHidratacion', 'ClinicaFavorita']) {
  test(`transaction rollback on ${failModel} failure`, async () => {
    const payload = await backup(); const fake = fakePrisma(sourceState(), { failModel }); const before = fake.state();
    await assert.rejects(service(fake).importBackup('josue', JSON.stringify(payload)), /simulated database failure/);
    assert.deepEqual(fake.state(), before); assert.equal(fake.calls.at(-1).operation, 'rollback');
  });
}
test('commit failure leaves no imported data', async () => {
  const payload = await backup(); const fake = fakePrisma(sourceState(), { failCommit: true }); const before = fake.state();
  await assert.rejects(service(fake).importBackup('josue', JSON.stringify(payload)), /commit failure/); assert.deepEqual(fake.state(), before);
});
test('invalid and forged files rejected before any transaction', async () => {
  for (const mutate of [p => { p.pet.general.usuarioId = 'kevin'; }, p => { p.pet.reminders[0].idEventoGoogle = 'external'; },
    p => { p.version = 44; }, p => { p.pet.medicalRecord.vaccines[0].fechaAplicacion = '2025-02-29'; }]) {
    const payload = await backup(); mutate(payload); const fake = fakePrisma();
    await assert.rejects(service(fake).importBackup('josue', JSON.stringify(payload))); assert.deepEqual(fake.calls, []);
  }
});
test('images require a configured image service and are never silently discarded', async () => {
  const payload = await backup(); const bytes = Buffer.from('89504e470d0a1a0a', 'hex'); payload.pet.imageRef = 'photo';
  payload.assets = [{ ref: 'photo', mimeType: 'image/png', byteLength: bytes.length, base64: bytes.toString('base64'), sha256: createHash('sha256').update(bytes).digest('hex') }];
  const fake = fakePrisma(); await assert.rejects(service(fake).importBackup('josue', JSON.stringify(payload)), e => e.code === 'IMAGE_STORAGE_NOT_CONFIGURED');
  assert.deepEqual(fake.calls, []);
});
test('explicit legacy v1 imports available data, no remote images, no invented state', async () => {
  const payload = { app: '+Cuidado', version: '1.0', exportedAt: '2026-11-10T00:00:00Z', pet: {
    nombre: 'Coni', edad: 0, imagen: 'https://example.test/photo.jpg', fotosCartilla: ['https://example.test/card.jpg'],
    recordatorios: [{ titulo: 'Control', descripcion: null, fechaHora: '2026-11-10T12:00:00-06:00' }] } };
  const fake = fakePrisma(); const result = await service(fake).importBackup('josue', JSON.stringify(payload)); const state = fake.state();
  assert.equal(result.version, '1.0'); assert.equal(result.incomplete, true); assert.ok(result.warnings.includes('LEGACY_IMAGES_NOT_IMPORTED'));
  assert.equal(result.mascota.edad, 0); assert.equal(result.mascota.fechaNacimiento, null); assert.equal(result.mascota.imagen, null);
  assert.equal(state.Recordatorio.at(-1).estado, null); assert.equal(state.Recordatorio.at(-1).usuarioId, 'josue');
  assert.equal(state.Recordatorio.at(-1).fechaHora.toISOString(), '2026-11-10T18:00:00.000Z');
  assert.equal(result.counts.inventariosAlimento, 0); assert.equal(result.counts.hidratacion, 0);
});
test('full legacy exporter envelope preserves all available relations and decimal precision', async () => {
  const s = sourceState(), p = s.Mascota[0];
  const payload = { app: '+Cuidado', version: '1.0', exportedAt: '2026-11-10T00:00:00Z', pet: {
    nombre: p.nombre, tipo: p.tipo, raza: p.raza, edad: p.edad, peso: p.peso, genero: p.genero,
    color: p.color, senasParticulares: p.senasParticulares, fechaNacimiento: p.fechaNacimiento,
    medicamentos: p.medicamentos, padecimientos: p.padecimientos, imagen: p.imagen, fotosCartilla: p.fotosCartilla,
    vacunas: s.Vacuna.map(({ id, mascotaId, ...v }) => v), historialMedico: s.HistorialMedico.map(({ id, mascotaId, ...h }) => h),
    recordatorios: s.Recordatorio.map(({ id, mascotaId, usuarioId, estado, idEventoGoogle, ...r }) => r),
    nutricionConfig: (({ id, mascotaId, ...c }) => c)(s.ConfiguracionNutricion[0]),
    clinicasFavoritas: s.ClinicaFavorita.map(({ id, mascotaId, ...c }) => c)
  } };
  const fake = fakePrisma(); const result = await service(fake).importBackup('josue', JSON.stringify(payload));
  assert.equal(result.counts.vacunas, 1); assert.equal(result.counts.historialMedico, 1); assert.equal(result.counts.clinicasFavoritas, 1);
  assert.equal(fake.state().HistorialMedico.at(-1).pesoKg, '4.25'); assert.equal(fake.state().ConfiguracionNutricion.at(-1).metaAguaDiaria, 0);
  assert.equal(result.mascota.sexo, null); assert.equal(result.mascota.especieId, null);
});
test('export without source images makes no false claim that images were omitted', async () => {
  const state = sourceState(); state.Mascota[0].imagen = null; state.Mascota[0].fotosCartilla = [];
  const payload = await service(fakePrisma(state)).exportBackup('kevin', 'kevin-coni');
  assert.equal(payload.warnings.includes('IMAGES_OMITTED_PHASE_2'), false);
});
test('source collections above contract limits fail explicitly without truncation', async () => {
  const state = sourceState(); state.Vacuna = Array.from({ length: 10001 }, (_, n) => ({ ...state.Vacuna[0], id: n }));
  await assert.rejects(service(fakePrisma(state)).exportBackup('kevin', 'kevin-coni'), e => e.code === 'SOURCE_DATA_INVALID');
});
test('unauthenticated requests never reach Prisma', async () => {
  const fake = fakePrisma(); await assert.rejects(service(fake).exportBackup(null, 'kevin-coni'), e => e.status === 401);
  await assert.rejects(service(fake).importBackup(undefined, '{}'), e => e.status === 401); assert.deepEqual(fake.calls, []);
});
test('foreign-account inventory linked by an invalid historical relationship is not leaked', async () => {
  const state = sourceState(); state.Mascota[1].usuarioId = 'third-user'; const fake = fakePrisma(state);
  await assert.rejects(service(fake).exportBackup('kevin', 'kevin-coni'), e => e.code === 'INVENTORY_OWNERSHIP_CONFLICT');
});
test('bad stored data does not produce an invalid backup', async () => {
  const state = sourceState(); state.Mascota[0].peso = -4;
  await assert.rejects(service(fakePrisma(state)).exportBackup('kevin', 'kevin-coni'), e => e.code === 'SOURCE_DATA_INVALID');
});
test('repeat import deliberately makes separate pets, never overwrites matching names', async () => {
  const payload = await backup(); const fake = fakePrisma();
  const first = await service(fake).importBackup('josue', JSON.stringify(payload)); const second = await service(fake).importBackup('josue', JSON.stringify(payload));
  assert.notEqual(first.mascota.id, second.mascota.id); assert.equal(fake.state().Mascota.filter(p => p.usuarioId === 'josue').length, 2);
});
test('large valid collections use bounded batches within one transaction', async () => {
  const payload = await backup(); payload.pet.nutrition.hydration = Array.from({ length: 1001 }, (_, n) => ({ cantidad: n + 1, fechaHora: payload.exportedAt }));
  const fake = fakePrisma(); const result = await service(fake).importBackup('josue', JSON.stringify(payload));
  assert.equal(result.counts.hidratacion, 1001); assert.equal(fake.calls.filter(c => c.operation === 'transaction').length, 1);
  assert.equal(fake.state().RegistroHidratacion.filter(r => r.mascotaId === result.mascota.id).length, 1001);
});
