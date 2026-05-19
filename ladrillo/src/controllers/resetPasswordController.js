exports.resetPassword = async (req, res) => {

  try {

    const { token, newPassword } = req.body;

    const user = await prisma.usuario.findFirst({
      where: {
        reset_token: token,
        reset_token_exp: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        error: "Token inválido o expirado"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.usuario.update({
      where: {
        id_usuario: user.id_usuario
      },
      data: {
        password: hashedPassword,
        reset_token: null,
        reset_token_exp: null
      }
    });

    res.json({
      message: "Contraseña actualizada"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Error al cambiar contraseña"
    });
  }
};