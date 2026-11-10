const { randomUUID } = require('node:crypto');
const { validateBackupFile, BackupValidationError, FORMAT, VERSION, LIMITS } = require('../validators/petBackupValidator');

class PetBackupError extends Error {
  constructor(code, status, message) { super(message); this.name = 'PetBackupError'; this.code = code; this.status = status; }
}
const GENERAL = ['nombre', 'tipo', 'raza', 'edad', 'peso', 'genero', 'sexo', 'color', 'senasParticulares', 'fechaNacimiento', 'medicamentos', 'padecimientos'];
const VACCINE = ['nombreVacuna', 'fechaAplicacion', 'proximaDosis', 'lote'];
const HISTORY = ['tipoEvento', 'fechaEvento', 'descripcion', 'veterinarioClinica', 'pesoKg'];
const REMINDER = ['titulo', 'descripcion', 'fechaHora', 'estado'];
const CONFIG = ['metaAguaDiaria', 'reinicioAguaDias', 'porcionDiaria', 'unidadMedida'];
const INVENTORY = ['marca', 'tipo', 'fechaCompra', 'costo', 'estado', 'cantidadTotal', 'cantidadRestante', 'unidadMedida'];
const CLINIC = ['placeId', 'nombre', 'direccion', 'notasUsuario'];
const pick = (value, keys) => Object.fromEntries(keys.map(key => [key, value[key] ?? null]));
const iso = value => value === null ? null : new Date(value).toISOString();
const day = value => value === null ? null : iso(value).slice(0, 10);
const decimal = value => value === null ? null : String(value);
const dateValue = value => value == null ? null : new Date(value);
const unique = values => [...new Set(values)];
function authenticated(userId) {
  if (typeof userId !== 'string' || !userId.trim()) throw new PetBackupError('UNAUTHORIZED', 401, 'Sesión requerida');
}
function counts(pet) {
  return { vacunas: pet.medicalRecord.vaccines.length, historialMedico: pet.medicalRecord.history.length,
    recordatorios: pet.reminders.length, configuracionNutricional: pet.nutrition.configuration === null ? 0 : 1,
    inventariosAlimento: pet.nutrition.inventories.length, hidratacion: pet.nutrition.hydration.length,
    clinicasFavoritas: pet.favoriteClinics.length };
}

// Adaptación explícita: los valores escalares ausentes del formato antiguo se mantienen en null.
// No se inventan fechas, consumos, eventos clínicos, especies ni sincronizaciones con Google.
function legacyPet(pet) {
  const general = pick(pet, GENERAL);
  general.fechaNacimiento = day(general.fechaNacimiento);
  return { general, species: null, imageRef: null,
    medicalRecord: { vaccines: (pet.vacunas ?? []).map(v => ({ ...pick(v, VACCINE), fechaAplicacion: day(v.fechaAplicacion), proximaDosis: day(v.proximaDosis) })),
      history: (pet.historialMedico ?? []).map(h => ({ ...pick(h, HISTORY), fechaEvento: day(h.fechaEvento), pesoKg: decimal(h.pesoKg) })), photoRefs: [] },
    nutrition: { configuration: pet.nutricionConfig ?? null, inventories: [], hydration: [] },
    reminders: (pet.recordatorios ?? []).map(r => ({ ...pick(r, REMINDER), estado: null })),
    favoriteClinics: pet.clinicasFavoritas ?? [] };
}

// Prisma se recibe como dependencia: importar este módulo no crea clientes ni llama a servicios.
function createPetBackupService(prisma, { now = () => new Date(), newBackupId = randomUUID, images } = {}) {
  async function exportBackup(userId, petId) {
    authenticated(userId);
    if (typeof petId !== 'string' || !petId.trim()) throw new PetBackupError('PET_NOT_FOUND', 404, 'Mascota no encontrada');
    const snapshot = await prisma.$transaction(async tx => {
      const source = await tx.Mascota.findFirst({ where: { id: petId, usuarioId: userId }, include: {
        especie: true, vacunas: { take: LIMITS.records + 1 }, historialMedico: { take: LIMITS.records + 1 },
        recordatorios: { where: { usuarioId: userId }, take: LIMITS.records + 1 }, nutricionConfig: true,
        registrosHidratacion: { take: LIMITS.records + 1 }, clinicasFavoritas: { take: LIMITS.clinics + 1 }
      } });
      if (!source) throw new PetBackupError('PET_NOT_FOUND', 404, 'Mascota no encontrada o no pertenece a este usuario');
      // Una consulta incluye los inventarios propios y los consumidos mediante vínculos compartidos.
      const inventories = await tx.InventarioAlimento.findMany({ where: { OR: [
        { mascotaId: petId }, { compartidoCon: { some: { mascotaId: petId } } }
      ] }, include: { mascota: { select: { usuarioId: true } }, compartidoCon: { select: { mascotaId: true } } },
      orderBy: { fechaCompra: 'asc' }, take: LIMITS.inventories + 1 });
      if (inventories.some(i => i.mascota.usuarioId !== userId)) {
        throw new PetBackupError('INVENTORY_OWNERSHIP_CONFLICT', 409, 'Hay un inventario vinculado de otra cuenta; no se puede exportar');
      }
      const warnings = [];
      const general = pick(source, GENERAL);
      general.fechaNacimiento = day(general.fechaNacimiento);
      const payload = { format: FORMAT, version: VERSION, backupId: newBackupId(), exportedAt: iso(now()),
        pet: { general, species: source.especie ? { nombreEspecie: source.especie.nombreEspecie } : null,
          imageRef: null, medicalRecord: { photoRefs: [],
            vaccines: source.vacunas.map(v => ({ ...pick(v, VACCINE), fechaAplicacion: day(v.fechaAplicacion), proximaDosis: day(v.proximaDosis) })),
            history: source.historialMedico.map(h => ({ ...pick(h, HISTORY), fechaEvento: day(h.fechaEvento), pesoKg: decimal(h.pesoKg) })) },
          reminders: source.recordatorios.map(r => ({ ...pick(r, REMINDER), fechaHora: iso(r.fechaHora) })),
          favoriteClinics: source.clinicasFavoritas.map(c => pick(c, CLINIC)),
          nutrition: { configuration: source.nutricionConfig ? pick(source.nutricionConfig, CONFIG) : null,
            hydration: source.registrosHidratacion.map(r => ({ fechaHora: iso(r.fechaHora), cantidad: r.cantidad })),
            inventories: inventories.map((i, n) => ({ ...pick(i, INVENTORY), ref: `food-${n + 1}`, fechaCompra: iso(i.fechaCompra), costo: decimal(i.costo),
              source: i.mascotaId !== petId || i.compartidoCon.length ? 'shared' : 'owned',
              // La aplicación actual no almacena observaciones del consumo real.
              balance: { basis: 'unknown', observedAt: null } })) } }, assets: [], warnings };
      try {
        const validated = validateBackupFile(JSON.stringify(payload));
        payload.warnings = unique([...warnings, ...validated.warnings]);
      } catch (error) {
        if (error instanceof BackupValidationError) throw new PetBackupError('SOURCE_DATA_INVALID', 422, `Los datos almacenados no cumplen el contrato: ${error.path} (${error.code})`);
        throw error;
      }
      return { payload, image: source.imagen, photos: source.fotosCartilla };
    }, { isolationLevel: 'RepeatableRead', timeout: 15000 });
    // La transacción de base de datos se cierra antes de descargar o decodificar imágenes.
    const { payload, image, photos } = snapshot;
    if (image || (photos != null && (!Array.isArray(photos) || photos.length))) {
      if (!images) throw new PetBackupError('IMAGE_STORAGE_NOT_CONFIGURED', 503, 'No se configuró el servicio de imágenes del respaldo');
      const exported = await images.exportImages(image ?? null, photos);
      payload.assets = exported.assets;
      payload.pet.imageRef = exported.imageRef;
      payload.pet.medicalRecord.photoRefs = exported.photoRefs;
    }
    validateBackupFile(JSON.stringify(payload));
    return payload;
  }

  async function importBackup(userId, file) {
    authenticated(userId);
    const validated = validateBackupFile(file);
    const pet = validated.version === VERSION ? validated.data.pet : legacyPet(validated.data.pet);
    const warnings = [...validated.warnings];
    if (validated.version === VERSION && validated.data.warnings.includes('IMAGES_OMITTED_PHASE_2')) warnings.push('IMAGES_OMITTED_PHASE_2');
    if (validated.version === '1.0' && (validated.data.pet.imagen || validated.data.pet.fotosCartilla?.length)) warnings.push('LEGACY_IMAGES_NOT_IMPORTED');
    if (pet.nutrition.inventories.some(i => i.source === 'shared')) warnings.push('SHARED_INVENTORY_COPIED_WITHOUT_GROUP', 'FOOD_PROJECTION_MAY_DIFFER');
    const assets = validated.version === VERSION ? validated.data.assets : [];
    if (assets.length && !images) throw new PetBackupError('IMAGE_STORAGE_NOT_CONFIGURED', 503, 'No se configuró el servicio de imágenes del respaldo');
    const staged = assets.length ? await images.restoreImages(assets) : { urls: new Map(), compensate: async () => {} };
    let mascota;
    try {
      mascota = await prisma.$transaction(async tx => {
      let speciesId = null;
      if (pet.species) {
        const species = await tx.CatalogoEspecie.findUnique({ where: { nombreEspecie: pet.species.nombreEspecie } });
        if (!species) throw new PetBackupError('SPECIES_NOT_AVAILABLE', 422, 'La especie del respaldo no existe en el catálogo de destino; no se importó la mascota');
        speciesId = species.id;
      }
      const created = await tx.Mascota.create({ data: { ...pick(pet.general, GENERAL), fechaNacimiento: dateValue(pet.general.fechaNacimiento),
        usuarioId: userId, especieId: speciesId, imagen: pet.imageRef === null ? null : staged.urls.get(pet.imageRef),
        fotosCartilla: pet.medicalRecord.photoRefs.map(ref => staged.urls.get(ref)) } });
      const insert = async (model, rows) => {
        // Los lotes evitan superar el límite de parámetros de PostgreSQL con las cantidades admitidas.
        for (let start = 0; start < rows.length; start += 500) await tx[model].createMany({ data: rows.slice(start, start + 500) });
      };
      await insert('Vacuna', pet.medicalRecord.vaccines.map(v => ({ ...pick(v, VACCINE), mascotaId: created.id,
        fechaAplicacion: dateValue(v.fechaAplicacion), proximaDosis: dateValue(v.proximaDosis) })));
      await insert('HistorialMedico', pet.medicalRecord.history.map(h => ({ ...pick(h, HISTORY), mascotaId: created.id, fechaEvento: dateValue(h.fechaEvento) })));
      await insert('Recordatorio', pet.reminders.map(r => ({ ...pick(r, REMINDER), mascotaId: created.id, usuarioId: userId,
        fechaHora: dateValue(r.fechaHora), idEventoGoogle: null })));
      if (pet.nutrition.configuration !== null) await tx.ConfiguracionNutricion.create({ data: { ...pick(pet.nutrition.configuration, CONFIG), mascotaId: created.id } });
      await insert('InventarioAlimento', pet.nutrition.inventories.map(i => ({ ...pick(i, INVENTORY), mascotaId: created.id, fechaCompra: dateValue(i.fechaCompra) })));
      await insert('RegistroHidratacion', pet.nutrition.hydration.map(r => ({ fechaHora: dateValue(r.fechaHora), cantidad: r.cantidad, mascotaId: created.id })));
      await insert('ClinicaFavorita', pet.favoriteClinics.map(c => ({ ...pick(c, CLINIC), mascotaId: created.id })));
      return created;
      }, { timeout: 15000 });
    } catch (error) {
      await staged.compensate();
      throw error;
    }
    return { mascota, version: validated.version, incomplete: validated.incomplete || warnings.includes('IMAGES_OMITTED_PHASE_2'),
      imagesPending: validated.version === '1.0' || warnings.includes('IMAGES_OMITTED_PHASE_2'),
      warnings: unique(warnings), counts: { ...counts(pet), imagenPrincipal: pet.imageRef === null ? 0 : 1,
        fotosCartilla: pet.medicalRecord.photoRefs.length, recursosImagen: assets.length } };
  }
  // Cada instancia del servicio admite una sola operación costosa de respaldo, sin cola ilimitada.
  let busy = false;
  const exclusive = operation => async (...args) => {
    if (busy) throw new PetBackupError('BACKUP_BUSY', 429, 'Hay un respaldo en proceso; inténtalo de nuevo al finalizar');
    busy = true;
    try { return await operation(...args); } finally { busy = false; }
  };
  return { exportBackup: exclusive(exportBackup), importBackup: exclusive(importBackup) };
}

module.exports = { createPetBackupService, PetBackupError };
