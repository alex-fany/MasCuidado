const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createTutorialController } = require('../src/controllers/tutorialController');

function setup() {
  const rows = new Map();
  const db = { tutorialProgress: {
    findMany: async ({ where }) => [...rows.values()].filter(row => row.userId === where.userId),
    upsert: async ({ create }) => rows.set(`${create.userId}:${create.tourId}`, create),
    deleteMany: async ({ where }) => { for (const [key, row] of rows) if (row.userId === where.userId) rows.delete(key); },
  } };
  const controller = createTutorialController(db);
  const request = async (operation, id, tourId = 'home', body = {}) => {
    const res = { code: 200, status(code) { this.code = code; return this; }, json(value) { this.value = value; return this; } };
    await controller[operation]({ user: id ? { id } : undefined, params: { tourId }, body }, res);
    return res;
  };
  return { request, db };
}

test('el progreso es independiente por cuenta y compartido entre sesiones', async () => {
  const { request } = setup();
  await request('complete', 'ana');
  assert.deepEqual((await request('get', 'ana')).value.seen, ['home']);
  assert.deepEqual((await request('get', 'bea')).value.seen, []);
  await request('complete', 'ana');
  assert.deepEqual((await request('get', 'ana')).value.seen, ['home']);
});
test('reiniciar solo borra los tutoriales de la cuenta autenticada', async () => {
  const { request } = setup();
  await request('complete', 'ana'); await request('complete', 'bea');
  await request('reset', 'ana');
  assert.deepEqual((await request('get', 'ana')).value.seen, []);
  assert.deepEqual((await request('get', 'bea')).value.seen, ['home']);
});
test('rechaza sesiones ausentes, tutoriales desconocidos y campos externos', async () => {
  const { request } = setup();
  for (const operation of ['get', 'complete', 'reset']) assert.equal((await request(operation)).code, 401);
  assert.equal((await request('complete', 'ana', 'arbitrario')).code, 400);
  assert.equal((await request('complete', 'ana', 'home', { userId: 'bea' })).code, 400);
  for (const body of [null, [], 1, 'home']) assert.equal((await request('complete', 'ana', 'home', body)).code, 400);
  assert.deepEqual((await request('get', 'bea')).value.seen, []);
});
test('no presenta fallos de almacenamiento como éxitos', async () => {
  const { request, db } = setup();
  for (const method of ['findMany', 'upsert', 'deleteMany']) db.tutorialProgress[method] = async () => { throw new Error('secreto interno'); };
  for (const operation of ['get', 'complete', 'reset']) {
    const res = await request(operation, 'ana');
    assert.equal(res.code, 503);
    assert.ok(!res.value.error.includes('secreto'));
  }
});
