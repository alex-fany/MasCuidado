import { customIconSources } from './customIconRegistry';

// Los SVG se muestran como recursos locales, sin insertar HTML ni modificar sus colores.
export default function CustomIcon({ name, size = '1em', width = size, height = size, className = '', label = '', muted = false }) {
  const src = customIconSources[name];
  if (!src) return null;
  return <img src={src} alt={label} aria-hidden={label ? undefined : true} draggable={false}
    className={'inline-block align-middle shrink-0 object-contain ' + className}
    style={{ width, height, ...(muted ? { filter: 'grayscale(1)', opacity: 0.65 } : {}) }} />;
}
