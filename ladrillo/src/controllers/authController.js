const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta_super_segura';

const crypto = require('crypto');
const { sendResetEmail } = require('../services/mailService');

// Registro tradicional
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    if (name.length > 30) {
      return res.status(400).json({ error: "El nombre no puede exceder los 30 caracteres" });
    }

    const userExist = await prisma.Usuario.findUnique({ where: { correo: email } });
    if (userExist) {
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.Usuario.create({
      data: {
        nombreCompleto: name,
        correo: email,
        password: hashedPassword
      }
    });

    res.status(201).json({ message: "Usuario creado con éxito", userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor al registrar" });
  }
};

// Login tradicional
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.Usuario.findUnique({ where: { correo: email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    if (user.estado === 'Inactivo') {
      return res.status(403).json({ error: "Esta cuenta se encuentra desactivada" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: "Login exitoso",
      token,
      user: { 
        id: user.id, 
        nombre: user.nombreCompleto, 
        correo: user.correo,
        isGoogleLinked: !!user.googleRefreshToken // Verificar vinculación
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
          googleId: googleId
        }
      });
    } else if (!user.googleId) {
      user = await prisma.Usuario.update({
        where: { id: user.id },
        data: { googleId: googleId }
      });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });

    if (user.estado === 'Inactivo') {
      return res.status(403).json({ error: "Esta cuenta se encuentra desactivada" });
    }

    res.json({
      message: "Login con Google exitoso",
      token,
      user: { 
        id: user.id, 
        nombre: user.nombreCompleto, 
        correo: user.correo,
        isGoogleLinked: !!user.googleRefreshToken // Verificar vinculación
      }
    });
  } catch (error) {
    console.error("Error Google Auth:", error);
    res.status(401).json({ error: "Autenticación de Google fallida" });
  }
};

exports.forgotPassword = async (req, res) => {

  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "El correo es obligatorio"
      });
    }

    // Buscar usuario
    const user = await prisma.Usuario.findUnique({
      where: {
        correo: email
      }
    });

    // No revelar si existe o no
    if (!user) {
      return res.json({
        message: "Si el correo existe, se enviaron instrucciones"
      });
    }

    // Crear token seguro
    const resetToken =
      crypto.randomBytes(32).toString("hex");

    // Expiración 15 minutos
    const expires =
      new Date(Date.now() + 15 * 60 * 1000);

    // Guardar token
    await prisma.Usuario.update({
      where: {
        id: user.id
      },
      data: {
        reset_token: resetToken,
        reset_token_exp: expires
      }
    });

    // Link frontend
    const resetLink =
      `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Enviar correo
    await sendResetEmail(
      email,
      resetLink
    );

    res.json({
      message: "Si el correo existe, se enviaron instrucciones"
    });

  } catch (error) {

    console.error("ERROR forgotPassword:");
    console.error(error);

    res.status(500).json({
      error: "Error al enviar correo"
    });

  }

};
exports.resetPassword = async (req, res) => {

  try {

    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: "Datos incompletos"
      });
    }

    // Buscar usuario por token
    const user = await prisma.Usuario.findFirst({
      where: {
        reset_token: token
      }
    });

    // Token inválido
    if (!user) {
      return res.status(400).json({
        error: "Token inválido"
      });
    }

    // Verificar expiración
    if (
      !user.reset_token_exp ||
      user.reset_token_exp < new Date()
    ) {
      return res.status(400).json({
        error: "Token expirado"
      });
    }

    // Hash contraseña
    const hashedPassword =
      await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.Usuario.update({
      where: {
        id: user.id
      },
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

    console.error("ERROR resetPassword:");
    console.error(error);

    res.status(500).json({
      error: "Error al actualizar contraseña"
    });

  }

};