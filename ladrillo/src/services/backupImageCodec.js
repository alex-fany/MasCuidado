const sharp = require('sharp');
const { LIMITS } = require('../validators/petBackupValidator');
const { BackupImageError, IMAGE_LIMITS } = require('./backupImageError');

// Dependencia exclusiva del respaldo: procesa imágenes en secuencia y desactiva la caché nativa.
sharp.cache(false);
sharp.concurrency(1);
const formats = { 'image/png': 'png', 'image/jpeg': 'jpeg', 'image/webp': 'webp' };

async function normalizeImage(bytes, mimeType) {
  if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > LIMITS.imageBytes) {
    throw new BackupImageError('IMAGE_SIZE', 'La imagen está vacía o supera 5 MiB');
  }
  if (!Object.hasOwn(formats, mimeType)) throw new BackupImageError('IMAGE_FORMAT', 'Solo se admiten imágenes PNG, JPEG o WebP');
  try {
    const pipeline = sharp(bytes, { failOn: 'warning', limitInputPixels: IMAGE_LIMITS.pixels, sequentialRead: true });
    const metadata = await pipeline.metadata();
    if (metadata.format !== formats[mimeType]) throw new BackupImageError('IMAGE_FORMAT', 'El formato real de la imagen no coincide con el declarado');
    if (!metadata.width || !metadata.height || metadata.width > IMAGE_LIMITS.dimension || metadata.height > IMAGE_LIMITS.dimension
      || metadata.width * metadata.height > IMAGE_LIMITS.pixels || (metadata.pages ?? 1) !== 1) {
      throw new BackupImageError('IMAGE_DIMENSIONS', 'La imagen supera los límites de dimensiones o contiene animación');
    }
    // La decodificación completa y la salida PNG sin pérdida eliminan EXIF, scripts y contenido añadido
    // y los metadatos del contenedor. La orientación automática conserva la apariencia de la imagen.
    const normalized = await pipeline.autoOrient().png().timeout({ seconds: IMAGE_LIMITS.decodeSeconds }).toBuffer();
    if (normalized.length > LIMITS.imageBytes) throw new BackupImageError('IMAGE_SIZE', 'La imagen normalizada supera 5 MiB; no se redimensionó ni se omitió');
    return { bytes: normalized, mimeType: 'image/png' };
  } catch (error) {
    if (error instanceof BackupImageError) throw error;
    throw new BackupImageError('IMAGE_DECODE_FAILED', 'No se pudo decodificar la imagen completa dentro de los límites permitidos');
  }
}
module.exports = { normalizeImage };
