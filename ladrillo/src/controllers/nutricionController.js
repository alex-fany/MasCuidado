const prisma = require('../config/prisma');

// Conversión
const factor = { 'g': 1, 'kg': 1000, 'oz': 28.3495, 'lb': 453.592, 't': 1000000 };
const toGrams = (cantidad, unidad) => (cantidad || 0) * (factor[unidad] || 1);
const fromGrams = (cantidad, unidad) => (cantidad || 0) / (factor[unidad] || 1);

// Obtener el grupo de consumo
const getConsumoGrupo = async (inventario) => {
    let porcionTotalGramos = 0;
    const nombresMascotas = [];
    const idsMascotas = [];

    const mPrincipal = await prisma.Mascota.findUnique({ 
        where: { id: inventario.mascotaId }, 
        include: { nutricionConfig: true } 
    });
    if (mPrincipal) {
        nombresMascotas.push(mPrincipal.nombre);
        idsMascotas.push(mPrincipal.id);
        if (mPrincipal.nutricionConfig) {
            porcionTotalGramos += toGrams(mPrincipal.nutricionConfig.porcionDiaria, mPrincipal.nutricionConfig.unidadMedida);
        }
    }

    const vinculaciones = await prisma.CompartirAlimento.findMany({
        where: { inventarioId: inventario.id },
        include: { mascota: { include: { nutricionConfig: true } } }
    });

    for (const v of vinculaciones) {
        if (v.mascota) {
            nombresMascotas.push(v.mascota.nombre);
            idsMascotas.push(v.mascota.id);
            if (v.mascota.nutricionConfig) {
                porcionTotalGramos += toGrams(v.mascota.nutricionConfig.porcionDiaria, v.mascota.nutricionConfig.unidadMedida);
            }
        }
    }

    return { porcionTotalGramos, nombresMascotas, idsMascotas };
};

// Endpoints

// Obtener estado nutricional
exports.getEstadoNutricional = async (req, res) => {
    try {
        const { mascotaId } = req.params;
        const config = await prisma.ConfiguracionNutricion.findUnique({ where: { mascotaId } });

        let inventario = await prisma.InventarioAlimento.findFirst({
            where: { mascotaId, estado: 'Activo' },
            orderBy: { fechaCompra: 'desc' }
        });

        if (!inventario) {
            const vinculacion = await prisma.CompartirAlimento.findFirst({
                where: { mascotaId, inventario: { estado: 'Activo' } },
                include: { inventario: true }
            });
            if (vinculacion) inventario = vinculacion.inventario;
        }

        const intervalo = config?.reinicioAguaDias || 1;
        const hoy = new Date(); hoy.setHours(0,0,0,0);
        const fechaInicioAgua = new Date(hoy);
        if (intervalo > 1) fechaInicioAgua.setDate(hoy.getDate() - (intervalo - 1));
        
        const registrosAgua = await prisma.RegistroHidratacion.findMany({
            where: { mascotaId, fechaHora: { gte: fechaInicioAgua, lt: new Date(hoy.getTime() + 86400000) } }
        });
        const aguaHoy = registrosAgua.reduce((sum, r) => sum + (parseInt(r.cantidad) || 0), 0);

        let alimentoInfo = null;
        if (inventario) {
            const { porcionTotalGramos, nombresMascotas, idsMascotas } = await getConsumoGrupo(inventario);

            const fechaCompra = new Date(inventario.fechaCompra);
            const hoyActual = new Date();
            const diasTranscurridos = Math.floor(Math.max(0, hoyActual - fechaCompra) / (1000 * 60 * 60 * 24));
            
            const pesoInicialGramos = toGrams(inventario.cantidadTotal, inventario.unidadMedida);
            const consumidoGramos = diasTranscurridos * porcionTotalGramos;
            const restanteGramos = Math.max(0, pesoInicialGramos - consumidoGramos);
            
            const diasRestantes = porcionDiariaTotalGramos = porcionTotalGramos > 0 ? Math.floor(restanteGramos / porcionTotalGramos) : 0;

            const miMascota = await prisma.Mascota.findUnique({ where: { id: mascotaId } });

            alimentoInfo = {
                id: inventario.id,
                marca: inventario.marca,
                cantidadTotal: inventario.cantidadTotal,
                cantidadRestante: fromGrams(restanteGramos, inventario.unidadMedida),
                totalUnidad: inventario.unidadMedida,
                diasRestantes,
                porcentaje: Math.round((restanteGramos / pesoInicialGramos) * 100) || 0,
                alerta: diasRestantes <= 7,
                esCompartido: nombresMascotas.length > 1,
                grupoNombres: nombresMascotas.filter(n => n !== miMascota?.nombre),
                grupoIds: idsMascotas.filter(id => id !== mascotaId)
            };
        }

        res.json({
            config: config || { porcionDiaria: 0, metaAguaDiaria: 4, unidadMedida: 'g', reinicioAguaDias: 1 },
            alimento: alimentoInfo,
            agua: { hoy: aguaHoy, meta: config?.metaAguaDiaria || 4 }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener estado nutricional' });
    }
};

// Registrar compra
exports.registrarCompra = async (req, res) => {
    try {
        const { mascotaId } = req.params;
        const { marca, tipo, cantidadTotal, costo, unidadMedida, compartidaConIds, resolveConflict } = req.body;

        const mascotasGrupo = Array.from(new Set([mascotaId, ...(compartidaConIds || [])]));

        // Buscar todos los bultos (costales, bolstas, o como le quieran decir) activos de los integrantes
        const bultosActivos = await prisma.InventarioAlimento.findMany({
            where: {
                OR: [
                    { mascotaId: { in: mascotasGrupo }, estado: 'Activo' },
                    { compartidoCon: { some: { mascotaId: { in: mascotasGrupo } } }, estado: 'Activo' }
                ]
            },
            include: { mascota: true, compartidoCon: { include: { mascota: true } } }
        });

        const bultosUnicos = Array.from(new Map(bultosActivos.map(b => [b.id, b])).values());
        const bultosCompartidos = bultosUnicos.filter(b => b.compartidoCon.length > 0);

        // Conflicto: Alguien ya comparte con otro grupo
        if (bultosCompartidos.length > 0 && !resolveConflict) {
            const nombresConflictivos = new Set();
            bultosCompartidos.forEach(b => {
                nombresConflictivos.add(b.mascota.nombre);
                b.compartidoCon.forEach(c => {
                    if (mascotasGrupo.includes(c.mascotaId)) nombresConflictivos.add(c.mascota.nombre);
                });
            });
            return res.status(409).json({ conflict: true, pets: Array.from(nombresConflictivos) });
        }

        let pesoInicialGramos = toGrams(parseFloat(cantidadTotal), unidadMedida);

        // Merge de remanentes
        for (const bulto of bultosUnicos) {
            const { porcionTotalGramos } = await getConsumoGrupo(bulto);
            const dias = Math.floor(Math.max(0, new Date() - new Date(bulto.fechaCompra)) / (1000 * 60 * 60 * 24));
            const restante = Math.max(0, toGrams(bulto.cantidadTotal, bulto.unidadMedida) - (dias * porcionTotalGramos));
            pesoInicialGramos += restante;
        }

        // Limpiar viejos
        await prisma.InventarioAlimento.updateMany({
            where: { OR: [ { id: { in: bultosUnicos.map(b => b.id) } }, { mascotaId: { in: mascotasGrupo }, estado: 'Activo' } ] },
            data: { estado: 'Agotado' }
        });

        await prisma.CompartirAlimento.deleteMany({
            where: { OR: [ { inventarioId: { in: bultosUnicos.map(b => b.id) } }, { mascotaId: { in: mascotasGrupo } } ] }
        });

        const nuevoTotal = fromGrams(pesoInicialGramos, unidadMedida);
        const nuevoBulto = await prisma.InventarioAlimento.create({
            data: {
                mascotaId, marca, tipo, cantidadTotal: nuevoTotal, cantidadRestante: nuevoTotal, unidadMedida,
                costo: costo ? parseFloat(costo) : null,
                compartidoCon: { create: (mascotasGrupo.filter(id => id !== mascotaId)).map(id => ({ mascotaId: id })) }
            }
        });

        res.status(201).json(nuevoBulto);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar la compra' });
    }
};

// Actualizar compartidos con detección de conflictos
exports.actualizarCompartirActual = async (req, res) => {
    try {
        const { mascotaId } = req.params;
        const { compartidaConIds, resolveConflict } = req.body;

        // Encontrar bulto activo actual
        let inventario = await prisma.InventarioAlimento.findFirst({
            where: { mascotaId, estado: 'Activo' }
        });
        if (!inventario) {
            const vinculacion = await prisma.CompartirAlimento.findFirst({
                where: { mascotaId, inventario: { estado: 'Activo' } },
                include: { inventario: true }
            });
            if (vinculacion) inventario = vinculacion.inventario;
        }
        if (!inventario) return res.status(404).json({ error: 'No hay comida activa' });

        // Detectar conflictos de grupo para los nuevos integrantes
        // (Buscamos si alguna de las mascotas que queremos añadir ya comparte otra comida diferente a la actual)
        const bultosOtros = await prisma.InventarioAlimento.findMany({
            where: {
                id: { not: inventario.id },
                estado: 'Activo',
                OR: [
                    { mascotaId: { in: compartidaConIds } },
                    { compartidoCon: { some: { mascotaId: { in: compartidaConIds } } } }
                ]
            },
            include: { mascota: true, compartidoCon: { include: { mascota: true } } }
        });

        const bultosUnicosConf = Array.from(new Map(bultosOtros.map(b => [b.id, b])).values());
        const bultosCompartidosConf = bultosUnicosConf.filter(b => b.compartidoCon.length > 0);

        if (bultosCompartidosConf.length > 0 && !resolveConflict) {
            const nombresConf = new Set();
            bultosCompartidosConf.forEach(b => {
                nombresConf.add(b.mascota.nombre);
                b.compartidoCon.forEach(c => { if (compartidaConIds.includes(c.mascotaId)) nombresConf.add(c.mascota.nombre); });
            });
            return res.status(409).json({ conflict: true, pets: Array.from(nombresConf) });
        }

        // Ejecutar Fusión o Sincronización
        let granTotalGramos = toGrams(inventario.cantidadTotal, inventario.unidadMedida);

        if (resolveConflict === 'merge') {
            // Calculamos el restante real del bulto actual (dueño)
            const { porcionTotalGramos: pActual } = await getConsumoGrupo(inventario);
            const dActual = Math.floor(Math.max(0, new Date() - new Date(inventario.fechaCompra)) / (1000 * 60 * 60 * 24));
            const rActualGramos = Math.max(0, toGrams(inventario.cantidadTotal, inventario.unidadMedida) - (dActual * pActual));
            
            granTotalGramos = rActualGramos;

            // Sumamos los restantes reales de los bultos conflictivos
            for (const bOther of bultosUnicosConf) {
                const { porcionTotalGramos: pOther } = await getConsumoGrupo(bOther);
                const dOther = Math.floor(Math.max(0, new Date() - new Date(bOther.fechaCompra)) / (1000 * 60 * 60 * 24));
                const rOtherGramos = Math.max(0, toGrams(bOther.cantidadTotal, bOther.unidadMedida) - (dOther * pOther));
                granTotalGramos += rOtherGramos;
            }

            // Actualizamos el bulto principal con el nuevo total y reseteamos fecha a hoy
            await prisma.InventarioAlimento.update({
                where: { id: inventario.id },
                data: { 
                    cantidadTotal: fromGrams(granTotalGramos, inventario.unidadMedida),
                    cantidadRestante: fromGrams(granTotalGramos, inventario.unidadMedida),
                    fechaCompra: new Date()
                }
            });
        }

        // Desactivar los otros bultos fusionados
        await prisma.InventarioAlimento.updateMany({
            where: { id: { in: bultosUnicosConf.map(b => b.id) } },
            data: { estado: 'Agotado' }
        });

        // Sincronizar Vinculaciones
        await prisma.CompartirAlimento.deleteMany({
            where: { 
                OR: [
                    { inventarioId: inventario.id },
                    { mascotaId: { in: compartidaConIds }, inventario: { estado: 'Activo' } }
                ]
            }
        });

        const nuevasVinc = (compartidaConIds || [])
            .filter(id => id !== inventario.mascotaId)
            .map(id => ({ inventarioId: inventario.id, mascotaId: id }));

        await prisma.CompartirAlimento.createMany({ data: nuevasVinc });

        res.json({ message: 'Grupo actualizado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar grupo' });
    }
};

// Dejar de usar comida
exports.dejarDeCompartir = async (req, res) => {
    try {
        const { mascotaId } = req.params;
        
        const esDuenio = await prisma.InventarioAlimento.findFirst({
            where: { mascotaId, estado: 'Activo' },
            include: { compartidoCon: true }
        });

        if (esDuenio) {
            if (esDuenio.compartidoCon.length > 0) {
                const sucesor = esDuenio.compartidoCon[0];
                await prisma.InventarioAlimento.update({
                    where: { id: esDuenio.id },
                    data: { mascotaId: sucesor.mascotaId }
                });
                await prisma.CompartirAlimento.delete({ where: { id: sucesor.id } });
            } else {
                await prisma.InventarioAlimento.update({ where: { id: esDuenio.id }, data: { estado: 'Agotado' } });
            }
            return res.json({ message: 'Te has retirado del grupo.' });
        }

        const vinculacion = await prisma.CompartirAlimento.findFirst({
            where: { mascotaId, inventario: { estado: 'Activo' } }
        });

        if (vinculacion) {
            await prisma.CompartirAlimento.delete({ where: { id: vinculacion.id } });
            return res.json({ message: 'Has dejado de usar esta comida.' });
        }

        res.status(404).json({ error: 'No se encontró comida activa' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al desvincular' });
    }
};

// Actualizar configuración básica
exports.updateConfig = async (req, res) => {
    try {
        const { mascotaId } = req.params;
        const { porcionDiaria, metaAguaDiaria, unidadMedida, reinicioAguaDias, vaciarAgua } = req.body;

        if (vaciarAgua) {
            const hoy = new Date(); hoy.setHours(0,0,0,0);
            await prisma.RegistroHidratacion.deleteMany({
                where: { mascotaId, fechaHora: { gte: hoy, lt: new Date(hoy.getTime() + 86400000) } }
            });
        }

        const config = await prisma.ConfiguracionNutricion.upsert({
            where: { mascotaId },
            update: { porcionDiaria: parseFloat(porcionDiaria), metaAguaDiaria: parseInt(metaAguaDiaria), reinicioAguaDias: parseInt(reinicioAguaDias), unidadMedida },
            create: { mascotaId, porcionDiaria: parseFloat(porcionDiaria), metaAguaDiaria: parseInt(metaAguaDiaria), reinicioAguaDias: parseInt(reinicioAguaDias), unidadMedida }
        });
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: 'Error al guardar configuración.' });
    }
};

// Obtener eventos para el calendario (Predicciones de comida)
exports.getEventosNutricionales = async (req, res) => {
    try {
        const userId = req.user.id;

        // Obtener todas las mascotas del usuario
        const mascotas = await prisma.Mascota.findMany({
            where: { usuarioId: userId }
        });
        const mascotaIds = mascotas.map(m => m.id);

        // Buscar todos los bultos activos vinculados a estas mascotas (propios o compartidos)
        const bultosActivos = await prisma.InventarioAlimento.findMany({
            where: {
                OR: [
                    { mascotaId: { in: mascotaIds }, estado: 'Activo' },
                    { compartidoCon: { some: { mascotaId: { in: mascotaIds } } }, estado: 'Activo' }
                ]
            },
            include: { 
                mascota: { include: { nutricionConfig: true } },
                compartidoCon: { include: { mascota: { include: { nutricionConfig: true } } } } 
            }
        });

        // Filtrar únicos por ID para evitar duplicados en el calendario
        const bultosUnicos = Array.from(new Map(bultosActivos.map(b => [b.id, b])).values());

        const eventos = [];

        for (const bulto of bultosUnicos) {
            // Calculamos el consumo total del grupo
            const { porcionTotalGramos, nombresMascotas } = await getConsumoGrupo(bulto);

            if (porcionTotalGramos > 0) {
                // Cálculo de días restantes
                const totalBultoGramos = toGrams(bulto.cantidadTotal, bulto.unidadMedida);
                const diasDuracionTotal = Math.floor(totalBultoGramos / porcionTotalGramos);

                // Fecha de agotamiento = Fecha de compra + días totales
                const fechaAgotamiento = new Date(bulto.fechaCompra);
                fechaAgotamiento.setDate(fechaAgotamiento.getDate() + diasDuracionTotal);

                eventos.push({
                    id: `food-end-${bulto.id}`,
                    titulo: bulto.marca || 'S/M',
                    fecha: fechaAgotamiento,
                    type: 'food_depletion',
                    pets: nombresMascotas,
                    pet: { nombre: nombresMascotas.join(' • '), tipo: 'Comida' }
                });
            }
        }

        res.json(eventos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener eventos nutricionales' });
    }
};

// Registrar toma de agua
exports.registrarAgua = async (req, res) => {
    try {
        const { mascotaId } = req.params;
        const registro = await prisma.RegistroHidratacion.create({
            data: { mascotaId, cantidad: req.body.cantidad || 1 }
        });
        res.status(201).json(registro);
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar agua.' });
    }
};
