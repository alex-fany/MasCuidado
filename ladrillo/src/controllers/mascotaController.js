const prisma = require('../config/prisma');
const { uploadToCloudinary } = require('../config/cloudinary');
const { PetAccessError, sessionUserId, requireOwnedPets, sendPetError } = require('../services/petAccess');

// Crear mascota
exports.createMascota = async (req, res) => {
  try {
    const userId = sessionUserId(req);
    const { nombre, tipo, raza, edad, peso, genero, color, senasParticulares, padecimientos, medicamentos } = req.body;

    // Si hay un archivo subido, lo subimos a Cloudinary
    let imagen = null;
    if (req.file) {
      imagen = await uploadToCloudinary(req.file.buffer, 'mascotas');
    }

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
        imagen,
        usuarioId: userId
      }
    });

    res.status(201).json(mascota);
  } catch (error) {
    return sendPetError(res, error, 'Error al crear la mascota');
  }
};

// Obtener todas las mascotas del usuario
exports.getMascotas = async (req, res) => {
  try {
    const userId = sessionUserId(req);
    const mascotas = await prisma.Mascota.findMany({
      where: { usuarioId: userId },
      include: {
        especie: true,
        clinicasFavoritas: true,
        vacunas: true,
        nutricionConfig: true,
        inventariosAlimento: {
            where: { estado: 'Activo' },
            include: { compartidoCon: { where: { mascota: { usuarioId: userId } } } }
        }
      },
      orderBy: { creadoEn: 'desc' }
    });
    res.json(mascotas);
  } catch (error) {
    return sendPetError(res, error, 'Error al obtener mascotas');
  }
};

// Obtener una mascota por ID
exports.getMascotaById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = sessionUserId(req);
    await requireOwnedPets(prisma, userId, [id]);
    const mascota = await prisma.Mascota.findUnique({
      where: { id, usuarioId: userId },
      include: {
        historialMedico: true,
        vacunas: true,
        recordatorios: { where: { usuarioId: userId } },
        clinicasFavoritas: true,
        especie: true
      }
    });

    if (!mascota) {
      throw new PetAccessError(404, 'Mascota o recurso no disponible');
    }

    res.json(mascota);
  } catch (error) {
    return sendPetError(res, error, 'Error al obtener la mascota');
  }
};

// Actualizar mascota
exports.updateMascota = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = sessionUserId(req);
    // La autorización precede a las subidas y a cualquier modificación de la cartilla.
    await requireOwnedPets(prisma, userId, [id]);
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
      if (req.files.imagen && req.files.imagen[0]) {
        data.imagen = await uploadToCloudinary(req.files.imagen[0].buffer, 'mascotas');
      }
      if (req.files.fotosCartilla && req.files.fotosCartilla.length > 0) {
        // Obtener fotos actuales para no perderlas o reemplazarlas
        const currentPet = await prisma.Mascota.findUnique({ where: { id, usuarioId: userId } });
        if (!currentPet) throw new PetAccessError(404, 'Mascota o recurso no disponible');
        const existingPhotos = Array.isArray(currentPet?.fotosCartilla) ? currentPet.fotosCartilla : [];
        const newPhotos = await Promise.all(
          req.files.fotosCartilla.map(f => uploadToCloudinary(f.buffer, 'cartillas'))
        );
        data.fotosCartilla = [...existingPhotos, ...newPhotos];
      }
    }

    // Actualizar Mascota
    const mascota = await prisma.Mascota.update({
      where: { id, usuarioId: userId },
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
        prisma.Vacuna.deleteMany({ where: { mascotaId: id, mascota: { usuarioId: userId } } })
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
      where: { id, usuarioId: userId },
      include: { vacunas: true, clinicasFavoritas: true }
    });

    res.json(updatedMascota);
  } catch (error) {
    return sendPetError(res, error, 'Error al actualizar la mascota');
  }
};

// Eliminar mascota
exports.deleteMascota = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = sessionUserId(req);
    // La eliminación en cascada tampoco debe alcanzar vínculos de otra cuenta.
    await requireOwnedPets(prisma, userId, [id], { foodGroups: true });
    await prisma.Mascota.delete({
      where: { id, usuarioId: userId }
    });
    res.json({ message: "Mascota eliminada con éxito" });
  } catch (error) {
    return sendPetError(res, error, 'Error al eliminar la mascota');
  }
};
// Guardar clínica favorita
exports.saveFavoriteClinic = async (req, res) => {
  try {
    const { id: mascotaId } = req.params;
    const userId = sessionUserId(req);
    await requireOwnedPets(prisma, userId, [mascotaId]);
    const { placeId, nombre, direccion, applyToAll } = req.body;

    if (applyToAll) {
      // Obtener todas las mascotas del usuario
      const mascotas = await prisma.Mascota.findMany({
        where: { usuarioId: userId }
      });

      // Guardar para cada una (eliminando anteriores)
      const operations = mascotas.map(pet => [
        prisma.ClinicaFavorita.deleteMany({ where: { mascotaId: pet.id, mascota: { usuarioId: userId } } }),
        prisma.ClinicaFavorita.create({
          data: { mascotaId: pet.id, placeId, nombre, direccion }
        })
      ]).flat();

      await prisma.$transaction(operations);
      return res.json({ message: "Clínica guardada para todas tus mascotas" });
    }

    // Solo para una mascota
    await prisma.ClinicaFavorita.deleteMany({
      where: { mascotaId, mascota: { usuarioId: userId } }
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
    return sendPetError(res, error, 'Error al guardar la clínica favorita');
  }
};


// Operaciones de respaldo: contrato v2, compatibilidad v1 e imágenes independientes.
const { createPetBackupService } = require('../services/petBackupService');
const { createPetBackupHandlers } = require('./petBackupController');
const { createBackupImageService } = require('../services/backupImageService');
const { cloudinary } = require('../config/cloudinary');
Object.assign(exports, createPetBackupHandlers(createPetBackupService(prisma, {
  images: createBackupImageService({ cloudinary })
})));
