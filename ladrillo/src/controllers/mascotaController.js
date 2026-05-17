const prisma = require('../config/prisma');

// Crear mascota
exports.createMascota = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nombre, tipo, raza, edad, peso, genero, color, senasParticulares, padecimientos, medicamentos } = req.body;

    // Si hay un archivo subido, guardamos su nombre
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
        padecimientos,
        medicamentos,
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
        clinicasFavoritas: true,
        vacunas: true
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
    const { nombre, tipo, raza, edad, peso, genero, color, senasParticulares, padecimientos, medicamentos, vacunas } = req.body;

    const data = {
      nombre,
      tipo,
      raza,
      edad: edad !== undefined ? (edad === "" ? null : parseInt(edad)) : undefined,
      peso: peso !== undefined ? (peso === "" ? null : parseFloat(peso)) : undefined,
      genero,
      color,
      senasParticulares,
      padecimientos,
      medicamentos
    };

    // Manejar archivos (imagen principal y fotos de cartilla)
    if (req.files) {
      if (req.files.imagen) {
        data.imagen = req.files.imagen[0].filename;
      }
      if (req.files.fotosCartilla) {
        // Obtener fotos actuales para no perderlas o reemplazarlas
        const currentPet = await prisma.Mascota.findUnique({ where: { id } });
        const existingPhotos = Array.isArray(currentPet.fotosCartilla) ? currentPet.fotosCartilla : [];
        const newPhotos = req.files.fotosCartilla.map(f => f.filename);
        data.fotosCartilla = [...existingPhotos, ...newPhotos];
      }
    }

    // Actualizar Mascota
    const mascota = await prisma.Mascota.update({
      where: { id },
      data,
      include: { vacunas: true }
    });

    // Manejar Vacunas de forma atómica con transacciones
    if (vacunas) {
      const parsedVacunas = JSON.parse(vacunas);
      
      // Filtrar duplicados en la misma fecha para la misma vacuna
      const uniqueVacunasMap = new Map();
      parsedVacunas.forEach(v => {
        const dateKey = v.fecha ? v.fecha.split('T')[0] : 'no-date';
        const key = `${v.nombre.toLowerCase().trim()}-${dateKey}`;
        if (!uniqueVacunasMap.has(key)) {
          uniqueVacunasMap.set(key, v);
        }
      });
      
      const uniqueVacunasList = Array.from(uniqueVacunasMap.values());

      // Agrupar por nombre para asignar 'proximaDosis' solo a la más reciente
      const groupsByName = {};
      uniqueVacunasList.forEach(v => {
        const name = v.nombre.toLowerCase().trim();
        if (!groupsByName[name]) groupsByName[name] = [];
        groupsByName[name].push(v);
      });

      const finalVacunasToInsert = [];
      Object.keys(groupsByName).forEach(name => {
        const doses = groupsByName[name];
        // Ordenar por fecha descendente
        doses.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        doses.forEach((dose, idx) => {
          const appliedDate = dose.fecha ? new Date(dose.fecha) : new Date();
          // Solo la primera lleva la fecha de próximo refuerzo
          const nextDate = (idx === 0 && dose.proxima) ? new Date(dose.proxima) : null;

          finalVacunasToInsert.push({
            mascotaId: id,
            nombreVacuna: dose.nombre || 'Vacuna',
            fechaAplicacion: isNaN(appliedDate.getTime()) ? new Date() : appliedDate,
            proximaDosis: nextDate && !isNaN(nextDate.getTime()) ? nextDate : null
          });
        });
      });
      
      const vaccineOperations = [
        prisma.Vacuna.deleteMany({ where: { mascotaId: id } })
      ];

      if (finalVacunasToInsert.length > 0) {
        vaccineOperations.push(
          prisma.Vacuna.createMany({
            data: finalVacunasToInsert
          })
        );
      }
      
      await prisma.$transaction(vaccineOperations);
    }

    const updatedMascota = await prisma.Mascota.findUnique({
      where: { id },
      include: { vacunas: true, clinicasFavoritas: true }
    });

    res.json(updatedMascota);
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
