const { google } = require('googleapis');
const prisma = require('../config/prisma');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Obtener cliente de calendario autenticado para un usuario (luego vemos qué onda)
const getCalendarClient = async (userId) => {
  const user = await prisma.Usuario.findUnique({
    where: { id: userId },
    select: { googleRefreshToken: true }
  });

  if (!user || !user.googleRefreshToken) {
    throw new Error('No vinculado');
  }

  oauth2Client.setCredentials({
    refresh_token: user.googleRefreshToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
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
    console.error('Error Google Calendar (Create):', error);
    return null;
  }
};

// Actualizar evento
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
        description: reminder.descripcion,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      },
    });
  } catch (error) {
    console.error('Error Google Calendar (Update):', error);
  }
};

// Eliminar evento
exports.deleteEvent = async (userId, googleEventId) => {
  try {
    const calendar = await getCalendarClient(userId);
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId,
    });
  } catch (error) {
    console.error('Error Google Calendar (Delete):', error);
  }
};

exports.getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar']
  });
};

exports.getTokens = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};
