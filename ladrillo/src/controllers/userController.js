const prisma = require('../config/prisma');

exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Este id viene del token (UUID)
   
    const user = await prisma.Usuario.findUnique({
      where: { id: userId },
      include: {
        mascotas: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nombre_completo, telefono, imagen, colorAvatar } = req.body;

    const currentUser = await prisma.Usuario.findUnique({
      where: { id: userId }
    });

    if (!currentUser) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const dataToUpdate = {};

    if (telefono !== undefined) {
      const numericPhone = telefono.split(' ')[1] || '';
      if (numericPhone && numericPhone.length < 10) {
        return res.status(400).json({ error: "El teléfono debe tener al menos 10 dígitos" });
      }
      dataToUpdate.telefono = telefono;
    }

    if (imagen !== undefined) {
      dataToUpdate.imagen = imagen;
    }

    if (colorAvatar !== undefined) {
      dataToUpdate.colorAvatar = colorAvatar;
    }

    if (!currentUser.googleId && nombre_completo !== undefined) {
      if (nombre_completo.length > 30) {
        return res.status(400).json({ error: "El nombre no puede exceder los 30 caracteres" });
      }
      dataToUpdate.nombreCompleto = nombre_completo;
    }

    const updatedUser = await prisma.Usuario.update({
      where: { id: userId },
      data: dataToUpdate,
      include: {
        mascotas: true
      }
    });

    res.json(updatedUser);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    await prisma.Usuario.update({
      where: { id: userId },
      data: { estado: 'Inactivo' }
    });
    res.json({ message: "Cuenta desactivada con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
