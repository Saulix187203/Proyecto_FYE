const prisma = require('../config/prisma');

async function listRoles() {
  return prisma.rol.findMany({
    orderBy: { nombre: 'asc' },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      activo: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

module.exports = { listRoles };
