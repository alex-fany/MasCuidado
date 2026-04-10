const { PrismaClient } = require('@prisma/client');

// Pasamos un objeto vacío para la validación de esta versión de Prisma/Node (6.4.1)
const prisma = new PrismaClient({});

module.exports = prisma;
