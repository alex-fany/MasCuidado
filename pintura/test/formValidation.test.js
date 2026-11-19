import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAuthFields, validationMessage, serverFieldErrors, validateVisibleFields } from '../src/utils/formValidation.js';

test('el registro identifica todos los campos vacíos y formatos incorrectos', () => {
  assert.deepEqual(Object.keys(validateAuthFields('register', { name: ' ', email: '', password: '' })), ['name', 'email', 'password']);
  const errors = validateAuthFields('register', { name: 'a'.repeat(31), email: 'incorrecto', password: '123' });
  assert.deepEqual(Object.keys(errors), ['name', 'email', 'password']);
  assert.deepEqual(validateAuthFields('register', { name: ' Coni ', email: ' demo@example.test ', password: '123456' }), {});
});

test('el acceso no aplica nuevas restricciones de longitud a contraseñas existentes', () => {
  assert.deepEqual(validateAuthFields('login', { email: 'demo@example.test', password: 'abc' }), {});
  assert.deepEqual(Object.keys(validateAuthFields('login', { email: 'incorrecto', password: '' })), ['email', 'password']);
});

test('recuperación y restablecimiento señalan el campo que debe corregirse', () => {
  assert.deepEqual(Object.keys(validateAuthFields('forgot', { email: ' ' })), ['email']);
  assert.deepEqual(Object.keys(validateAuthFields('reset', { password: '123456', confirmPassword: '654321' })), ['confirmPassword']);
  assert.deepEqual(Object.keys(validateAuthFields('reset', { password: '', confirmPassword: '' })), ['password', 'confirmPassword']);
});

test('los mensajes se adaptan a los tres idiomas y tienen respaldo en español', () => {
  for (const language of ['es', 'en', 'pt']) {
    assert.equal(validateAuthFields('forgot', { email: '' }, language).email, validationMessage('required', language));
  }
  assert.notEqual(validationMessage('required', 'en'), validationMessage('required', 'es'));
  assert.equal(validationMessage('required', 'desconocido'), validationMessage('required', 'es'));
});

test('los errores generales o campos desconocidos no ocultan el aviso general', () => {
  assert.deepEqual(serverFieldErrors({ field: 'general', error: 'No disponible' }, ['email', 'password']), {});
  assert.deepEqual(serverFieldErrors({ field: '__proto__', error: 'No disponible' }, ['email']), {});
  assert.deepEqual(serverFieldErrors({ field: 'email', error: 'Revisa el correo' }, ['email']), { email: 'Revisa el correo' });
  assert.deepEqual(serverFieldErrors({ field: 'credentials', error: 'Credenciales inválidas' }, ['email', 'password']), { password: 'Credenciales inválidas' });
});

test('una contraseña incorrecta no marca el correo válido como erróneo', () => {
  const values = { email: 'demo@example.test', password: 'incorrecta' };
  assert.deepEqual(validateAuthFields('login', values), {});
  const errors = serverFieldErrors({ field: 'credentials', error: 'Credenciales inválidas' }, ['email', 'password']);
  assert.equal(Object.hasOwn(errors, 'email'), false);
  assert.equal(errors.password, 'Credenciales inválidas');
  assert.deepEqual(serverFieldErrors({ field: 'credentials', error: 'Credenciales inválidas' }, ['email']), {});
});

test('los errores específicos del acceso solo marcan el campo indicado por el servidor', () => {
  const allowed = ['email', 'password'];
  assert.deepEqual(serverFieldErrors({ field: 'email', error: 'Credenciales inválidas' }, allowed), { email: 'Credenciales inválidas' });
  assert.deepEqual(serverFieldErrors({ field: 'password', error: 'Credenciales inválidas' }, allowed), { password: 'Credenciales inválidas' });
});

test('los editores sin formulario validan todos los campos y enfocan el primero inválido', () => {
  const calls = [];
  const field = (valid, extra = {}) => ({ value: '1', required: false, type: 'number', disabled: false,
    setCustomValidity() {}, checkValidity: () => valid,
    focus: () => calls.push('focus'), scrollIntoView: () => calls.push('scroll'), reportValidity: () => calls.push('report'), ...extra });
  assert.equal(validateVisibleFields({ querySelectorAll: () => [field(false, { disabled: true }), field(false), field(false)] }), false);
  assert.deepEqual(calls, ['focus', 'scroll', 'report']);
  assert.equal(validateVisibleFields({ querySelectorAll: () => [field(true)] }), true);
});
