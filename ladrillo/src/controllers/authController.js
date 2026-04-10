const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta_super_segura';

// Registro tradicional
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const userExist = await prisma.usuario.findUnique({ where: { correo: email } });
    if (userExist) {
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.usuario.create({
      data: {
        nombre_completo: name,
        correo: email,
        password: hashedPassword
      }
    });

    res.status(201).json({ message: "Usuario creado con éxito", userId: user.id_usuario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor al registrar" });
  }
};

// Login tradicional
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.usuario.findUnique({ where: { correo: email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign({ id: user.id_usuario }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: "Login exitoso",
      token,
      user: { id: user.id_usuario, nombre: user.nombre_completo, correo: user.correo }
    });
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor al iniciar sesión" });
  }
};

// Login con Google
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    // Verificar token con Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const { sub: googleId, email, name } = ticket.getPayload();

    // Buscar o crear usuario
    let user = await prisma.usuario.findFirst({
      where: {
        OR: [
          { google_id: googleId },
          { correo: email }
        ]
      }
    });

    if (!user) {
      user = await prisma.usuario.create({
        data: {
          nombre_completo: name,
          correo: email,
          google_id: googleId
        }
      });
    } else if (!user.google_id) {
      // Si el usuario ya existía por email pero no tenía google_id, lo vinculamos
      user = await prisma.usuario.update({
        where: { id_usuario: user.id_usuario },
        data: { google_id: googleId }
      });
    }

    const token = jwt.sign({ id: user.id_usuario }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: "Login con Google exitoso",
      token,
      user: { id: user.id_usuario, nombre: user.nombre_completo, correo: user.correo }
    });
  } catch (error) {
    console.error("Error Google Auth:", error);
    res.status(401).json({ error: "Autenticación de Google fallida" });
  }
};
