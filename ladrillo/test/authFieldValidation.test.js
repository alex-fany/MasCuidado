const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function harness(user = null) {
  const calls = [];
  const handlers = {};
  const context = {
    exports: handlers, process: { env: { JWT_SECRET: 'synthetic-test-only' } }, console: { error() {}, log() {} },
    require(name) {
      if (name === '../config/prisma') return { Usuario: { findUnique: async query => { calls.push(query); return user; }, create: async () => { throw new Error('No se permite crear datos en esta prueba'); } } };
      if (name === 'bcryptjs') return { compare: async value => value === 'correcta' };
      if (name === 'jsonwebtoken') return { sign: () => 'synthetic-session' };
      if (name === 'google-auth-library') return { OAuth2Client: class {} };
      if (name === 'crypto') return require('node:crypto');
      if (name === '../services/mailService') return {};
      throw new Error(`Dependencia no simulada: ${name}`);
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/controllers/authController.js'), 'utf8'), context);
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  return { handlers, response, calls };
}

test('el acceso de una cuenta verificada sigue generando sesión', async () => {
  const h = harness({ id: 'synthetic-user', password: 'hash-simulado', correo: 'demo@example.test', emailVerificado: true });
  await h.handlers.login({ body: { email: ' DEMO@example.test ', password: 'correcta' } }, h.response);
  assert.equal(h.response.statusCode, 200);
  assert.equal(h.response.body.token, 'synthetic-session');
  assert.equal(h.calls[0].where.correo, 'demo@example.test');
});

test('el acceso identifica el correo inexistente y la contraseña incorrecta por separado', async () => {
  const absent = harness();
  const wrong = harness({ password: 'hash-simulado' });
  for (const h of [absent, wrong]) await h.handlers.login({ body: { email: 'demo@example.test', password: 'incorrecta' } }, h.response);
  assert.equal(absent.response.statusCode, 401);
  assert.equal(wrong.response.statusCode, 401);
  assert.equal(absent.response.body.field, 'email');
  assert.equal(wrong.response.body.field, 'password');
  assert.equal(absent.response.body.token, undefined);
  assert.equal(wrong.response.body.token, undefined);
});

test('una cuenta sin contraseña local señala la contraseña sin crear sesión', async () => {
  const h = harness({ id: 'synthetic-google-user', password: null });
  await h.handlers.login({ body: { email: 'demo@example.test', password: 'incorrecta' } }, h.response);
  assert.equal(h.response.statusCode, 401);
  assert.equal(h.response.body.field, 'password');
  assert.equal(h.response.body.token, undefined);
});

test('los campos mal tipados se rechazan sin consultar la base de datos', async () => {
  for (const handler of ['login', 'register']) {
    const h = harness();
    await h.handlers[handler]({ body: { name: {}, email: {}, password: {} } }, h.response);
    assert.equal(h.response.statusCode, 400);
    assert.equal(h.calls.length, 0);
  }
});

test('el registro comprueba duplicados con el mismo correo normalizado que guardaría', async () => {
  const h = harness({ id: 'synthetic-existing' });
  await h.handlers.register({ body: { name: ' Demo ', email: ' DEMO@example.test ', password: 'correcta' } }, h.response);
  assert.equal(h.response.statusCode, 400);
  assert.equal(h.response.body.field, 'email');
  assert.equal(h.calls[0].where.correo, 'demo@example.test');
});

test('la cuenta no verificada conserva los datos necesarios para solicitar verificación', async () => {
  const h = harness({ password: 'hash-simulado', correo: 'demo@example.test', emailVerificado: false });
  await h.handlers.login({ body: { email: 'demo@example.test', password: 'correcta' } }, h.response);
  assert.equal(h.response.statusCode, 403);
  assert.equal(h.response.body.emailNotVerified, true);
  assert.equal(h.response.body.field, 'email');
});
