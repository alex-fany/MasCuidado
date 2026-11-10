const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const googleCalendarService = require('../services/googleCalendarService');
const prisma = require('../config/prisma');

// Iniciar autorización (asocia el userId en el parámetro state)
router.get('/auth', verifyToken, (req, res) => {
  const url = googleCalendarService.getAuthUrl(req.user.id);
  res.json({ url });
});

// Callback de Google OAuth
router.get('/callback', async (req, res) => {
  const { code, error, state } = req.query;

  if (error) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>+Cuidado - Autorización Cancelada</title>
          <meta charset="utf-8" />
        </head>
        <body style="font-family:sans-serif; text-align:center; padding:50px; background:#fff5f5;">
          <h2 style="color:#e53e3e;">Autorización cancelada</h2>
          <p style="color:#666;">No se concedieron los permisos de Google Calendar.</p>
          <p style="color:#999; font-size:12px;">Esta ventana se cerrará automáticamente...</p>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: '${error}' }, '*');
              }
            } catch (e) {}
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `);
  }

  try {
    const tokens = await googleCalendarService.getTokens(code);
    
    // Si tenemos el state (userId) y Google entregó el refresh_token, lo guardamos directamente en PostgreSQL
    if (state && tokens.refresh_token) {
      await prisma.Usuario.update({
        where: { id: state },
        data: { googleRefreshToken: tokens.refresh_token }
      });
    }

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>+Cuidado - Cuenta Vinculada</title>
          <meta charset="utf-8" />
        </head>
        <body style="font-family:sans-serif; text-align:center; padding:50px; background:#f0fdfa;">
          <h2 style="color:#2d9b96; font-size:24px;">🐾 ¡Cuenta vinculada con éxito!</h2>
          <p style="color:#4a5568; font-size:15px;">Tu Google Calendar ahora está conectado con +Cuidado.</p>
          <p style="color:#a0aec0; font-size:12px;">Cerrando esta ventana...</p>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'GOOGLE_AUTH_SUCCESS', 
                  refresh_token: '${tokens.refresh_token || ""}' 
                }, '*');
              }
            } catch (e) {}
            setTimeout(() => window.close(), 1500);
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("Error en Google Calendar callback:", err);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>+Cuidado - Error</title>
          <meta charset="utf-8" />
        </head>
        <body style="font-family:sans-serif; text-align:center; padding:50px; background:#fff5f5;">
          <h2 style="color:#e53e3e;">Error al vincular cuenta</h2>
          <p style="color:#666;">Ocurrió un error al canjear los permisos con Google. Por favor, intenta de nuevo.</p>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR' }, '*');
              }
            } catch (e) {}
          </script>
        </body>
      </html>
    `);
  }
});

// Guardar el refresh token en la base de datos (mantenido por compatibilidad)
router.post('/save-token', verifyToken, async (req, res) => {
  const { refresh_token } = req.body;
  const userId = req.user.id;

  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token requerido' });
  }

  try {
    await prisma.Usuario.update({
      where: { id: userId },
      data: { googleRefreshToken: refresh_token }
    });
    res.json({ message: 'Cuenta vinculada con Google Calendar' });
  } catch (err) {
    console.error("Error al guardar token:", err);
    res.status(500).json({ error: 'Error al vincular cuenta' });
  }
});

// Consultar estado de vinculación
router.get('/status', verifyToken, async (req, res) => {
  try {
    const user = await prisma.Usuario.findUnique({
      where: { id: req.user.id },
      select: { googleRefreshToken: true }
    });
    res.json({ isGoogleLinked: !!(user && user.googleRefreshToken) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
