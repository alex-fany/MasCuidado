const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const sharp = require('sharp');
const { createBackupImageService } = require('../src/services/backupImageService');
const { BackupImageError } = require('../src/services/backupImageError');
const { createPetBackupService } = require('../src/services/petBackupService');
const { createPetBackupHandlers } = require('../src/controllers/petBackupController');
const { validateBackupFile } = require('../src/validators/petBackupValidator');
const { fakePrisma, sourceState } = require('./helpers/backupPrisma');
const main = 'https://res.cloudinary.com/example/image/upload/v123/mascotas/main.png';
const card = 'https://res.cloudinary.com/example/image/upload/v123/cartillas/card.png';

async function setup(options = {}) {
  const state = sourceState(); state.Mascota[0].imagen = main; state.Mascota[0].fotosCartilla = [main, card];
  const red = await sharp({ create: { width: 3, height: 2, channels: 3, background: 'red' } }).png().toBuffer();
  const blue = await sharp({ create: { width: 2, height: 3, channels: 3, background: 'blue' } }).png().toBuffer();
  const sources = new Map([[main, red], [card, blue]]), resources = new Map([['original-main', red], ['original-card', blue]]);
  const calls = [], removed = [];
  const images = createBackupImageService({ cloudName: 'example',
    download: async url => {
      calls.push({ operation: 'download', url }); if (options.onDownload) options.onDownload();
      if (options.failDownload || !sources.has(url)) throw new BackupImageError('IMAGE_DOWNLOAD_FAILED', 'No se pudo descargar una imagen', 502);
      return { bytes: sources.get(url), mimeType: 'image/png' };
    },
    store: {
      async upload(bytes, publicId) {
        const attempt = calls.filter(c => c.operation === 'upload').length + 1;
        calls.push({ operation: 'upload', publicId }); if (options.onUpload) options.onUpload();
        if (options.failUpload === attempt) throw new BackupImageError('IMAGE_UPLOAD_FAILED', 'Falló una subida sintética', 502);
        if (options.unexpectedId) return { publicId: 'original-main', url: main };
        resources.set(publicId, Buffer.from(bytes));
        return { publicId, url: `https://res.cloudinary.com/example/image/upload/v999/${publicId}.png` };
      },
      async remove(publicId) {
        assert.ok(publicId.startsWith('mascuidado/backups/')); removed.push(publicId);
        if (options.failCleanup) throw new Error('synthetic cleanup failure'); resources.delete(publicId);
      }
    }
  });
  const fake = fakePrisma(state, options.database), service = createPetBackupService(fake.prisma, { images });
  return { fake, service, images, sources, resources, calls, removed };
}

test('export includes actual image bytes, hashes, order and shared primary/cartilla reference', async () => {
  const s = await setup(); const before = s.fake.state();
  const payload = await s.service.exportBackup('kevin', 'kevin-coni');
  assert.deepEqual(s.fake.state(), before); assert.equal(payload.assets.length, 2); assert.equal(s.calls.length, 2);
  assert.equal(payload.pet.imageRef, payload.pet.medicalRecord.photoRefs[0]);
  assert.notEqual(payload.pet.imageRef, payload.pet.medicalRecord.photoRefs[1]);
  assert.equal(payload.warnings.includes('IMAGES_OMITTED_PHASE_2'), false);
  for (const asset of payload.assets) {
    const bytes = Buffer.from(asset.base64, 'base64'); assert.equal(bytes.length, asset.byteLength);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
    assert.equal((await sharp(bytes).metadata()).format, 'png');
  }
  assert.equal(validateBackupFile(JSON.stringify(payload)).incomplete, false);
  assert.equal(JSON.stringify(payload).includes('cloudinary.com'), false);
});
test('cross-account import creates independent image resources and retains all image relationships', async () => {
  const s = await setup(); const payload = await s.service.exportBackup('kevin', 'kevin-coni'); const before = s.fake.state();
  const result = await s.service.importBackup('josue', JSON.stringify(payload));
  assert.equal(result.mascota.usuarioId, 'josue'); assert.notEqual(result.mascota.imagen, main);
  assert.equal(result.mascota.fotosCartilla[0], result.mascota.imagen); assert.notEqual(result.mascota.fotosCartilla[1], card);
  assert.equal(result.incomplete, false); assert.equal(result.imagesPending, false);
  assert.equal(result.counts.imagenPrincipal, 1); assert.equal(result.counts.fotosCartilla, 2); assert.equal(result.counts.recursosImagen, 2);
  assert.equal(s.calls.filter(c => c.operation === 'upload').length, 2);
  assert.deepEqual(s.fake.state().Mascota.filter(p => p.usuarioId === 'kevin'), before.Mascota);
  assert.equal(s.removed.length, 0); assert.equal(s.resources.size, 4);
  // Eliminar los recursos originales simulados no afecta a las imágenes independientes subidas.
  s.sources.clear(); s.resources.delete('original-main'); s.resources.delete('original-card');
  assert.equal(s.resources.size, 2); assert.ok([...s.resources.keys()].every(id => id.startsWith('mascuidado/backups/')));
  for (const bytes of s.resources.values()) assert.equal((await sharp(bytes).metadata()).format, 'png');
});
test('backup is importable after original source URLs no longer exist: import never downloads', async () => {
  const s = await setup(); const payload = await s.service.exportBackup('kevin', 'kevin-coni'); s.sources.clear(); s.calls.length = 0;
  await s.service.importBackup('josue', JSON.stringify(payload)); assert.equal(s.calls.some(c => c.operation === 'download'), false);
});
test('repeat imports get different attempt and resource IDs', async () => {
  const s = await setup(); const payload = await s.service.exportBackup('kevin', 'kevin-coni');
  const a = await s.service.importBackup('josue', JSON.stringify(payload)); const b = await s.service.importBackup('josue', JSON.stringify(payload));
  assert.notEqual(a.mascota.imagen, b.mascota.imagen); assert.notEqual(a.mascota.id, b.mascota.id); assert.equal(s.resources.size, 6);
});
test('all decoding is completed before any upload; fake signature is rejected without writes', async () => {
  const s = await setup(); const payload = await s.service.exportBackup('kevin', 'kevin-coni');
  const bytes = Buffer.from('89504e470d0a1a0a', 'hex'); Object.assign(payload.assets[1], {
    byteLength: bytes.length, base64: bytes.toString('base64'), sha256: createHash('sha256').update(bytes).digest('hex') });
  s.calls.length = 0; const beforeCalls = s.fake.calls.length;
  await assert.rejects(s.service.importBackup('josue', JSON.stringify(payload)), e => e.code === 'IMAGE_DECODE_FAILED');
  assert.deepEqual(s.calls, []); assert.equal(s.fake.calls.length, beforeCalls); assert.equal(s.resources.size, 2);
});
test('checksum corruption fails before any image or database operation', async () => {
  const s = await setup(); const payload = await s.service.exportBackup('kevin', 'kevin-coni'); payload.assets[0].sha256 = '0'.repeat(64);
  s.calls.length = 0; const before = s.fake.calls.length;
  await assert.rejects(s.service.importBackup('josue', JSON.stringify(payload)), e => e.code === 'HASH_MISMATCH');
  assert.deepEqual(s.calls, []); assert.equal(s.fake.calls.length, before);
});
test('failed download aborts export, without success or uploads', async () => {
  const s = await setup({ failDownload: true }); const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await createPetBackupHandlers(s.service).exportBackup({ user: { id: 'kevin' }, params: { id: 'kevin-coni' } }, res);
  assert.equal(res.statusCode, 502); assert.equal(res.body.code, 'IMAGE_DOWNLOAD_FAILED'); assert.equal(res.body.pet, undefined);
  assert.equal(s.calls.some(c => c.operation === 'upload'), false);
});
test('first upload failure never creates database records or deletes originals', async () => {
  const exporter = await setup(); const payload = await exporter.service.exportBackup('kevin', 'kevin-coni');
  const s = await setup({ failUpload: 1 }); const before = s.fake.state();
  await assert.rejects(s.service.importBackup('josue', JSON.stringify(payload)), e => e.code === 'IMAGE_UPLOAD_FAILED');
  assert.deepEqual(s.fake.state(), before); assert.deepEqual(s.fake.calls, []); assert.deepEqual(s.removed, []);
});
test('later upload failure compensates only previous confirmed resources from the same attempt', async () => {
  const exporter = await setup(); const payload = await exporter.service.exportBackup('kevin', 'kevin-coni');
  const s = await setup({ failUpload: 2 }); const before = s.fake.state();
  await assert.rejects(s.service.importBackup('josue', JSON.stringify(payload)), e => e.code === 'IMAGE_UPLOAD_FAILED');
  assert.equal(s.removed.length, 1); assert.equal(s.resources.size, 2); assert.deepEqual(s.fake.state(), before); assert.deepEqual(s.fake.calls, []);
});
for (const database of [{ failModel: 'ClinicaFavorita' }, { failCommit: true }]) {
  test(`database ${JSON.stringify(database)} rolls back rows and compensates all new images`, async () => {
    const exporter = await setup(); const payload = await exporter.service.exportBackup('kevin', 'kevin-coni');
    const s = await setup({ database }); const before = s.fake.state(); await assert.rejects(s.service.importBackup('josue', JSON.stringify(payload)));
    assert.deepEqual(s.fake.state(), before); assert.equal(s.resources.size, 2); assert.equal(s.removed.length, 2);
    assert.ok(s.resources.has('original-main')); assert.ok(s.resources.has('original-card'));
  });
}
test('cleanup failure returns explicit failure with safe attempt ID, never a successful import', async () => {
  const exporter = await setup(); const payload = await exporter.service.exportBackup('kevin', 'kevin-coni');
  const s = await setup({ failCleanup: true, database: { failCommit: true } });
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await createPetBackupHandlers(s.service).importBackup({ user: { id: 'josue' }, body: payload }, res);
  assert.equal(res.statusCode, 502); assert.equal(res.body.code, 'IMAGE_COMPENSATION_FAILED'); assert.equal(res.body.cleanupRequired, true);
  assert.match(res.body.attemptId, /^[a-f0-9-]{36}$/); assert.equal(res.body.mascota, undefined);
  assert.ok(s.resources.has('original-main')); assert.equal(s.fake.state().Mascota.filter(p => p.usuarioId === 'josue').length, 0);
});
test('unexpected returned identity is never deleted', async () => {
  const exporter = await setup(); const payload = await exporter.service.exportBackup('kevin', 'kevin-coni');
  const s = await setup({ unexpectedId: true }); await assert.rejects(s.service.importBackup('josue', JSON.stringify(payload)), e => e.code === 'IMAGE_UPLOAD_UNCERTAIN' && e.cleanupRequired);
  assert.deepEqual(s.removed, []); assert.ok(s.resources.has('original-main')); assert.deepEqual(s.fake.calls, []);
});
test('network work happens outside database transactions', async () => {
  let s;
  s = await setup({ onDownload: () => assert.equal(s.fake.calls.at(-1).operation, 'commit'),
    onUpload: () => assert.equal(s.fake.calls.at(-1).operation, 'commit') });
  const payload = await s.service.exportBackup('kevin', 'kevin-coni'); await s.service.importBackup('josue', JSON.stringify(payload));
});
test('old phase-2 backups remain explicitly incomplete; no images are invented', async () => {
  const fake = fakePrisma(); const service = createPetBackupService(fake.prisma); const payload = await service.exportBackup('kevin', 'kevin-coni');
  payload.warnings.push('IMAGES_OMITTED_PHASE_2'); const result = await service.importBackup('josue', JSON.stringify(payload));
  assert.equal(result.incomplete, true); assert.equal(result.imagesPending, true); assert.equal(result.mascota.imagen, null);
});
test('global image time budget and total normalized byte budget fail before uploads', async () => {
  let time = 0, uploads = 0;
  const images = createBackupImageService({ cloudName: 'example', clock: () => time,
    download: async () => { time = 60001; return { bytes: Buffer.from('x'), mimeType: 'image/png' }; },
    normalize: async () => ({ bytes: Buffer.from('x'), mimeType: 'image/png' }) });
  await assert.rejects(images.exportImages(main, []), e => e.code === 'IMAGE_PROCESSING_TIMEOUT');
  const normalized = createBackupImageService({ cloudName: 'example', normalize: async () => ({ bytes: Buffer.alloc(5 * 1024 * 1024), mimeType: 'image/png' }),
    store: { upload: async () => { uploads++; } } });
  await assert.rejects(normalized.restoreImages(Array.from({ length: 4 }, (_, n) => ({ ref: `a-${n}`, mimeType: 'image/png', base64: 'eA==' }))), e => e.code === 'IMAGE_TOTAL_SIZE');
  assert.equal(uploads, 0);
});
test('duplicate source photos and unsafe source URLs fail without downloads', async () => {
  const s = await setup(); await assert.rejects(s.images.exportImages(main, [card, card]), e => e.code === 'IMAGE_REFERENCES_INVALID');
  await assert.rejects(s.images.exportImages(main, ['http://169.254.169.254/a.png']), e => e.code === 'IMAGE_SOURCE_FORBIDDEN');
  assert.deepEqual(s.calls, []);
});
test('one expensive operation per service instance, no unbounded queue', async () => {
  const fake = fakePrisma(); let release;
  const original = fake.prisma.$transaction; fake.prisma.$transaction = async (...args) => {
    await new Promise(resolve => { release = resolve; }); return original(...args);
  };
  const service = createPetBackupService(fake.prisma); const first = service.exportBackup('kevin', 'kevin-coni');
  await assert.rejects(service.exportBackup('kevin', 'kevin-coni'), e => e.code === 'BACKUP_BUSY'); release(); await first;
});
