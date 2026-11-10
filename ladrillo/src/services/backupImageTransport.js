const https = require('node:https');
const dns = require('node:dns').promises;
const { BlockList, isIP } = require('node:net');
const { LIMITS } = require('../validators/petBackupValidator');
const { BackupImageError, IMAGE_LIMITS } = require('./backupImageError');

const blocked = new BlockList();
for (const [address, prefix] of [['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16],
  ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4]]) blocked.addSubnet(address, prefix);

function allowedCloudinaryUrl(value, cloudName) {
  if (typeof cloudName !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(cloudName)) throw new BackupImageError('IMAGE_STORAGE_NOT_CONFIGURED', 'No se configuró el almacenamiento de imágenes', 503);
  if (typeof value !== 'string' || value.length > 2048 || /[%\\\s]/.test(value) || value.includes('/../') || value.includes('/./')) throw new BackupImageError('IMAGE_SOURCE_FORBIDDEN', 'La imagen no tiene una URL de origen permitida');
  let url; try { url = new URL(value); } catch { throw new BackupImageError('IMAGE_SOURCE_FORBIDDEN', 'La imagen no tiene una URL de origen permitida'); }
  const prefix = `/${cloudName}/image/upload/`;
  if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com' || url.port || url.username || url.password || url.search || url.hash
    || !url.pathname.startsWith(prefix) || !/^v\d+\/[a-zA-Z0-9_/-]+\.(?:png|jpe?g|webp)$/.test(url.pathname.slice(prefix.length))) {
    throw new BackupImageError('IMAGE_SOURCE_FORBIDDEN', 'Solo se pueden respaldar imágenes versionadas de Cloudinary del proyecto');
  }
  return url;
}

function createImageDownloader({ cloudName, lookup = dns.lookup, request = https.request } = {}) {
  return async function download(value, { timeoutMs = IMAGE_LIMITS.requestMs } = {}) {
    const url = allowedCloudinaryUrl(value, cloudName);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let req;
    try {
      const records = await Promise.race([lookup(url.hostname, { family: 4, all: true }), new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => reject(new BackupImageError('IMAGE_DOWNLOAD_TIMEOUT', 'Se agotó el tiempo para descargar una imagen', 504)), { once: true });
      })]);
      if (!records.length || records.some(r => isIP(r.address) !== 4 || blocked.check(r.address))) {
        throw new BackupImageError('IMAGE_ADDRESS_FORBIDDEN', 'La dirección del servidor de imágenes no está permitida');
      }
      return await new Promise((resolve, reject) => {
        const fail = error => { req?.destroy(); reject(error); };
        req = request(url, { family: 4, autoSelectFamily: false, agent: false, signal: controller.signal, maxHeaderSize: 8192,
          // La resolución DNS se comprueba una vez y se fija al socket. TLS verifica el nombre del servidor.
          lookup: (_host, _options, callback) => callback(null, records[0].address, 4),
          headers: { Accept: 'image/png, image/jpeg, image/webp', 'Accept-Encoding': 'identity' }
        }, res => {
          const mimeType = res.headers['content-type']?.split(';')[0].trim().toLowerCase();
          if (res.statusCode !== 200) { res.destroy(); return fail(new BackupImageError('IMAGE_DOWNLOAD_STATUS', 'La imagen no está disponible o intentó redirigir la descarga', 502)); }
          if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType) || (res.headers['content-encoding'] && res.headers['content-encoding'] !== 'identity')) {
            res.destroy(); return fail(new BackupImageError('IMAGE_FORMAT', 'El servidor no devolvió una imagen admitida'));
          }
          const length = res.headers['content-length'];
          if (length !== undefined && (!/^\d+$/.test(length) || Number(length) > LIMITS.imageBytes)) {
            res.destroy(); return fail(new BackupImageError('IMAGE_SIZE', 'La imagen remota supera el límite permitido'));
          }
          let size = 0; const chunks = [];
          res.on('data', chunk => {
            size += chunk.length;
            if (size > LIMITS.imageBytes) { res.destroy(); fail(new BackupImageError('IMAGE_SIZE', 'La imagen remota supera 5 MiB')); }
            else chunks.push(chunk);
          });
          res.on('error', () => fail(new BackupImageError('IMAGE_DOWNLOAD_FAILED', 'La descarga de una imagen se interrumpió', 502)));
          res.on('aborted', () => fail(new BackupImageError('IMAGE_DOWNLOAD_FAILED', 'La descarga de una imagen se interrumpió', 502)));
          res.on('end', () => {
            if (!size || (length !== undefined && Number(length) !== size)) return fail(new BackupImageError('IMAGE_SIZE', 'La descarga de la imagen está incompleta'));
            resolve({ bytes: Buffer.concat(chunks, size), mimeType });
          });
        });
        req.on('error', () => reject(new BackupImageError(controller.signal.aborted ? 'IMAGE_DOWNLOAD_TIMEOUT' : 'IMAGE_DOWNLOAD_FAILED',
          controller.signal.aborted ? 'Se agotó el tiempo para descargar una imagen' : 'No se pudo descargar una imagen', controller.signal.aborted ? 504 : 502)));
        req.end();
      });
    } catch (error) {
      if (error instanceof BackupImageError) throw error;
      throw new BackupImageError('IMAGE_DOWNLOAD_FAILED', 'No se pudo resolver o descargar una imagen', 502);
    } finally { clearTimeout(timer); }
  };
}

function createCloudinaryImageStore(cloudinary) {
  const isNewNamespace = id => typeof id === 'string' && /^mascuidado\/backups\/[a-f0-9-]{36}\/[a-f0-9-]{36}$/i.test(id);
  const store = {
    upload(bytes, publicId, timeoutMs = IMAGE_LIMITS.requestMs) {
      if (!isNewNamespace(publicId)) return Promise.reject(new BackupImageError('IMAGE_ID_FORBIDDEN', 'La identidad de la imagen nueva no está permitida'));
      return new Promise((resolve, reject) => {
        let finished = false, timedOut = false, lateCleaned = false, stream;
        const timer = setTimeout(() => {
          if (finished) return; finished = true; timedOut = true; stream?.destroy();
          reject(new BackupImageError('IMAGE_UPLOAD_UNCERTAIN', 'No se pudo confirmar la subida; puede requerir revisión del intento', 502, { cleanupRequired: true }));
        }, timeoutMs);
        const done = (error, result) => {
          if (finished) {
            // Una subida que agotó su tiempo puede confirmarse después. Solo esa identidad
            // nueva, confirmada tardíamente, puede compensarse; las notificaciones de éxito duplicadas
            // de una subida normal nunca deben eliminar una imagen ya guardada.
            if (timedOut && !lateCleaned && !error && result?.existing !== true && result?.public_id === publicId
              && result.resource_type === 'image' && result.type === 'upload') {
              lateCleaned = true;
              store.remove(publicId).catch(() => {
                // El error HTTP ya indica cleanupRequired e identifica este intento.
                console.error('BACKUP_LATE_IMAGE_CLEANUP_FAILED', publicId.split('/')[2]);
              });
            }
            return;
          }
          finished = true; clearTimeout(timer);
          if (error) return reject(new BackupImageError('IMAGE_UPLOAD_FAILED', 'No se pudo confirmar la subida de una imagen nueva', 502,
            { cleanupRequired: ![400, 401, 403, 409].includes(error.http_code) }));
          if (result?.existing === true) return reject(new BackupImageError('IMAGE_ID_COLLISION', 'La identidad generada ya existe; no se modificó ese recurso', 409));
          // Nunca se devuelve una identidad administrativa inesperada para su eliminación.
          if (result?.public_id !== publicId || result.resource_type !== 'image' || result.type !== 'upload') {
            return reject(new BackupImageError('IMAGE_UPLOAD_UNCERTAIN', 'El almacenamiento devolvió una identidad de imagen inesperada', 502, { cleanupRequired: true }));
          }
          resolve({ publicId, url: result.secure_url });
        };
        try {
          stream = cloudinary.uploader.upload_stream({ public_id: publicId, resource_type: 'image', type: 'upload',
            overwrite: false, unique_filename: false, use_filename: false, format: 'png', timeout: timeoutMs }, done);
          stream.on('error', () => done(new Error('stream failure')));
          stream.end(bytes);
        } catch { done(new Error('upload failure')); }
      });
    },
    remove(publicId) {
      if (!isNewNamespace(publicId)) return Promise.reject(new BackupImageError('IMAGE_ID_FORBIDDEN', 'No se permite compensar un recurso ajeno al respaldo'));
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new BackupImageError('IMAGE_CLEANUP_FAILED', 'No se pudo confirmar la compensación', 502)), IMAGE_LIMITS.requestMs);
        Promise.resolve().then(() => cloudinary.uploader.destroy(publicId, { resource_type: 'image', type: 'upload', invalidate: true, timeout: IMAGE_LIMITS.requestMs }))
          .then(result => { clearTimeout(timer); if (result?.result === 'ok' || result?.result === 'not found') resolve(); else reject(new Error('cleanup failed')); }, error => { clearTimeout(timer); reject(error); });
      });
    }
  };
  return store;
}
module.exports = { allowedCloudinaryUrl, createImageDownloader, createCloudinaryImageStore };
