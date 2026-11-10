// Simulador transaccional en memoria; no importa Prisma ni carga variables de entorno.
function sourceState() {
  const at = new Date('2026-11-10T12:00:00.000Z');
  return {
    CatalogoEspecie: [{ id: 42, nombreEspecie: 'Gato' }],
    Mascota: [{ id: 'kevin-coni', usuarioId: 'kevin', especieId: 42, nombre: 'Coni', tipo: 'Gato', raza: 'Mestizo',
      edad: 0, peso: 4.25, sexo: 'H', genero: 'Hembra', color: 'Gris', senasParticulares: 'Mancha',
      fechaNacimiento: new Date('2024-02-29T00:00:00Z'), medicamentos: 'Ninguno', padecimientos: null,
      imagen: null, fotosCartilla: [] },
    { id: 'kevin-other', usuarioId: 'kevin', especieId: null, nombre: 'Otra' }],
    Vacuna: [{ id: 10, mascotaId: 'kevin-coni', nombreVacuna: 'Rabia', fechaAplicacion: new Date('2025-03-01T00:00:00Z'), proximaDosis: null, lote: 'L-1' }],
    HistorialMedico: [{ id: 'original-history', mascotaId: 'kevin-coni', tipoEvento: 'Consulta', fechaEvento: new Date('2025-03-01T00:00:00Z'), descripcion: 'Revisión', veterinarioClinica: 'Clínica', pesoKg: '4.25' }],
    Recordatorio: [{ id: 20, mascotaId: 'kevin-coni', usuarioId: 'kevin', titulo: 'Consulta', descripcion: 'Control', fechaHora: at, estado: true, idEventoGoogle: 'secret-google-event' }],
    ConfiguracionNutricion: [{ id: 'original-config', mascotaId: 'kevin-coni', metaAguaDiaria: 0, reinicioAguaDias: 2, porcionDiaria: 0, unidadMedida: 'g' }],
    InventarioAlimento: [
      { id: 'own-food', mascotaId: 'kevin-coni', marca: 'Marca A', tipo: 'Croquetas', fechaCompra: at, costo: '150.50', estado: 'Agotado', cantidadTotal: 10, cantidadRestante: 2.5, unidadMedida: 'kg' },
      { id: 'other-food', mascotaId: 'kevin-other', marca: 'Marca B', tipo: 'Croquetas', fechaCompra: at, costo: null, estado: 'Activo', cantidadTotal: 5, cantidadRestante: 4, unidadMedida: 'kg' }],
    CompartirAlimento: [{ id: 'link-1', inventarioId: 'other-food', mascotaId: 'kevin-coni' }],
    RegistroHidratacion: [{ id: 'original-water', mascotaId: 'kevin-coni', fechaHora: at, cantidad: 3 }],
    ClinicaFavorita: [{ id: 'original-clinic', mascotaId: 'kevin-coni', placeId: 'public-place', nombre: 'Clínica', direccion: 'Calle', notasUsuario: 'Urgencias' }]
  };
}

function fakePrisma(initial = sourceState(), { failModel, failCommit = false } = {}) {
  let state = structuredClone(initial), sequence = 1000;
  const calls = [];
  const prisma = { $transaction: async (callback, options) => {
    calls.push({ operation: 'transaction', options });
    const pending = structuredClone(state), tx = {};
    for (const model of Object.keys(pending)) {
      const create = async ({ data }) => {
        calls.push({ operation: 'create', model, data: structuredClone(data) });
        if (failModel === model) throw new Error('simulated database failure: credentials must never escape');
        if (data.id !== undefined) throw new Error('IDs must be generated');
        if (model !== 'Mascota' && model !== 'CatalogoEspecie' && !pending.Mascota.some(p => p.id === data.mascotaId)) throw new Error('foreign key failure');
        const record = { ...structuredClone(data), id: ['Recordatorio', 'Vacuna'].includes(model) ? ++sequence : `new-${++sequence}` };
        pending[model].push(record); return structuredClone(record);
      };
      tx[model] = { create, createMany: async ({ data }) => {
        if (data.length > 500) throw new Error('batch too large');
        for (const item of data) await create({ data: item });
        return { count: data.length };
      } };
    }
    tx.Mascota.findFirst = async ({ where, include }) => {
      calls.push({ operation: 'findPet', where: structuredClone(where) });
      const pet = pending.Mascota.find(p => p.id === where.id && p.usuarioId === where.usuarioId);
      if (!pet) return null;
      const result = structuredClone(pet);
      result.especie = pending.CatalogoEspecie.find(s => s.id === pet.especieId) ?? null;
      for (const [relation, model] of Object.entries({ vacunas: 'Vacuna', historialMedico: 'HistorialMedico', recordatorios: 'Recordatorio',
        registrosHidratacion: 'RegistroHidratacion', clinicasFavoritas: 'ClinicaFavorita' })) {
        result[relation] = pending[model].filter(r => r.mascotaId === pet.id && (!include[relation].where || r.usuarioId === include[relation].where.usuarioId)).slice(0, include[relation].take);
      }
      result.nutricionConfig = pending.ConfiguracionNutricion.find(c => c.mascotaId === pet.id) ?? null;
      return result;
    };
    tx.InventarioAlimento.findMany = async ({ where, take }) => {
      const petId = where.OR[0].mascotaId;
      return pending.InventarioAlimento.filter(i => i.mascotaId === petId || pending.CompartirAlimento.some(l => l.inventarioId === i.id && l.mascotaId === petId))
        .slice(0, take).map(i => ({ ...i, mascota: { usuarioId: pending.Mascota.find(p => p.id === i.mascotaId).usuarioId },
          compartidoCon: pending.CompartirAlimento.filter(l => l.inventarioId === i.id).map(l => ({ mascotaId: l.mascotaId })) }));
    };
    tx.CatalogoEspecie.findUnique = async ({ where }) => pending.CatalogoEspecie.find(s => s.nombreEspecie === where.nombreEspecie) ?? null;
    try {
      const result = await callback(tx);
      if (failCommit) throw new Error('simulated commit failure');
      state = pending; calls.push({ operation: 'commit' }); return result;
    } catch (error) { calls.push({ operation: 'rollback' }); throw error; }
  } };
  return { prisma, calls, state: () => structuredClone(state) };
}

module.exports = { fakePrisma, sourceState };
