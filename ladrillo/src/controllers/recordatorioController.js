const prisma = require('../config/prisma');
const googleCalendarService = require('../services/googleCalendarService');

// Crear recordatorio
exports.createRecordatorio = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mascotaId, titulo, descripcion, fechaHora, syncGoogle } = req.body;

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
          where: { id: recordatorio.id },
          data: { idEventoGoogle: googleEventId }
        });
      }
    }

    res.status(201).json(recordatorio);
  } catch (error) {
    console.error("Error en createRecordatorio:", error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar con sincronización bidireccional
exports.updateRecordatorio = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { titulo, descripcion, fechaHora, syncGoogle } = req.body;

    const recordatorio = await prisma.Recordatorio.findUnique({
      where: { id: parseInt(id), usuarioId: userId }
    });

    if (!recordatorio) return res.status(404).json({ error: "No encontrado" });

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
      where: { id: parseInt(id) },
      data: {
        titulo,
        descripcion,
        fechaHora: new Date(fechaHora),
        idEventoGoogle: googleEventId
      }
    });

    res.json({ message: "Recordatorio actualizado" });
  } catch (error) {
    console.error("Error en updateRecordatorio:", error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar con sincronización
exports.deleteRecordatorio = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const recordatorio = await prisma.Recordatorio.findUnique({
      where: { id: parseInt(id), usuarioId: userId }
    });

    if (!recordatorio) return res.status(404).json({ error: "No encontrado" });

    // Eliminar de Google Calendar si existía
    if (recordatorio.idEventoGoogle) {
      try {
        await googleCalendarService.deleteEvent(userId, recordatorio.idEventoGoogle);
      } catch (gErr) {
        console.warn("Aviso al eliminar de Google Calendar:", gErr.message || gErr);
      }
    }

    // Eliminar localmente de PostgreSQL
    await prisma.Recordatorio.delete({ where: { id: parseInt(id) } });

    res.json({ message: "Eliminado con éxito" });
  } catch (error) {
    console.error("Error en deleteRecordatorio:", error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los recordatorios del usuario
exports.getRecordatorios = async (req, res) => {
  try {
    const userId = req.user.id;
    const recordatorios = await prisma.Recordatorio.findMany({
      where: { usuarioId: userId },
      include: { mascota: true },
      orderBy: { fechaHora: 'asc' }
    });
    res.json(recordatorios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
