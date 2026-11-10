class PetAccessError extends Error {
  constructor(status, message) { super(message); this.status = status; this.name = 'PetAccessError'; }
}

function sessionUserId(req) {
  const id = req.user?.id;
  if (typeof id !== 'string' || !id.trim()) throw new PetAccessError(401, 'No autorizado');
  return id;
}

function petIds(value) {
  if (!Array.isArray(value) || value.length > 1000 || value.some(id => typeof id !== 'string' || !id.trim())) {
    throw new PetAccessError(400, 'Identificadores de mascotas inválidos');
  }
  return [...new Set(value)];
}

async function requireOwnedPets(db, userId, requestedIds, { foodGroups = false } = {}) {
  if (typeof userId !== 'string' || !userId.trim()) throw new PetAccessError(401, 'No autorizado');
  const ids = petIds(requestedIds);
  if (!ids.length) return ids;
  const owned = await db.Mascota.findMany({ where: { id: { in: ids }, usuarioId: userId }, select: { id: true } });
  if (owned.length !== ids.length || ids.some(id => !owned.some(pet => pet.id === id))) {
    throw new PetAccessError(404, 'Mascota o recurso no disponible');
  }
  if (foodGroups) {
    // Se revisan también los vínculos históricos: una limpieza no debe afectar
    // inventarios de otra cuenta mediante una relación antigua o inconsistente.
    const foreignGroup = await db.InventarioAlimento.findFirst({ where: { AND: [
      { OR: [{ mascotaId: { in: ids } }, { compartidoCon: { some: { mascotaId: { in: ids } } } }] },
      { OR: [{ mascota: { usuarioId: { not: userId } } },
        { compartidoCon: { some: { mascota: { usuarioId: { not: userId } } } } }] }
    ] }, select: { id: true } });
    if (foreignGroup) throw new PetAccessError(404, 'Mascota o recurso no disponible');
  }
  return ids;
}

function reminderId(value) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || Number(value) > 2147483647) {
    throw new PetAccessError(400, 'Identificador de recordatorio inválido');
  }
  return Number(value);
}

function sendPetError(res, error, fallback) {
  if (error instanceof PetAccessError) return res.status(error.status).json({ error: error.message });
  if (error?.code === 'P2025') return res.status(404).json({ error: 'Mascota o recurso no disponible' });
  return res.status(500).json({ error: fallback });
}

module.exports = { PetAccessError, sessionUserId, petIds, requireOwnedPets, reminderId, sendPetError };
