const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const googleCalendarService = require('../services/googleCalendarService');
const prisma = require('../config/prisma');

// Iniciar autorización
router.get('/auth', verifyToken, (req, res) => {
  const url = googleCalendarService.getAuthUrl();
  res.json({ url });
});

// Callback de Google (donde Google nos manda el código, o al menos eso debería hacer)
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) return res.send('Error en la autorización de Google');

  try {
    const tokens = await googleCalendarService.getTokens(code);
    
    // Para vincular estos tokens al usuario correcto necesitamos pasarle los tokens de vuelta al frontend para que él
    // los mande al endpoint de 'save-token' con su JWT, pero ps sabe qué onda por ahora.
    
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ 
              type: 'GOOGLE_AUTH_SUCCESS', 
              refresh_token: '${tokens.refresh_token}' 
            }, '*');
            window.close();
          </script>
          Autorización exitosa. Cerrando ventana...
        </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error obteniendo permisos de Google');
  }
});

// Guardar el refresh token en la base de datos
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
    res.status(500).json({ error: 'Error al vincular cuenta' });
  }
});

module.exports = router;
