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
