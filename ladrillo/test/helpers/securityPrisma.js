// Base en memoria con filtros y relaciones; no carga Prisma, credenciales ni red.
function securityState() {
  const date = new Date('2026-11-10T12:00:00Z');
  return {
    Usuario: [{ id: 'kevin', nombreCompleto: 'Kevin', correo: 'kevin@example.test', telefono: '+52 1234567890',
      fechaRegistro: date, imagen: 'avatar-1', colorAvatar: '#2d9b96', googleId: null, estado: 'Activo',
      password: 'hash-sintetico', googleRefreshToken: 'token-sintetico', reset_token: 'recuperacion-sintetica', reset_token_exp: date,
      campoInternoFuturo: 'interno' }],
    Mascota: [{ id: 'a', usuarioId: 'kevin', nombre: 'Coni', imagen: null, fotosCartilla: [] },
      { id: 'b', usuarioId: 'kevin', nombre: 'Beto', imagen: null, fotosCartilla: [] },
      { id: 'x', usuarioId: 'josue', nombre: 'Privada', imagen: null, fotosCartilla: [] }],
    InventarioAlimento: [{ id: 'food-a', mascotaId: 'a', marca: 'Marca A', tipo: 'Croquetas', fechaCompra: date, costo: '100', estado: 'Activo', cantidadTotal: 10, cantidadRestante: 8, unidadMedida: 'kg' },
      { id: 'food-x', mascotaId: 'x', marca: 'Marca privada', tipo: 'Croquetas', fechaCompra: date, costo: '200', estado: 'Activo', cantidadTotal: 5, cantidadRestante: 4, unidadMedida: 'kg' }],
    CompartirAlimento: [{ id: 'link-b', inventarioId: 'food-a', mascotaId: 'b' }],
    ConfiguracionNutricion: [{ id: 'config-a', mascotaId: 'a', porcionDiaria: 100, unidadMedida: 'g', metaAguaDiaria: 4, reinicioAguaDias: 1 },
      { id: 'config-b', mascotaId: 'b', porcionDiaria: 200, unidadMedida: 'g', metaAguaDiaria: 4, reinicioAguaDias: 1 }],
    RegistroHidratacion: [{ id: 'water-a', mascotaId: 'a', cantidad: 1, fechaHora: date }],
    Recordatorio: [{ id: 1, mascotaId: 'a', usuarioId: 'kevin', titulo: 'Consulta', fechaHora: date, descripcion: null, idEventoGoogle: 'evento-propio' },
      { id: 2, mascotaId: 'x', usuarioId: 'josue', titulo: 'Privado', fechaHora: date, descripcion: null, idEventoGoogle: 'evento-ajeno' },
      { id: 3, mascotaId: 'x', usuarioId: 'kevin', titulo: 'Relación antigua inconsistente', fechaHora: date, descripcion: null, idEventoGoogle: 'evento-inconsistente' }],
    Vacuna: [{ id: 10, mascotaId: 'a', nombreVacuna: 'Rabia', fechaAplicacion: date }],
    HistorialMedico: [], ClinicaFavorita: [], CatalogoEspecie: []
  };
}

function securityPrisma(initial = securityState(), { fail = null, ignoreUserSelect = false } = {}) {
  const state = structuredClone(initial), calls = []; let next = 100;
  const relation = (model, row, key) => {
    if (key === 'mascota' && row.mascotaId !== undefined) return ['Mascota', state.Mascota.find(p => p.id === row.mascotaId) ?? null];
    if (model === 'CompartirAlimento' && key === 'inventario') return ['InventarioAlimento', state.InventarioAlimento.find(i => i.id === row.inventarioId) ?? null];
    if (model === 'InventarioAlimento' && key === 'compartidoCon') return ['CompartirAlimento', state.CompartirAlimento.filter(c => c.inventarioId === row.id)];
    if (model === 'Usuario' && key === 'mascotas') return ['Mascota', state.Mascota.filter(p => p.usuarioId === row.id)];
    if (model === 'Mascota') {
      const related = { vacunas: 'Vacuna', historialMedico: 'HistorialMedico', recordatorios: 'Recordatorio',
        clinicasFavoritas: 'ClinicaFavorita', inventariosAlimento: 'InventarioAlimento' }[key];
      if (related) return [related, state[related].filter(r => r.mascotaId === row.id)];
      if (key === 'nutricionConfig') return ['ConfiguracionNutricion', state.ConfiguracionNutricion.find(r => r.mascotaId === row.id) ?? null];
      if (key === 'especie') return ['CatalogoEspecie', null];
    }
    return null;
  };
  const scalar = (value, condition) => {
    if (condition === null || typeof condition !== 'object' || condition instanceof Date) return value instanceof Date && condition instanceof Date ? +value === +condition : value === condition;
    return Object.entries(condition).every(([op, expected]) => {
      if (op === 'in') return expected.includes(value);
      if (op === 'not') return !scalar(value, expected);
      if (op === 'gte') return value >= expected;
      if (op === 'lt') return value < expected;
      if (op === 'equals') return scalar(value, expected);
      throw new Error('Operador no implementado en el simulador: ' + op);
    });
  };
  const matches = (model, row, where = {}) => row !== null && Object.entries(where).every(([key, condition]) => {
    if (key === 'AND') return (Array.isArray(condition) ? condition : [condition]).every(w => matches(model, row, w));
    if (key === 'OR') return condition.some(w => matches(model, row, w));
    if (key === 'NOT') return !(Array.isArray(condition) ? condition : [condition]).some(w => matches(model, row, w));
    const rel = relation(model, row, key);
    if (!rel) return scalar(row[key], condition);
    const [target, data] = rel;
    if (Array.isArray(data)) return Object.entries(condition).every(([op, filter]) => {
      if (op === 'some') return data.some(r => matches(target, r, filter));
      if (op === 'every') return data.every(r => matches(target, r, filter));
      if (op === 'none') return !data.some(r => matches(target, r, filter));
      throw new Error('Filtro de relación no implementado: ' + op);
    });
    return matches(target, data, condition.is || condition);
  });
  const project = (model, row, args = {}) => {
    if (!row) return null;
    if (model === 'Usuario' && ignoreUserSelect) return { ...structuredClone(row), mascotas: structuredClone(state.Mascota.filter(p => p.usuarioId === row.id)) };
    const result = args.select ? {} : structuredClone(row);
    for (const [key, spec] of Object.entries(args.select || args.include || {})) {
      if (!spec) continue;
      const rel = relation(model, row, key);
      if (!rel) { result[key] = structuredClone(row[key]); continue; }
      const [target, data] = rel, options = spec === true ? {} : spec;
      result[key] = Array.isArray(data) ? data.filter(r => matches(target, r, options.where)).map(r => project(target, r, options)) : project(target, data, options);
    }
    return result;
  };
  const db = {};
  for (const model of Object.keys(state)) {
    db[model] = {};
    for (const operation of ['findMany', 'findFirst', 'findUnique', 'create', 'createMany', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert']) {
      db[model][operation] = async (args = {}) => {
        calls.push({ model, operation, args: structuredClone(args) });
        if (fail === model + '.' + operation) throw new Error('detalle interno sensible de prueba');
        const rows = state[model], selected = rows.filter(row => matches(model, row, args.where));
        if (operation === 'findMany') return selected.map(r => project(model, r, args));
        if (operation === 'findFirst' || operation === 'findUnique') return project(model, selected[0] || null, args);
        const create = data => {
          if (data.mascotaId !== undefined && !state.Mascota.some(p => p.id === data.mascotaId)) throw new Error('FK de prueba');
          const { compartidoCon, ...fields } = data;
          const row = { id: ['Recordatorio', 'Vacuna'].includes(model) ? ++next : 'new-' + ++next, ...structuredClone(fields) };
          rows.push(row);
          if (model === 'InventarioAlimento' && compartidoCon?.create) for (const item of compartidoCon.create) state.CompartirAlimento.push({ id: 'new-' + ++next, inventarioId: row.id, ...structuredClone(item) });
          return project(model, row, args);
        };
        if (operation === 'create') return create(args.data);
        if (operation === 'createMany') { for (const data of args.data) create(data); return { count: args.data.length }; }
        if (operation === 'upsert' && !selected.length) return create(args.create);
        if (['update', 'delete', 'upsert'].includes(operation) && !selected.length) throw Object.assign(new Error('No disponible'), { code: 'P2025' });
        const targets = ['updateMany', 'deleteMany'].includes(operation) ? selected : selected.slice(0, 1);
        for (const row of targets) {
          if (operation.startsWith('delete')) rows.splice(rows.indexOf(row), 1);
          else for (const [key, value] of Object.entries(operation === 'upsert' ? args.update : args.data)) if (value !== undefined) row[key] = structuredClone(value);
        }
        return operation.endsWith('Many') ? { count: targets.length } : project(model, targets[0], args);
      };
    }
  }
  db.$transaction = async value => typeof value === 'function' ? value(db) : Promise.all(value);
  return { db, calls, state, writes: () => calls.filter(c => !c.operation.startsWith('find')) };
}
module.exports = { securityState, securityPrisma };
