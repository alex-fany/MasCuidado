const prisma = require('../config/prisma');

// Crear mascota
exports.createMascota = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nombre, tipo, raza, edad, peso, genero, color, senasParticulares } = req.body;

    // Si hay un archivo subido por multer, guardamos su nombre
    const imagen = req.file ? req.file.filename : null;

    const mascota = await prisma.Mascota.create({
      data: {
        nombre,
        tipo,
        raza,
        edad: edad ? parseInt(edad) : null,
        peso: peso ? parseFloat(peso) : null,
        genero,
        color,
        senasParticulares,
        imagen, // Guardamos la referencia de la imagen
        usuarioId: userId
      }
    });

    res.status(201).json(mascota);
  } catch (error) {
    console.error("Error en createMascota:", error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener todas las mascotas del usuario
exports.getMascotas = async (req, res) => {
  try {
    const userId = req.user.id;
    const mascotas = await prisma.Mascota.findMany({
      where: { usuarioId: userId },
      include: {
        especie: true,
        mascotaVirtual: true,
        clinicasFavoritas: true
      },
      orderBy: { creadoEn: 'desc' }
    });
    res.json(mascotas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener una mascota por ID
exports.getMascotaById = async (req, res) => {
  try {
    const { id } = req.params;
    const mascota = await prisma.Mascota.findUnique({
      where: { id },
      include: {
        historialMedico: true,
        vacunas: true,
        recordatorios: true,
        clinicasFavoritas: true,
        especie: true
      }
    });

    if (!mascota) {
      return res.status(404).json({ error: "Mascota no encontrada" });
    }

    res.json(mascota);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar mascota
exports.updateMascota = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, tipo, raza, edad, peso, genero, color, senasParticulares } = req.body;

    const data = {
      nombre,
      tipo,
      raza,
      edad: edad ? parseInt(edad) : undefined,
      peso: peso ? parseFloat(peso) : undefined,
      genero,
      color,
      senasParticulares
    };

    if (req.file) {
      data.imagen = req.file.filename;
    }

    const mascota = await prisma.Mascota.update({
      where: { id },
      data
    });

    res.json(mascota);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar mascota
exports.deleteMascota = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.Mascota.delete({
      where: { id }
    });
    res.json({ message: "Mascota eliminada con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
// Guardar clínica favorita
exports.saveFavoriteClinic = async (req, res) => {
  try {
    const { id: mascotaId } = req.params;
    const userId = req.user.id;
    const { placeId, nombre, direccion, applyToAll } = req.body;

    if (applyToAll) {
      // Obtener todas las mascotas del usuario
      const mascotas = await prisma.Mascota.findMany({
        where: { usuarioId: userId }
      });

      // Guardar para cada una (eliminando anteriores)
      const operations = mascotas.map(pet => [
        prisma.ClinicaFavorita.deleteMany({ where: { mascotaId: pet.id } }),
        prisma.ClinicaFavorita.create({
          data: { mascotaId: pet.id, placeId, nombre, direccion }
        })
      ]).flat();

      await prisma.$transaction(operations);
      return res.json({ message: "Clínica guardada para todas tus mascotas" });
    }

    // Solo para una mascota
    await prisma.ClinicaFavorita.deleteMany({
      where: { mascotaId }
    });

    const favorita = await prisma.ClinicaFavorita.create({
      data: {
        mascotaId,
        placeId,
        nombre,
        direccion
      }
    });

    res.status(201).json(favorita);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
