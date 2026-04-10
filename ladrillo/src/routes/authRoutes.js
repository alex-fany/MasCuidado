const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registro tradicional
router.post('/register', authController.register);

// Login tradicional
router.post('/login', authController.login);

// Login con Google
router.post('/google', authController.googleLogin);

module.exports = router;
