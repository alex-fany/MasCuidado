const { google } = require('googleapis');
const prisma = require('../config/prisma');

// Función creadora para evitar usar un cliente global compartido (evita colisión de credenciales concurrentes)
const createOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

// Obtener cliente de calendario autenticado para un usuario específico
const getCalendarClient = async (userId) => {
  const user = await prisma.Usuario.findUnique({
    where: { id: userId },
    select: { googleRefreshToken: true }
  });

  if (!user || !user.googleRefreshToken) {
    throw new Error('No vinculado');
  }

  const client = createOAuthClient();
  client.setCredentials({
    refresh_token: user.googleRefreshToken
  });

  return google.calendar({ version: 'v3', auth: client });
};

// Crear evento en Google Calendar
exports.createEvent = async (userId, reminder) => {
  try {
    const calendar = await getCalendarClient(userId);
    const start = new Date(reminder.fechaHora);
    const end = new Date(start.getTime() + 30 * 60000); // 30 min duración estimada

    const event = {
      summary: `🐾 ${reminder.titulo}`,
      description: reminder.descripcion || 'Recordatorio de +Cuidado',
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 30 }]
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return response.data.id;
  } catch (error) {
    if (error.message === 'No vinculado') return null;
    console.error('Error Google Calendar (Create):', error.message || error);
    return null;
  }
};

// Actualizar evento en Google Calendar
exports.updateEvent = async (userId, googleEventId, reminder) => {
  try {
    const calendar = await getCalendarClient(userId);
    const start = new Date(reminder.fechaHora);
    const end = new Date(start.getTime() + 30 * 60000);

    await calendar.events.update({
      calendarId: 'primary',
      eventId: googleEventId,
      resource: {
        summary: `🐾 ${reminder.titulo}`,
        description: reminder.descripcion || 'Recordatorio de +Cuidado',
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      },
    });
    return true;
  } catch (error) {
    if (error.message === 'No vinculado') return false;
    // Si el evento fue eliminado manualmente por el usuario en Google Calendar (404/410)
    if (error.code === 404 || error.code === 410) {
      console.warn(`Evento ${googleEventId} no encontrado en Google Calendar; probablemente fue eliminado manualmente.`);
      return false;
    }
    console.error('Error Google Calendar (Update):', error.message || error);
    return false;
  }
};

// Eliminar evento en Google Calendar
exports.deleteEvent = async (userId, googleEventId) => {
  try {
    const calendar = await getCalendarClient(userId);
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId,
    });
    return true;
  } catch (error) {
    if (error.message === 'No vinculado') return false;
    if (error.code === 404 || error.code === 410) {
      // Ya no existía en Google Calendar
      return true;
    }
    console.error('Error Google Calendar (Delete):', error.message || error);
    return false;
  }
};

// Generar URL de autorización con parámetro `state` seguro para vincular al usuario automáticamente
exports.getAuthUrl = (userId) => {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar'],
    state: userId || ''
  });
};

// Intercambiar código por tokens
exports.getTokens = async (code) => {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
};
