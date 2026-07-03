const prisma = require('../config/prisma');

function listAreas() {
  return prisma.area.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true, descripcion: true },
  });
}

function listProcesos() {
  return prisma.proceso.findMany({
    where: { activo: true, area: { activo: true } },
    orderBy: [{ area: { nombre: 'asc' } }, { nombre: 'asc' }],
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      area: { select: { id: true, nombre: true } },
    },
  });
}

function listTiposEvento() {
  return prisma.tipoEvento.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true, descripcion: true },
  });
}

function listCriticidades() {
  return prisma.criticidad.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
    select: { id: true, nombre: true, descripcion: true, color: true, orden: true },
  });
}

function listEstadosCaso() {
  return prisma.estadoCaso.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
    select: { id: true, nombre: true, descripcion: true, orden: true, esFinal: true },
  });
}

function listEstadosAccion() {
  return prisma.estadoAccion.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
    select: { id: true, nombre: true, descripcion: true, orden: true, esFinal: true },
  });
}

module.exports = {
  listAreas,
  listProcesos,
  listTiposEvento,
  listCriticidades,
  listEstadosCaso,
  listEstadosAccion,
};
