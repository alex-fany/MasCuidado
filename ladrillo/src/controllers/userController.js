const prisma = require('../config/prisma');
const { sessionUserId, sendPetError } = require('../services/petAccess');

// Campos requeridos por perfil, encabezado y logros. Los secretos quedan fuera
// de la consulta y las mascotas solo aportan los datos usados por el modal.
const publicProfileSelect = {
  id: true, nombreCompleto: true, correo: true, telefono: true, fechaRegistro: true,
  imagen: true, colorAvatar: true, googleId: true, estado: true,
  mascotas: { select: { id: true, nombre: true } }
};

function publicProfile(user) {
  const profile = Object.fromEntries(Object.keys(publicProfileSelect).filter(key => key !== 'mascotas').map(key => [key, user[key]]));
  // La interfaz solo comprueba si existe el vínculo; no necesita el ID de Google.
  profile.googleId = Boolean(user.googleId);
  profile.mascotas = (user.mascotas || []).map(pet => ({ id: pet.id, nombre: pet.nombre }));
  return profile;
}

exports.getMyProfile = async (req, res) => {
  try {
    const userId = sessionUserId(req);
   
    const user = await prisma.Usuario.findUnique({
      where: { id: userId },
      select: publicProfileSelect
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(publicProfile(user));
  } catch (error) {
    return sendPetError(res, error, 'Error al obtener el perfil');
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const userId = sessionUserId(req);
    const { nombre_completo, telefono, imagen, colorAvatar } = req.body;

    const currentUser = await prisma.Usuario.findUnique({
      where: { id: userId }, select: { id: true, googleId: true }
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
      select: publicProfileSelect
    });

    res.json(publicProfile(updatedUser));

  } catch (error) {
    return sendPetError(res, error, 'Error al actualizar el perfil');
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = sessionUserId(req);
    await prisma.Usuario.update({
      where: { id: userId },
      data: { estado: 'Inactivo' }
    });
    res.json({ message: "Cuenta desactivada con éxito" });
  } catch (error) {
    return sendPetError(res, error, 'Error al desactivar la cuenta');
  }
};
