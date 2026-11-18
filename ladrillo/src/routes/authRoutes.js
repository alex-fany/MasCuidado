const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registro y Login tradicional
router.post('/register', authController.register);
router.post('/login', authController.login);

// Login con Google
router.post('/google', authController.googleLogin);

// Verificación de Correo
router.post('/verify-email', authController.verifyEmail);
router.get('/verify-email/:token', (req, res) => {
  req.body.token = req.params.token;
  return authController.verifyEmail(req, res);
});
router.post('/resend-verification', authController.resendVerification);

// Recuperar y Resetear contraseña
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
