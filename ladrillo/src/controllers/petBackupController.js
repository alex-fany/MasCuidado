const { BackupValidationError } = require('../validators/petBackupValidator');
const { PetBackupError } = require('../services/petBackupService');
const { BackupImageError } = require('../services/backupImageError');

function sendError(res, error) {
  if (error instanceof BackupValidationError) {
    return res.status(error.code === 'FILE_SIZE' ? 413 : 400).json({ error: error.code === 'FILE_SIZE'
      ? 'El archivo de respaldo supera el límite de 20 MiB' : 'Archivo de respaldo inválido', code: error.code, path: error.path });
  }
  if (error instanceof PetBackupError) return res.status(error.status).json({ error: error.message, code: error.code });
  if (error instanceof BackupImageError) return res.status(error.status).json({ error: error.message, code: error.code,
    cleanupRequired: error.cleanupRequired, ...(error.attemptId ? { attemptId: error.attemptId } : {}) });
  // La respuesta no expone detalles de conexión a la base de datos ni datos clínicos del archivo.
  return res.status(500).json({ error: 'No se pudo completar la operación de respaldo', code: 'BACKUP_FAILED' });
}

function createPetBackupHandlers(service) {
  return {
    exportBackup: async (req, res) => {
      try { return res.json(await service.exportBackup(req.user?.id, req.params.id)); }
      catch (error) { return sendError(res, error); }
    },
    importBackup: async (req, res) => {
      try {
        // JSON mantiene la compatibilidad del endpoint; multipart admite un archivo con tamaño limitado
        // sin aumentar el límite global de express.json para las demás rutas.
        if (!req.file && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) {
          throw new BackupValidationError('$', 'FILE_TYPE');
        }
        const file = req.file ? req.file.buffer : JSON.stringify(req.body);
        const result = await service.importBackup(req.user?.id, file);
        return res.status(201).json({ message: result.incomplete
          ? 'Datos importados como copia independiente; revisa las limitaciones del respaldo'
          : 'Mascota e imágenes importadas como copia independiente.', ...result });
      } catch (error) { return sendError(res, error); }
    }
  };
}

module.exports = { createPetBackupHandlers };
