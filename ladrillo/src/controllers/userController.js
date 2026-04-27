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
    const { nombre_completo, telefono, direccion } = req.body;

    const currentUser = await prisma.Usuario.findUnique({
      where: { id: userId }
    });

    if (!currentUser) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const dataToUpdate = {
      telefono,
      direccion
    };

    if (!currentUser.googleId) {
      dataToUpdate.nombreCompleto = nombre_completo;
    }

    const updatedUser = await prisma.Usuario.update({
      where: { id: userId },
      data: dataToUpdate
    });

    res.json(updatedUser);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
