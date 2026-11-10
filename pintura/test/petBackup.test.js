import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BACKUP_FILE_BYTES, backupFilename, exportPetBackup, getBackupPreview, importPetBackup, readBackupPreview } from '../src/utils/petBackup.js';
import serviceModule from '../../ladrillo/src/services/petBackupService.js';
import fakeModule from '../../ladrillo/test/helpers/backupPrisma.js';

async function fixture() {
  const fake = fakeModule.fakePrisma();
  return serviceModule.createPetBackupService(fake.prisma).exportBackup('kevin', 'kevin-coni');
}
const file = data => new File([JSON.stringify(data)], 'Coni.json', { type: 'application/json' });

test('browser preview accepts the actual v2 backend exporter contract', async () => {
  const data = await fixture(); const preview = await readBackupPreview(file(data));
  assert.equal(preview.name, 'Coni'); assert.equal(preview.version, 2); assert.equal(preview.incomplete, false);
  assert.equal(preview.metrics.vacunas, 1); assert.equal(preview.metrics.hidratacion, 1); assert.equal(preview.metrics.inventariosAlimento, 2);
  assert.ok(preview.warnings.includes('SHARED_INVENTORY_REQUIRES_INDEPENDENT_COPY'));
});
test('v1 preview reports missing data and excludes every remote image URL', async () => {
  const data = { app: '+Cuidado', version: '1.0', exportedAt: '2026-11-10T12:00:00Z', pet: {
    nombre: '<img src=x onerror=alert(1)>', imagen: 'https://untrusted.test/main.jpg', fotosCartilla: ['https://untrusted.test/card.jpg']
  } };
  const preview = await readBackupPreview(file(data));
  assert.equal(preview.name, data.pet.nombre); assert.equal(preview.incomplete, true);
  assert.equal(preview.metrics.vacunas, null); assert.equal(preview.metrics.recursosImagen, 0);
  assert.equal(JSON.stringify(preview).includes('https://untrusted.test'), false);
  assert.equal(Object.hasOwn(preview, 'imagen'), false); assert.equal(Object.hasOwn(preview, 'fotosCartilla'), false);
});
test('preview never requests URLs from file or decodes image assets', async context => {
  context.mock.method(globalThis, 'fetch', () => { throw new Error('Network forbidden'); });
  const data = await fixture(); data.pet.imageRef = 'image-1'; data.pet.medicalRecord.photoRefs = ['image-1'];
  data.assets = [{ ref: 'image-1', mimeType: 'image/png', byteLength: 8, base64: 'iVBORw0KGgo=', sha256: '0'.repeat(64) }];
  data.pet.general.nombre = '<script>literal text</script>';
  const preview = await readBackupPreview(file(data)); assert.equal(preview.metrics.recursosImagen, 1);
  assert.equal(Object.hasOwn(preview, 'assets'), false); assert.equal(preview.name, data.pet.general.nombre);
  assert.equal(globalThis.fetch.mock.calls.length, 0);
});
test('unknown versions, bare legacy pets and invalid JSON rejected', async () => {
  for (const data of [{ version: 3 }, { version: '2' }, { nombre: 'Coni' }]) await assert.rejects(readBackupPreview(file(data)), e => e.code === 'UNKNOWN_VERSION');
  await assert.rejects(readBackupPreview(new File(['{bad'], 'bad.json')), e => e.code === 'INVALID_FILE');
  await assert.rejects(readBackupPreview(new File([new Uint8Array([255])], 'bad.json')), e => e.code === 'INVALID_FILE');
});
test('file size and extension checked before reading', async () => {
  let read = false;
  const oversized = { name: 'huge.json', size: BACKUP_FILE_BYTES + 1, arrayBuffer() { read = true; } };
  await assert.rejects(readBackupPreview(oversized), e => e.code === 'FILE_SIZE'); assert.equal(read, false);
  await assert.rejects(readBackupPreview(new File(['{}'], 'backup.html')), e => e.code === 'INVALID_FILE');
  await assert.rejects(readBackupPreview(new File([], 'empty.json')), e => e.code === 'INVALID_FILE');
});
test('broken image references, oversized collections and owner fields rejected in preview', async () => {
  for (const mutate of [d => { d.pet.imageRef = 'missing'; }, d => { d.pet.general.usuarioId = 'kevin'; },
    d => { d.pet.nutrition.hydration = Array(10001).fill({}); }]) {
    const data = await fixture(); mutate(data); assert.throws(() => getBackupPreview(data), e => e.code === 'INVALID_FILE');
  }
});
test('untrusted warning strings remain plain strings, including prototype property names', async () => {
  const data = await fixture(); data.warnings = ['__proto__', '<svg onload=alert(1)>']; const preview = getBackupPreview(data);
  assert.ok(preview.warnings.includes('__proto__')); assert.ok(preview.warnings.includes('<svg onload=alert(1)>'));
});
test('old phase-2 marker remains explicitly incomplete', async () => {
  const data = await fixture(); data.warnings.push('IMAGES_OMITTED_PHASE_2'); assert.equal(getBackupPreview(data).incomplete, true);
});
test('safe download filename preserves pet identity without paths or control characters', () => {
  const name = backupFilename('Cóní / ../../ evil\\\n', new Date('2026-11-10T00:00:00Z'));
  assert.ok(name.startsWith('MasCuidado_Coni_')); assert.ok(name.endsWith('_backup_v2_2026-11-10.json'));
  assert.equal(/[.]{2}|[/\\\n]/.test(name), false);
});
test('export uses existing auth endpoint and downloads unmodified v2 bytes as a Blob', async () => {
  const data = await fixture(); const raw = JSON.stringify(data); let calls = 0;
  const result = await exportPetBackup('pet/one', 'kevin-token', async (url, options) => {
    calls++; assert.equal(url, '/api/mascotas/pet%2Fone/backup'); assert.equal(options.headers.Authorization, 'Bearer kevin-token');
    return new Response(raw, { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  assert.equal(calls, 1); assert.equal(await result.blob.text(), raw); assert.ok(result.filename.includes('Coni'));
});
test('import sends original file via multipart, preserving browser boundary and server response', async () => {
  const data = await fixture(); const upload = file(data); let calls = 0;
  const fake = fakeModule.fakePrisma(); const backend = serviceModule.createPetBackupService(fake.prisma);
  const result = await importPetBackup(upload, 'josue-token', async (url, options) => {
    calls++; assert.equal(url, '/api/mascotas/import-backup'); assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer josue-token'); assert.equal(options.headers['Content-Type'], undefined);
    assert.ok(options.body instanceof FormData); assert.deepEqual([...options.body.keys()], ['backup']);
    assert.equal(await options.body.get('backup').text(), await upload.text());
    const created = await backend.importBackup('josue', await options.body.get('backup').text());
    return new Response(JSON.stringify({ message: 'Mascota e imágenes importadas como copia independiente.', ...created }), { status: 201 });
  });
  assert.equal(calls, 1); assert.equal(result.mascota.usuarioId, 'josue'); assert.equal(result.counts.vacunas, 1);
  assert.equal(result.imagesPending, false); assert.equal(result.incomplete, false);
});
test('server validation and compensation messages preserved verbatim', async () => {
  const upload = file(await fixture());
  await assert.rejects(importPetBackup(upload, 'token', async () => new Response(JSON.stringify({ error: 'No se confirmó la limpieza',
    code: 'IMAGE_COMPENSATION_FAILED', cleanupRequired: true, attemptId: 'test-attempt' }), { status: 502 })),
  e => e.server && e.message === 'No se confirmó la limpieza' && e.cleanupRequired && e.attemptId === 'test-attempt' && e.uncertain);
});
test('HTML proxy errors and 413 limits do not masquerade as JSON success', async () => {
  for (const status of [413, 502, 504]) await assert.rejects(importPetBackup(file(await fixture()), 'token',
    async () => new Response('<html>proxy error</html>', { status })), e => e.code === 'HTTP_' + status && e.uncertain === (status >= 500));
});
test('ambiguous network failure never automatically repeats the import', async () => {
  let calls = 0;
  await assert.rejects(importPetBackup(file(await fixture()), 'token', async () => { calls++; throw new TypeError('network error'); }),
    e => e.code === 'NETWORK_IMPORT' && e.uncertain);
  assert.equal(calls, 1);
});
test('malformed success responses are uncertain, preventing an unsafe retry', async () => {
  for (const body of ['<html>ok?</html>', JSON.stringify({ mascota: { id: 'new' } }), JSON.stringify({ mascota: { id: 'new', nombre: 'Coni' },
    message: 'Created', warnings: [null], incomplete: false, imagesPending: false })]) {
    await assert.rejects(importPetBackup(file(await fixture()), 'token', async () => new Response(body, { status: 201 })), e => e.code === 'UNCONFIRMED_IMPORT' && e.uncertain);
  }
});
test('absent session performs no requests', async () => {
  let calls = 0; const request = async () => { calls++; };
  await assert.rejects(exportPetBackup('pet', '', request), e => e.code === 'SESSION_REQUIRED');
  await assert.rejects(importPetBackup(file(await fixture()), null, request), e => e.code === 'SESSION_REQUIRED'); assert.equal(calls, 0);
});
