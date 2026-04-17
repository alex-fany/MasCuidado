const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
   
    const user = await prisma.usuario.findUnique({
      where: { id_usuario: userId },
      include: {
        mascota: true,
        clinica_favorita: true
      }
    });


    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nombre_completo, telefono, direccion } = req.body;

    const currentUser = await prisma.usuario.findUnique({
      where: { id_usuario: userId }
    });

    const dataToUpdate = {
      telefono,
      direccion
    };

    // Solo permitir editar nombre si NO es Google
    if (!currentUser.google_id) {
      dataToUpdate.nombre_completo = nombre_completo;
    }

    const updatedUser = await prisma.usuario.update({
      where: { id_usuario: userId },
      data: dataToUpdate
    });

    res.json(updatedUser);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};