const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const { createPetBackupHandlers } = require('../src/controllers/petBackupController');
const { createPetBackupService, PetBackupError } = require('../src/services/petBackupService');
const { BackupValidationError } = require('../src/validators/petBackupValidator');
const { fakePrisma } = require('./helpers/backupPrisma');
function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.body = data; return this; } };
}
test('existing mascotaController delegates backup handlers without changing other handlers', async () => {
  const fake = fakePrisma(); const context = { exports: {}, require(name) {
    if (name === '../config/prisma') return fake.prisma;
    if (name === '../config/cloudinary') return { cloudinary: { config: () => ({ cloud_name: 'example' }) }, uploadToCloudinary: () => { throw new Error('External services forbidden'); } };
    if (name === '../services/petBackupService') return require('../src/services/petBackupService');
    if (name === './petBackupController') return { createPetBackupHandlers };
    if (name === '../services/backupImageService') return require('../src/services/backupImageService');
    if (name === '../services/petAccess') return require('../src/services/petAccess');
    throw new Error(`Unexpected require: ${name}`);
  } };
  vm.runInNewContext(readFileSync(join(__dirname, '../src/controllers/mascotaController.js'), 'utf8'), context);
  assert.equal(typeof context.exports.createMascota, 'function'); assert.equal(typeof context.exports.saveFavoriteClinic, 'function');
  const exported = response(); await context.exports.exportBackup({ user: { id: 'kevin' }, params: { id: 'kevin-coni' } }, exported);
  assert.equal(exported.statusCode, 200); assert.equal(exported.body.version, 2);
  const imported = response(); await context.exports.importBackup({ user: { id: 'josue' }, body: exported.body }, imported);
  assert.equal(imported.statusCode, 201); assert.equal(imported.body.mascota.usuarioId, 'josue');
  assert.equal(imported.body.incomplete, false); assert.equal(imported.body.imagesPending, false);
});
test('multipart buffer is passed to service with authenticated session identity', async () => {
  const file = Buffer.from('{}'); let args;
  const handlers = createPetBackupHandlers({ importBackup: async (...values) => { args = values; return { incomplete: false, imagesPending: true }; } });
  const res = response(); await handlers.importBackup({ user: { id: 'josue' }, file: { buffer: file }, body: { usuarioId: 'kevin' } }, res);
  assert.deepEqual(args, ['josue', file]); assert.equal(res.statusCode, 201);
});
test('bare, invalid and legacy JSON bodies reach strict validation without transactions', async () => {
  for (const body of [null, [], 'text', { nombre: 'Coni' }, { app: '+Cuidado', version: '1.0', exportedAt: '2026-11-10T00:00:00Z', pet: { nombre: 'Coni', usuarioId: 'kevin' } }]) {
    const fake = fakePrisma(); const handlers = createPetBackupHandlers(createPetBackupService(fake.prisma)); const res = response();
    await handlers.importBackup({ user: { id: 'josue' }, body }, res);
    assert.equal(res.statusCode, 400); assert.deepEqual(fake.calls, []);
  }
});
for (const [error, status, code] of [
  [new BackupValidationError('$.version', 'UNSUPPORTED_VERSION'), 400, 'UNSUPPORTED_VERSION'],
  [new BackupValidationError('$', 'FILE_SIZE'), 413, 'FILE_SIZE'],
  [new PetBackupError('SPECIES_NOT_AVAILABLE', 422, 'Especie no disponible'), 422, 'SPECIES_NOT_AVAILABLE'],
  [new Error('postgres://user:secret@example.test?token=private'), 500, 'BACKUP_FAILED']]) {
  test(`import failure maps to safe HTTP ${status} ${code}`, async () => {
    const handlers = createPetBackupHandlers({ importBackup: async () => { throw error; } }); const res = response();
    await handlers.importBackup({ user: { id: 'josue' }, body: {} }, res);
    assert.equal(res.statusCode, status); assert.equal(res.body.code, code); assert.equal(JSON.stringify(res.body).includes('secret'), false);
  });
}
test('export errors do not expose database details', async () => {
  const handlers = createPetBackupHandlers({ exportBackup: async () => { throw new Error('password=secret'); } }); const res = response();
  await handlers.exportBackup({ user: { id: 'kevin' }, params: { id: 'kevin-coni' } }, res);
  assert.equal(res.statusCode, 500); assert.equal(JSON.stringify(res.body).includes('secret'), false);
});
test('missing session rejected by service for both existing endpoints', async () => {
  const fake = fakePrisma(); const handlers = createPetBackupHandlers(createPetBackupService(fake.prisma));
  const exported = response(), imported = response();
  await handlers.exportBackup({ params: { id: 'kevin-coni' } }, exported); await handlers.importBackup({ body: {} }, imported);
  assert.equal(exported.statusCode, 401); assert.equal(imported.statusCode, 401); assert.deepEqual(fake.calls, []);
});
test('backup route keeps authentication before file reception and original endpoint paths', () => {
  const routes = []; const router = Object.fromEntries(['get', 'post', 'put', 'delete'].map(method => [method, (...args) => routes.push({ method, args })]));
  const verifyToken = () => {}, receiveBackupFile = () => {}, importBackup = () => {}, exportBackup = () => {};
  const multer = () => ({ single: () => () => {}, fields: () => () => {} }); multer.memoryStorage = () => ({});
  const context = { module: { exports: {} }, require(name) {
    if (name === 'express') return { Router: () => router };
    if (name === 'multer') return multer;
    if (name === 'path') return require('node:path');
    if (name === '../controllers/mascotaController') return { importBackup, exportBackup };
    if (name === '../middlewares/auth') return { verifyToken };
    if (name === '../middlewares/backupFile') return { receiveBackupFile };
    throw new Error('Unexpected dependency');
  } };
  vm.runInNewContext(readFileSync(join(__dirname, '../src/routes/mascotaRoutes.js'), 'utf8'), context);
  assert.deepEqual(Array.from(routes.find(r => r.args[0] === '/import-backup').args), ['/import-backup', verifyToken, receiveBackupFile, importBackup]);
  assert.deepEqual(Array.from(routes.find(r => r.args[0] === '/:id/backup').args), ['/:id/backup', verifyToken, exportBackup]);
});
