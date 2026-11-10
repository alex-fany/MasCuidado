const prisma = require('../config/prisma');
const googleCalendarService = require('../services/googleCalendarService');
const { PetAccessError, sessionUserId, requireOwnedPets, reminderId, sendPetError } = require('../services/petAccess');

// Crear recordatorio
exports.createRecordatorio = async (req, res) => {
  try {
    const userId = sessionUserId(req);
    const { mascotaId, titulo, descripcion, fechaHora, syncGoogle } = req.body;
    await requireOwnedPets(prisma, userId, [mascotaId]);

    // Guardar localmente en base de datos primero
    let recordatorio = await prisma.Recordatorio.create({
      data: {
        titulo,
        descripcion,
        fechaHora: new Date(fechaHora),
        mascotaId,
        usuarioId: userId
      }
    });

    // Sincronizar con Google si el usuario lo solicitó
    if (syncGoogle) {
      const googleEventId = await googleCalendarService.createEvent(userId, recordatorio);
      if (googleEventId) {
        recordatorio = await prisma.Recordatorio.update({
          where: { id: recordatorio.id, usuarioId: userId, mascota: { usuarioId: userId } },
          data: { idEventoGoogle: googleEventId }
        });
      }
    }

    res.status(201).json(recordatorio);
  } catch (error) {
    return sendPetError(res, error, 'Error al crear el recordatorio');
  }
};

// Actualizar con sincronización bidireccional
exports.updateRecordatorio = async (req, res) => {
  try {
    const userId = sessionUserId(req);
    const id = reminderId(req.params.id);
    const { titulo, descripcion, fechaHora, syncGoogle } = req.body;

    const recordatorio = await prisma.Recordatorio.findUnique({
      where: { id, usuarioId: userId, mascota: { usuarioId: userId } }
    });

    if (!recordatorio) throw new PetAccessError(404, 'Mascota o recurso no disponible');

    let googleEventId = recordatorio.idEventoGoogle;

    // Manejo de sincronización con Google Calendar
    if (syncGoogle) {
      if (googleEventId) {
        // Si ya existía el evento en Google, lo actualizamos
        await googleCalendarService.updateEvent(userId, googleEventId, {
          titulo, descripcion, fechaHora
        });
      } else {
        // Si no existía y el usuario activó la casilla al editar, creamos el evento
        googleEventId = await googleCalendarService.createEvent(userId, {
          titulo, descripcion, fechaHora
        });
      }
    } else if (syncGoogle === false && googleEventId) {
      // Si el usuario desmarcó la sincronización al editar, eliminamos el evento de Google
      await googleCalendarService.deleteEvent(userId, googleEventId);
      googleEventId = null;
    }

    // Actualizar localmente en PostgreSQL
    await prisma.Recordatorio.update({
      where: { id, usuarioId: userId, mascota: { usuarioId: userId } },
      data: {
        titulo,
        descripcion,
        fechaHora: new Date(fechaHora),
        idEventoGoogle: googleEventId
      }
    });

    res.json({ message: "Recordatorio actualizado" });
  } catch (error) {
    return sendPetError(res, error, 'Error al actualizar el recordatorio');
  }
};

// Eliminar con sincronización
exports.deleteRecordatorio = async (req, res) => {
  try {
    const userId = sessionUserId(req);
    const id = reminderId(req.params.id);

    const recordatorio = await prisma.Recordatorio.findUnique({
      where: { id, usuarioId: userId, mascota: { usuarioId: userId } }
    });

    if (!recordatorio) throw new PetAccessError(404, 'Mascota o recurso no disponible');

    // Eliminar de Google Calendar si existía
    if (recordatorio.idEventoGoogle) {
      try {
        await googleCalendarService.deleteEvent(userId, recordatorio.idEventoGoogle);
      } catch {
        console.warn('No se pudo confirmar la eliminación del evento de Google Calendar');
      }
    }

    // Eliminar localmente de PostgreSQL
    await prisma.Recordatorio.delete({ where: { id, usuarioId: userId, mascota: { usuarioId: userId } } });

    res.json({ message: "Eliminado con éxito" });
  } catch (error) {
    return sendPetError(res, error, 'Error al eliminar el recordatorio');
  }
};

// Obtener todos los recordatorios del usuario
exports.getRecordatorios = async (req, res) => {
  try {
    const userId = sessionUserId(req);
    const recordatorios = await prisma.Recordatorio.findMany({
      where: { usuarioId: userId, mascota: { usuarioId: userId } },
      include: { mascota: true },
      orderBy: { fechaHora: 'asc' }
    });
    res.json(recordatorios);
  } catch (error) {
    return sendPetError(res, error, 'Error al obtener recordatorios');
  }
};
