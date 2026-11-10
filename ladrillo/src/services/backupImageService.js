const { createHash, randomUUID } = require('node:crypto');
const { normalizeImage } = require('./backupImageCodec');
const { allowedCloudinaryUrl, createImageDownloader, createCloudinaryImageStore } = require('./backupImageTransport');
const { BackupImageError, IMAGE_LIMITS } = require('./backupImageError');
const { LIMITS } = require('../validators/petBackupValidator');

function createBackupImageService({ cloudinary, cloudName = cloudinary?.config().cloud_name,
  download = createImageDownloader({ cloudName }), store = cloudinary ? createCloudinaryImageStore(cloudinary) : null,
  normalize = normalizeImage, clock = Date.now, uuid = randomUUID } = {}) {
  const budget = () => {
    const deadline = clock() + IMAGE_LIMITS.stageMs;
    return () => {
      const left = deadline - clock();
      if (left <= 0) throw new BackupImageError('IMAGE_PROCESSING_TIMEOUT', 'Se agotó el tiempo para procesar las imágenes', 504);
      return Math.min(left, IMAGE_LIMITS.requestMs);
    };
  };

  async function exportImages(image, photos) {
    if (photos != null && !Array.isArray(photos)) throw new BackupImageError('IMAGE_REFERENCES_INVALID', 'La cartilla contiene referencias de imagen inválidas');
    photos = photos ?? [];
    if (photos.length > LIMITS.photos || new Set(photos).size !== photos.length) throw new BackupImageError('IMAGE_REFERENCES_INVALID', 'La cartilla supera el límite de fotos o contiene referencias repetidas');
    const sources = [...new Set([image, ...photos].filter(value => value !== null && value !== undefined))];
    sources.forEach(url => allowedCloudinaryUrl(url, cloudName));
    const remaining = budget(), assets = [], refs = new Map(); let total = 0;
    for (const source of sources) {
      const downloaded = await download(source, { timeoutMs: remaining() });
      remaining();
      const normalized = await normalize(downloaded.bytes, downloaded.mimeType);
      remaining(); total += normalized.bytes.length;
      if (total > IMAGE_LIMITS.normalizedBytes) throw new BackupImageError('IMAGE_TOTAL_SIZE', 'Las imágenes del respaldo superan el límite total');
      const ref = `image-${assets.length + 1}`; refs.set(source, ref);
      assets.push({ ref, mimeType: normalized.mimeType, byteLength: normalized.bytes.length,
        sha256: createHash('sha256').update(normalized.bytes).digest('hex'), base64: normalized.bytes.toString('base64') });
    }
    return { assets, imageRef: image == null ? null : refs.get(image), photoRefs: photos.map(url => refs.get(url)) };
  }

  async function restoreImages(assets) {
    // Decodifica todas las imágenes antes de la primera subida. Una imagen inválida posterior
    // no debe provocar subidas parciales. Limita el tamaño total tras descomprimir y normalizar.
    const remaining = budget(), prepared = []; let total = 0;
    for (const asset of assets) {
      remaining();
      const image = await normalize(Buffer.from(asset.base64, 'base64'), asset.mimeType);
      remaining(); total += image.bytes.length;
      if (total > IMAGE_LIMITS.normalizedBytes) throw new BackupImageError('IMAGE_TOTAL_SIZE', 'Las imágenes restauradas superan el límite total');
      prepared.push({ ref: asset.ref, bytes: image.bytes });
    }
    const attemptId = uuid(), uploaded = [], urls = new Map();
    if (!/^[a-f0-9-]{36}$/i.test(attemptId)) throw new BackupImageError('IMAGE_STORAGE_FAILED', 'No se pudo iniciar el intento de restauración', 500);
    // El consumidor solo recibe funciones con su contexto; ningún ID del archivo llega a remove().
    const compensate = async () => {
      const results = await Promise.allSettled(uploaded.map(resource => store.remove(resource.publicId)));
      if (results.some(r => r.status === 'rejected')) throw new BackupImageError('IMAGE_COMPENSATION_FAILED',
        'La importación falló y no se pudo confirmar la limpieza de todas sus imágenes nuevas', 502, { cleanupRequired: true, attemptId });
    };
    try {
      if (prepared.length && !store) throw new BackupImageError('IMAGE_STORAGE_NOT_CONFIGURED', 'No se configuró el almacenamiento de imágenes', 503);
      for (const image of prepared) {
        const publicId = `mascuidado/backups/${attemptId}/${uuid()}`;
        if (!/^mascuidado\/backups\/[a-f0-9-]{36}\/[a-f0-9-]{36}$/i.test(publicId)) throw new BackupImageError('IMAGE_STORAGE_FAILED', 'No se pudo generar una identidad nueva', 500);
        const resource = await store.upload(image.bytes, publicId, remaining());
        // Solo las identidades confirmadas por el adaptador e iguales al ID solicitado
        // entran al registro de compensación. Nunca se elimina un ID inesperado de la respuesta.
        if (resource?.publicId !== publicId) throw new BackupImageError('IMAGE_UPLOAD_UNCERTAIN', 'No se pudo verificar la identidad de una imagen nueva', 502, { cleanupRequired: true });
        uploaded.push(resource);
        const url = allowedCloudinaryUrl(resource.url, cloudName);
        if (!url.pathname.endsWith(`/${publicId}.png`)) throw new BackupImageError('IMAGE_UPLOAD_FAILED', 'La URL de una imagen nueva no corresponde al intento', 502);
        urls.set(image.ref, resource.url);
        remaining();
      }
      return { urls, compensate, attemptId };
    } catch (error) {
      await compensate();
      if (error instanceof BackupImageError) {
        if (error.cleanupRequired) error.attemptId = attemptId;
        throw error;
      }
      throw new BackupImageError('IMAGE_UPLOAD_FAILED', 'No se pudo restaurar una imagen nueva', 502);
    }
  }
  return { exportImages, restoreImages };
}
module.exports = { createBackupImageService };
