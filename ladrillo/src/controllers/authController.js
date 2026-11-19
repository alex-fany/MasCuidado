const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const { sendVerificationEmail, sendResetEmail } = require('../services/mailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta_super_segura';

const getFrontendBaseUrl = () => {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
};

// Registro tradicional
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: "El nombre es obligatorio", field: "name" });
    }

    if (name.trim().length > 30) {
      return res.status(400).json({ error: "El nombre no puede exceder los 30 caracteres", field: "name" });
    }

    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: "El correo es obligatorio", field: "email" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: "Ingresa un formato de correo válido", field: "email" });
    }

    if (typeof password !== 'string' || !password) {
      return res.status(400).json({ error: "La contraseña es obligatoria", field: "password" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres", field: "password" });
    }

    const userExist = await prisma.Usuario.findUnique({ where: { correo: email.trim().toLowerCase() } });
    if (userExist) {
      return res.status(400).json({ error: "Este correo ya está registrado", field: "email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    const user = await prisma.Usuario.create({
      data: {
        nombreCompleto: name.trim(),
        correo: email.trim().toLowerCase(),
        password: hashedPassword,
        emailVerificado: false,
        verification_token: verificationToken,
        verification_token_exp: verificationExp
      }
    });

    const verificationLink = `${getFrontendBaseUrl()}/verify-email/${verificationToken}`;

    // Enviar correo de verificación
    try {
      await sendVerificationEmail(email, verificationLink, name);
    } catch (mailError) {
      console.error("Error al enviar email de verificación:", mailError);
    }

    res.status(201).json({
      message: "Registro exitoso. Te hemos enviado un correo de verificación.",
      userId: user.id,
      email: user.correo,
      requiresVerification: true
    });
  } catch (error) {
    console.error("Error en register:", error);
    res.status(500).json({ error: "Error en el servidor al registrar" });
  }
};

// Login tradicional
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: "Ingresa tu correo electrónico", field: "email" });
    }

    if (typeof password !== 'string' || !password) {
      return res.status(400).json({ error: "Ingresa tu contraseña", field: "password" });
    }

    const user = await prisma.Usuario.findUnique({ where: { correo: email.trim().toLowerCase() } });
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas", field: "email" });
    }

    if (!user.password) {
      return res.status(401).json({ error: "Credenciales inválidas", field: "password" });
    }

    if (user.estado === 'Inactivo') {
      return res.status(403).json({ error: "Esta cuenta se encuentra desactivada", field: "general" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales inválidas", field: "password" });
    }

    // Verificar si el correo ya fue validado
    if (user.emailVerificado === false) {
      return res.status(403).json({
        error: "Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada o solicita un nuevo enlace.",
        emailNotVerified: true,
        email: user.correo,
        field: "email"
      });
    }
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: "Login exitoso",
      token,
      user: { 
        id: user.id, 
        nombre: user.nombreCompleto, 
        correo: user.correo,
        isGoogleLinked: !!user.googleRefreshToken
      }
    });
  } catch (error) {
    console.error("DETALLE ERROR LOGIN:", JSON.stringify(error, null, 2));
    console.error("MENSAJE ERROR LOGIN:", error.message);
    res.status(500).json({ error: "Error en el servidor al iniciar sesión", detail: error.message });
  }
};

// Login con Google
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const { sub: googleId, email, name } = ticket.getPayload();

    let user = await prisma.Usuario.findFirst({
      where: {
        OR: [
          { googleId: googleId },
          { correo: email }
        ]
      }
    });

    if (!user) {
      user = await prisma.Usuario.create({
        data: {
          nombreCompleto: name,
          correo: email,
          googleId: googleId,
          emailVerificado: true // Google ya valida el email
        }
      });
    } else {
      const updateData = {};
      if (!user.googleId) updateData.googleId = googleId;
      if (!user.emailVerificado) updateData.emailVerificado = true; // Si entra con Google se confirma
      if (Object.keys(updateData).length > 0) {
        user = await prisma.Usuario.update({
          where: { id: user.id },
          data: updateData
        });
      }
    }

    if (user.estado === 'Inactivo') {
      return res.status(403).json({ error: "Esta cuenta se encuentra desactivada" });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: "Login con Google exitoso",
      token,
      user: { 
        id: user.id, 
        nombre: user.nombreCompleto, 
        correo: user.correo,
        isGoogleLinked: !!user.googleRefreshToken
      }
    });
  } catch (error) {
    console.error("Error Google Auth:", error);
    res.status(401).json({ error: "Autenticación de Google fallida" });
  }
};

// Verificar correo mediante token
exports.verifyEmail = async (req, res) => {
  try {
    const token = req.body.token || req.query.token;

    if (!token) {
      return res.status(400).json({ error: "Token de verificación no proporcionado." });
    }

    const user = await prisma.Usuario.findFirst({
      where: {
        verification_token: token
      }
    });

    if (!user) {
      return res.status(400).json({ error: "El enlace de verificación no es válido o ya fue utilizado." });
    }

    if (!user.verification_token_exp || user.verification_token_exp < new Date()) {
      return res.status(400).json({
        error: "El enlace de verificación ha expirado.",
        isExpired: true,
        email: user.correo
      });
    }

    await prisma.Usuario.update({
      where: { id: user.id },
      data: {
        emailVerificado: true,
        verification_token: null,
        verification_token_exp: null
      }
    });

    res.json({
      message: "¡Correo electrónico verificado con éxito! Ahora puedes iniciar sesión.",
      email: user.correo
    });
  } catch (error) {
    console.error("Error en verifyEmail:", error);
    res.status(500).json({ error: "Error en el servidor al verificar el correo." });
  }
};

// Reenviar correo de verificación
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "El correo es obligatorio." });
    }

    const user = await prisma.Usuario.findUnique({
      where: { correo: email }
    });

    if (!user) {
      return res.json({
        message: "Si la cuenta existe y no está verificada, hemos enviado un nuevo correo de verificación."
      });
    }

    if (user.emailVerificado) {
      return res.status(400).json({ error: "Este correo ya se encuentra verificado. Puedes iniciar sesión." });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await prisma.Usuario.update({
      where: { id: user.id },
      data: {
        verification_token: verificationToken,
        verification_token_exp: verificationExp
      }
    });

    const verificationLink = `${getFrontendBaseUrl()}/verify-email/${verificationToken}`;

    await sendVerificationEmail(email, verificationLink, user.nombreCompleto);

    res.json({
      message: "Se ha enviado un nuevo enlace de verificación a tu correo."
    });
  } catch (error) {
    console.error("Error en resendVerification:", error);
    res.status(500).json({ error: "Error al reenviar el correo de verificación." });
  }
};

// Solicitar recuperación de contraseña
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "El correo es obligatorio" });
    }

    const user = await prisma.Usuario.findUnique({
      where: { correo: email }
    });

    // No revelar si existe o no por seguridad
    if (!user) {
      return res.json({
        message: "Si el correo existe, se enviaron instrucciones."
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await prisma.Usuario.update({
      where: { id: user.id },
      data: {
        reset_token: resetToken,
        reset_token_exp: expires
      }
    });

    const resetLink = `${getFrontendBaseUrl()}/reset-password/${resetToken}`;

    await sendResetEmail(email, resetLink, user.nombreCompleto);

    res.json({
      message: "Si el correo existe, se enviaron instrucciones."
    });
  } catch (error) {
    console.error("ERROR forgotPassword:", error);
    res.status(500).json({ error: "Error al enviar correo de recuperación." });
  }
};

// Restablecer contraseña
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const user = await prisma.Usuario.findFirst({
      where: {
        reset_token: token
      }
    });

    if (!user) {
      return res.status(400).json({ error: "Token inválido" });
    }

    if (!user.reset_token_exp || user.reset_token_exp < new Date()) {
      return res.status(400).json({ error: "Token expirado" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.Usuario.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        reset_token: null,
        reset_token_exp: null
      }
    });

    res.json({
      message: "Contraseña actualizada correctamente"
    });
  } catch (error) {
    console.error("ERROR resetPassword:", error);
    res.status(500).json({ error: "Error al actualizar contraseña" });
  }
};
