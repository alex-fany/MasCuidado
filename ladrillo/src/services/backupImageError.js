class BackupImageError extends Error {
  constructor(code, message, status = 422, details = {}) {
    super(message); this.name = 'BackupImageError'; this.code = code; this.status = status;
    this.cleanupRequired = details.cleanupRequired === true;
    this.attemptId = details.attemptId;
  }
}
const IMAGE_LIMITS = Object.freeze({ pixels: 8000000, dimension: 8192, decodeSeconds: 5,
  requestMs: 10000, stageMs: 60000, normalizedBytes: 15 * 1024 * 1024 });
module.exports = { BackupImageError, IMAGE_LIMITS };
