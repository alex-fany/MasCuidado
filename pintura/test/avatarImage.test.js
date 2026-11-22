import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AVATAR_OPTIONS, PREMIUM_COLORS } from '../src/constants/avatars.js';
import { avatarImageSource, normalizeAvatarColor } from '../src/utils/avatarImage.js';

test('todos los avatares y colores generan imágenes aisladas, sin estilos globales', () => {
  for (const avatar of AVATAR_OPTIONS) for (const color of PREMIUM_COLORS) {
    const source = avatarImageSource(avatar.id, color);
    assert.ok(source.startsWith('data:image/svg+xml;charset=utf-8,'));
    const svg = decodeURIComponent(source.split(',')[1]);
    assert.ok(svg.startsWith('<svg'));
    assert.ok(svg.includes(color));
    assert.ok(!svg.includes('{{COLOR}}'));
  }
});
test('los colores inválidos no pueden insertar contenido en el SVG', () => {
  for (const color of ['</style><script>alert(1)</script>', '#fff;fill:red', null, 42]) {
    const svg = decodeURIComponent(avatarImageSource('avatar1', color).split(',')[1]);
    assert.ok(svg.includes(PREMIUM_COLORS[0]));
    assert.ok(!svg.includes('<script>'));
  }
  assert.equal(avatarImageSource('desconocido', '#2d9b96'), null);
  assert.equal(avatarImageSource(null, '#2d9b96'), null);
});

test('los turquesas retirados tienen una alternativa visible y no aparecen en la paleta', () => {
  for (const color of ['#2d9b96', '#4ebfba', '#3aaba5', '#1a5d5a']) {
    assert.ok(!PREMIUM_COLORS.includes(color));
    assert.equal(normalizeAvatarColor(color), PREMIUM_COLORS[0]);
  }
});
