const { sessionUserId } = require('../services/petAccess');

const tutorialIds = new Set(['welcome', 'home', 'calendar', 'map', 'profile', 'logros',
  'add', 'edit', 'medical', 'nutrition', 'agenda', 'record', 'water', 'backup', 'settings', 'theme', 'language']);

// El usuario siempre procede de la sesión; el cuerpo no admite propietarios ni IDs externos.
function createTutorialController(db) {
  const handler = operation => async (req, res) => {
    try { return await operation(req, res, sessionUserId(req)); } catch (error) {
      return res.status(error.status === 401 ? 401 : 503).json({ error: error.status === 401
        ? 'No autorizado' : 'No se pudo guardar o consultar el progreso de los tutoriales' });
    }
  };
  return {
    get: handler(async (_req, res, userId) => {
      const rows = await db.tutorialProgress.findMany({ where: { userId }, select: { tourId: true } });
      return res.json({ seen: rows.map(row => row.tourId).filter(id => tutorialIds.has(id)) });
    }),
    complete: handler(async (req, res, userId) => {
      if (!tutorialIds.has(req.params.tourId) || !req.body || typeof req.body !== 'object'
        || Array.isArray(req.body) || Object.keys(req.body).length) {
        return res.status(400).json({ error: 'Tutorial o campos no permitidos' });
      }
      const tourId = req.params.tourId;
      await db.tutorialProgress.upsert({ where: { userId_tourId: { userId, tourId } },
        create: { userId, tourId }, update: {} });
      return res.json({ seen: tourId });
    }),
    reset: handler(async (_req, res, userId) => {
      await db.tutorialProgress.deleteMany({ where: { userId } });
      return res.json({ seen: [] });
    }),
  };
}

module.exports = { createTutorialController, tutorialIds };
