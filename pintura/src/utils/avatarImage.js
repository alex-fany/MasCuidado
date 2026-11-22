import { AVATAR_OPTIONS, PREMIUM_COLORS } from '../constants/avatars.js';

// Los colores retirados se muestran con una alternativa visible, sin modificar la cuenta.
export function normalizeAvatarColor(color) {
  const normalized = typeof color === 'string' ? color.toLowerCase() : '';
  return PREMIUM_COLORS.includes(normalized) ? normalized : PREMIUM_COLORS[0];
}

export function avatarImageSource(id, color) {
  const avatar = AVATAR_OPTIONS.find(option => option.id === id);
  if (!avatar) return null;
  const safeColor = normalizeAvatarColor(color);
  // El SVG local se aísla como imagen para que sus estilos no afecten a otros avatares.
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(avatar.svg.replace(/{{COLOR}}/g, safeColor))}`;
}
