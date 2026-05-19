const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registro tradicional
router.post('/register', authController.register);

// Login tradicional
router.post('/login', authController.login);

// Login con Google
router.post('/google', authController.googleLogin);
//Password
router.post('/forgot-password', authController.forgotPassword);

router.post('/reset-password', authController.resetPassword);
module.exports = router;
