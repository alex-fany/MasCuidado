const prisma = require('../config/prisma');
const googleCalendarService = require('../services/googleCalendarService');

// Crear recordatorio
exports.createRecordatorio = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mascotaId, titulo, descripcion, fechaHora, syncGoogle } = req.body;

    // Guardar localmente primero
    let recordatorio = await prisma.Recordatorio.create({
      data: {
        titulo,
        descripcion,
        fechaHora: new Date(fechaHora),
        mascotaId,
        usuarioId: userId
      }
    });

    // Sincronizar con Google si se solicitó (nomás que todavía no sirve por culpa del mugre Google)
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

// Actualizar con sincronización
exports.updateRecordatorio = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { titulo, descripcion, fechaHora } = req.body;

    const recordatorio = await prisma.Recordatorio.findUnique({
      where: { id: parseInt(id), usuarioId: userId }
    });

    if (!recordatorio) return res.status(404).json({ error: "No encontrado" });

    // Actualizar localmente
    await prisma.Recordatorio.update({
      where: { id: parseInt(id) },
      data: {
        titulo,
        descripcion,
        fechaHora: new Date(fechaHora)
      }
    });

    // Sincronizar con Google si ya estaba vinculado
    if (recordatorio.idEventoGoogle) {
      await googleCalendarService.updateEvent(userId, recordatorio.idEventoGoogle, {
        titulo, descripcion, fechaHora
      });
    }

    res.json({ message: "Recordatorio actualizado" });
  } catch (error) {
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

    // Eliminar de Google
    if (recordatorio.idEventoGoogle) {
      await googleCalendarService.deleteEvent(userId, recordatorio.idEventoGoogle);
    }

    // Eliminar local
    await prisma.Recordatorio.delete({ where: { id: parseInt(id) } });

    res.json({ message: "Eliminado con éxito" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos
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
