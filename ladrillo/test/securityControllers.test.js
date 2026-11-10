const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const { securityPrisma, securityState } = require('./helpers/securityPrisma');
const access = require('../src/services/petAccess');

function load(name, fake) {
  const effects = { uploads: 0, google: 0 };
  const context = { exports: {}, console: { warn() {}, error() {}, log() {} }, require(path) {
    if (path === '../config/prisma') return fake.db;
    if (path === '../services/petAccess') return access;
    if (path === '../config/cloudinary') return { cloudinary: {}, uploadToCloudinary: async () => { effects.uploads++; return 'https://example.test/nueva.png'; } };
    if (path === '../services/googleCalendarService') return Object.fromEntries(['createEvent', 'updateEvent', 'deleteEvent'].map(key => [key, async () => { effects.google++; return 'evento-propio'; }]));
    if (path === '../services/petBackupService') return require('../src/services/petBackupService');
    if (path === './petBackupController') return require('../src/controllers/petBackupController');
    if (path === '../services/backupImageService') return { createBackupImageService: () => ({}) };
    throw new Error('Dependencia no permitida en la prueba: ' + path);
  } };
  vm.runInNewContext(readFileSync(join(__dirname, '../src/controllers/' + name + 'Controller.js'), 'utf8'), context);
  return { handlers: context.exports, effects };
}
async function call(name, method, req, fake = securityPrisma()) {
  const { handlers, effects } = load(name, fake);
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.body = structuredClone(data); return this; } };
  await handlers[method](req, res); return { ...res, fake, effects };
}
const request = (petId, body = {}) => ({ user: { id: 'kevin' }, params: { id: petId, mascotaId: petId }, body });
const config = { porcionDiaria: 120, metaAguaDiaria: 4, reinicioAguaDias: 1, unidadMedida: 'g', vaciarAgua: true };
const purchase = { marca: 'Nueva', tipo: 'Croquetas', cantidadTotal: 2, costo: 50, unidadMedida: 'kg', compartidaConIds: [], resolveConflict: 'merge' };
const operations = [
  ['mascota', 'getMascotaById', {}], ['mascota', 'updateMascota', { nombre: 'Coni editada' }], ['mascota', 'deleteMascota', {}],
  ['mascota', 'saveFavoriteClinic', { placeId: 'clinica', nombre: 'Clínica', applyToAll: false }],
  ['mascota', 'saveFavoriteClinic', { placeId: 'clinica', nombre: 'Clínica', applyToAll: true }],
  ['nutricion', 'getEstadoNutricional', {}], ['nutricion', 'registrarCompra', purchase],
  ['nutricion', 'actualizarCompartirActual', { compartidaConIds: ['b'], resolveConflict: 'merge' }],
  ['nutricion', 'dejarDeCompartir', {}], ['nutricion', 'updateConfig', config], ['nutricion', 'registrarAgua', { cantidad: 1 }]
];
function foreignRows(state) {
  return Object.fromEntries(Object.entries(state).map(([model, rows]) => [model, rows.filter(r => r.mascotaId === 'x' || r.usuarioId === 'josue')]));
}
for (const [controller, method, body] of operations) {
  const label = controller + '.' + method + (body.applyToAll ? ' todas' : '');
  test(label + ': rechaza mascota ajena e inexistente sin efectos', async () => {
    let previous;
    for (const id of ['x', 'missing']) {
      const fake = securityPrisma(), before = structuredClone(fake.state);
      const req = request(id, structuredClone(body)); req.files = { imagen: [{ buffer: Buffer.from('sintética') }] };
      const result = await call(controller, method, req, fake);
      assert.equal(result.statusCode, 404); assert.deepEqual(fake.state, before); assert.equal(fake.writes().length, 0);
      assert.equal(result.effects.uploads, 0); assert.equal(result.effects.google, 0);
      assert.equal(JSON.stringify(result.body).includes('Privada'), false);
      if (previous) assert.deepEqual(result.body, previous); previous = result.body;
    }
  });
  test(label + ': permite acceso propio sin modificar datos ajenos', async () => {
    const fake = securityPrisma(), before = foreignRows(structuredClone(fake.state));
    const result = await call(controller, method, request('a', structuredClone(body)), fake);
    assert.ok([200, 201].includes(result.statusCode), JSON.stringify(result.body)); assert.deepEqual(foreignRows(fake.state), before);
  });
  test(label + ': exige sesión antes de operar', async () => {
    const req = request('a', structuredClone(body)); delete req.user;
    const result = await call(controller, method, req); assert.equal(result.statusCode, 401); assert.equal(result.fake.calls.length, 0);
  });
}
test('edición ajena con vacunas y archivos no sube imágenes ni borra vacunas', async () => {
  const req = request('x', { vacunas: '[]', usuarioId: 'kevin' }); req.files = { imagen: [{ buffer: Buffer.from('prueba') }], fotosCartilla: [{ buffer: Buffer.from('prueba') }] };
  const result = await call('mascota', 'updateMascota', req); assert.equal(result.statusCode, 404); assert.equal(result.effects.uploads, 0); assert.equal(result.fake.writes().length, 0);
});
test('eliminar una mascota propia no puede borrar en cascada vínculos de otra cuenta', async () => {
  const state = securityState(); state.CompartirAlimento.push({ id: 'ajeno', inventarioId: 'food-a', mascotaId: 'x' });
  const fake = securityPrisma(state), before = structuredClone(fake.state);
  const result = await call('mascota', 'deleteMascota', request('a'), fake);
  assert.equal(result.statusCode, 404); assert.deepEqual(fake.state, before); assert.equal(fake.writes().length, 0);
});
test('el helper de autorización rechaza una identidad ausente aunque los IDs sean válidos', async () => {
  const fake = securityPrisma(); await assert.rejects(access.requireOwnedPets(fake.db, undefined, ['a']), e => e.status === 401);
  assert.equal(fake.calls.length, 0);
});
test('edición propia de cartilla y foto mantiene las vacunas de otras mascotas', async () => {
  const state = securityState(); state.Vacuna.push({ id: 11, mascotaId: 'x', nombreVacuna: 'Privada' }); const fake = securityPrisma(state);
  const req = request('a', { vacunas: JSON.stringify([{ nombre: 'Rabia', fecha: '2026-11-10', proxima: '' }]) }); req.files = { imagen: [{ buffer: Buffer.from('prueba') }] };
  const result = await call('mascota', 'updateMascota', req, fake); assert.equal(result.statusCode, 200); assert.equal(result.effects.uploads, 1);
  assert.equal(fake.state.Vacuna.filter(v => v.mascotaId === 'x').length, 1);
});
test('clínica aplicada a todas las mascotas respeta la cuenta', async () => {
  const fake = securityPrisma(); const result = await call('mascota', 'saveFavoriteClinic', request('a', { placeId: 'id', nombre: 'Clínica', applyToAll: true }), fake);
  assert.equal(result.statusCode, 200); assert.deepEqual(fake.state.ClinicaFavorita.map(c => c.mascotaId).sort(), ['a', 'b']);
});
test('crear mascota ignora usuarioId del cuerpo y usa la sesión', async () => {
  const result = await call('mascota', 'createMascota', request('a', { nombre: 'Nueva', tipo: 'Gato', usuarioId: 'josue' }));
  assert.equal(result.statusCode, 201); assert.equal(result.body.usuarioId, 'kevin');
});
for (const method of ['registrarCompra', 'actualizarCompartirActual']) {
  test(method + ': rechaza integrantes de otra cuenta antes de cambios o conflictos', async () => {
    const fake = securityPrisma(), before = structuredClone(fake.state);
    const result = await call('nutricion', method, request('a', { ...purchase, compartidaConIds: ['b', 'x'] }), fake);
    assert.equal(result.statusCode, 404); assert.deepEqual(fake.state, before); assert.equal(fake.writes().length, 0);
    assert.equal(Object.hasOwn(result.body, 'pets'), false);
  });
  for (const invalid of ['b', [null], [{}], [12], [''], ['a', 'x']]) {
    test(method + ': valida la lista de IDs ' + JSON.stringify(invalid), async () => {
      const result = await call('nutricion', method, request('a', { ...purchase, compartidaConIds: invalid }));
      assert.equal(result.statusCode, Array.isArray(invalid) && invalid.includes('x') ? 404 : 400); assert.equal(result.fake.writes().length, 0);
    });
  }
}
for (const method of ['getEstadoNutricional', 'registrarCompra', 'actualizarCompartirActual', 'dejarDeCompartir', 'updateConfig', 'registrarAgua', 'getEventosNutricionales']) {
  for (const historical of [false, true]) {
    test(method + ': bloquea vínculos cruzados ' + (historical ? 'históricos' : 'activos'), async () => {
      const state = securityState(); state.InventarioAlimento.find(i => i.id === 'food-x').estado = historical ? 'Agotado' : 'Activo';
      state.CompartirAlimento.push({ id: 'cruzado', inventarioId: 'food-x', mascotaId: 'b' });
      const fake = securityPrisma(state), before = structuredClone(fake.state);
      const result = await call('nutricion', method, request('b', { ...purchase, ...config }), fake);
      assert.equal(result.statusCode, 404); assert.deepEqual(fake.state, before); assert.equal(fake.writes().length, 0);
    });
  }
}
test('grupos legítimos permiten consultar y registrar compras desde una mascota secundaria', async () => {
  const fake = securityPrisma(); let result = await call('nutricion', 'getEstadoNutricional', request('b'), fake);
  assert.equal(result.statusCode, 200); assert.equal(result.body.alimento.esCompartido, true); assert.ok(result.body.alimento.grupoIds.includes('a'));
  result = await call('nutricion', 'registrarCompra', request('b', { ...purchase, compartidaConIds: ['a'] }), fake);
  assert.equal(result.statusCode, 201); assert.equal(result.body.mascotaId, 'b');
  assert.ok(fake.state.CompartirAlimento.some(c => c.inventarioId === result.body.id && c.mascotaId === 'a'));
});
test('salir como participante conserva inventario; salir como titular lo transfiere dentro de la cuenta', async () => {
  const secondary = securityPrisma(); const a = await call('nutricion', 'dejarDeCompartir', request('b'), secondary);
  assert.equal(a.statusCode, 200); assert.equal(secondary.state.InventarioAlimento.find(i => i.id === 'food-a').mascotaId, 'a');
  const primary = securityPrisma(); const b = await call('nutricion', 'dejarDeCompartir', request('a'), primary);
  assert.equal(b.statusCode, 200); assert.equal(primary.state.InventarioAlimento.find(i => i.id === 'food-a').mascotaId, 'b');
});
test('grupos duplicados se normalizan sin crear vínculos repetidos', async () => {
  const result = await call('nutricion', 'actualizarCompartirActual', request('a', { compartidaConIds: ['b', 'b'] }));
  assert.equal(result.statusCode, 200); assert.equal(result.fake.state.CompartirAlimento.filter(c => c.inventarioId === 'food-a' && c.mascotaId === 'b').length, 1);
});
test('el calendario nutricional solo incluye grupos autorizados', async () => {
  const result = await call('nutricion', 'getEventosNutricionales', request('a'));
  assert.equal(result.statusCode, 200); assert.equal(result.body.length, 1); assert.equal(JSON.stringify(result.body).includes('Privada'), false);
});
test('recordatorios: crear requiere mascota propia antes de sincronizar', async () => {
  for (const id of ['x', 'missing']) {
    const result = await call('recordatorio', 'createRecordatorio', request('a', { mascotaId: id, titulo: 'Prueba', fechaHora: '2026-11-10T12:00:00Z', syncGoogle: true }));
    assert.equal(result.statusCode, 404); assert.equal(result.effects.google, 0); assert.equal(result.fake.writes().length, 0);
  }
  const result = await call('recordatorio', 'createRecordatorio', request('a', { mascotaId: 'a', usuarioId: 'josue', titulo: 'Propio', fechaHora: '2026-11-10T12:00:00Z', syncGoogle: true }));
  assert.equal(result.statusCode, 201); assert.equal(result.body.usuarioId, 'kevin'); assert.equal(result.effects.google, 1);
});
for (const method of ['updateRecordatorio', 'deleteRecordatorio']) {
  for (const id of ['2', '3', '999']) {
    test(method + ': rechaza recordatorio ajeno, inconsistente o inexistente ' + id, async () => {
      const req = request(id, { titulo: 'Cambiado', fechaHora: '2026-11-11T12:00:00Z', syncGoogle: true });
      const result = await call('recordatorio', method, req);
      assert.equal(result.statusCode, 404); assert.equal(result.effects.google, 0); assert.equal(result.fake.writes().length, 0);
    });
  }
  test(method + ': permite el recordatorio propio y conserva los ajenos', async () => {
    const fake = securityPrisma(), before = foreignRows(structuredClone(fake.state));
    const result = await call('recordatorio', method, request('1', { titulo: 'Cambiado', fechaHora: '2026-11-11T12:00:00Z', syncGoogle: true }), fake);
    assert.equal(result.statusCode, 200); assert.equal(result.effects.google, 1); assert.deepEqual(foreignRows(fake.state), before);
  });
  test(method + ': rechaza IDs parcialmente numéricos', async () => {
    const result = await call('recordatorio', method, request('1-invalido'));
    assert.equal(result.statusCode, 400); assert.equal(result.fake.calls.length, 0);
  });
}
test('listado de recordatorios no revela mascotas de relaciones antiguas inconsistentes', async () => {
  const result = await call('recordatorio', 'getRecordatorios', request('a'));
  assert.equal(result.statusCode, 200); assert.deepEqual(result.body.map(r => r.id), [1]);
});
const publicKeys = ['id', 'nombreCompleto', 'correo', 'telefono', 'fechaRegistro', 'imagen', 'colorAvatar', 'googleId', 'estado', 'mascotas'].sort();
for (const method of ['getMyProfile', 'updateMyProfile']) {
  for (const googleLinked of [false, true]) {
    test(method + ': mantiene campos de interfaz y excluye secretos, vínculo Google=' + googleLinked, async () => {
      const state = securityState(); state.Usuario[0].googleId = googleLinked ? 'id-google-interno' : null;
      const fake = securityPrisma(state, { ignoreUserSelect: true });
      const result = await call('user', method, request('a', { nombre_completo: 'Nombre nuevo', telefono: '+52 1234567890', imagen: 'avatar-2', colorAvatar: '#123456', password: 'inyectado', googleRefreshToken: 'inyectado', usuarioId: 'josue' }), fake);
      assert.equal(result.statusCode, 200); assert.deepEqual(Object.keys(result.body).sort(), publicKeys);
      assert.equal(result.body.googleId, googleLinked); assert.equal(result.body.id, 'kevin');
      assert.deepEqual(Object.keys(result.body.mascotas[0]).sort(), ['id', 'nombre']);
      for (const secret of ['hash-sintetico', 'token-sintetico', 'recuperacion-sintetica', 'id-google-interno', 'campoInternoFuturo', 'inyectado']) assert.equal(JSON.stringify(result.body).includes(secret), false);
      const finalQuery = fake.calls.findLast(c => c.model === 'Usuario' && c.operation === (method === 'getMyProfile' ? 'findUnique' : 'update'));
      assert.deepEqual(Object.keys(finalQuery.args.select).sort(), publicKeys);
      assert.deepEqual(Object.keys(finalQuery.args.select.mascotas.select).sort(), ['id', 'nombre']);
      assert.equal(fake.state.Usuario[0].password, 'hash-sintetico'); assert.equal(fake.state.Usuario[0].googleRefreshToken, 'token-sintetico');
      assert.equal(fake.state.Usuario[0].nombreCompleto, method === 'updateMyProfile' && !googleLinked ? 'Nombre nuevo' : 'Kevin');
    });
  }
  test(method + ': sesión ausente o usuario inexistente no expone datos', async () => {
    const req = request('a'); delete req.user; let result = await call('user', method, req);
    assert.equal(result.statusCode, 401); assert.equal(result.fake.calls.length, 0);
    result = await call('user', method, { ...request('a'), user: { id: 'missing' } }); assert.equal(result.statusCode, 404);
  });
}
test('errores internos se devuelven sin detalles de conexión ni datos sensibles', async () => {
  for (const [controller, method, fail] of [['user', 'getMyProfile', 'Usuario.findUnique'], ['mascota', 'getMascotaById', 'Mascota.findMany'], ['nutricion', 'registrarAgua', 'Mascota.findMany']]) {
    const result = await call(controller, method, request('a'), securityPrisma(securityState(), { fail }));
    assert.equal(result.statusCode, 500); assert.equal(JSON.stringify(result.body).includes('sensible'), false);
  }
});
