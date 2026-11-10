const multer = require('multer');
const { LIMITS } = require('../validators/petBackupValidator');

const upload = multer({ storage: multer.memoryStorage(), limits: {
  fileSize: LIMITS.fileBytes, files: 1, fields: 0, parts: 2
} }).single('backup');
let receiving = 0;

function receiveBackupFile(req, res, next) {
  if (!req.is('multipart/form-data')) return next();
  if (receiving >= 2) return res.status(429).json({ error: 'Hay archivos de respaldo en recepción; inténtalo más tarde', code: 'BACKUP_BUSY' });
  receiving++;
  let released = false, expired = false;
  const release = () => { if (!released) { released = true; receiving--; clearTimeout(timer); } };
  const timer = setTimeout(() => {
    expired = true;
    release(); res.status(408).json({ error: 'Se agotó el tiempo para recibir el archivo', code: 'BACKUP_UPLOAD_TIMEOUT' }); req.destroy();
  }, 30000);
  req.once('close', release);
  upload(req, res, error => {
    release();
    if (expired || req.aborted) return;
    if (error) return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
      error: 'Archivo de respaldo no admitido o demasiado grande', code: error.code || 'INVALID_UPLOAD'
    });
    if (!req.file) return res.status(400).json({ error: 'Selecciona un archivo en el campo backup', code: 'FILE_REQUIRED' });
    return next();
  });
}

module.exports = { receiveBackupFile };
