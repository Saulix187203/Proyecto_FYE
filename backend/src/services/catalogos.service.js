const prisma = require('../config/prisma');
const AppError = require('../utils/app-error');

function parseOptionalPositiveId(value, field) {
  if (value === undefined || value === null || value === '') return undefined;

  const parsed = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${field} debe ser un entero positivo`, 400);
  }

  return parsed;
}

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

function listRegiones() {
  return prisma.region.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true, codigo: true },
  });
}

function listDepartamentos(query = {}) {
  const regionId = parseOptionalPositiveId(query.regionId, 'regionId');

  return prisma.departamento.findMany({
    where: {
      activo: true,
      region: { activo: true },
      ...(regionId ? { regionId } : {}),
    },
    orderBy: [{ region: { nombre: 'asc' } }, { nombre: 'asc' }],
    select: {
      id: true,
      nombre: true,
      codigo: true,
      region: { select: { id: true, nombre: true, codigo: true } },
    },
  });
}

function listMunicipios(query = {}) {
  const departamentoId = parseOptionalPositiveId(query.departamentoId, 'departamentoId');

  return prisma.municipio.findMany({
    where: {
      activo: true,
      departamento: { activo: true, region: { activo: true } },
      ...(departamentoId ? { departamentoId } : {}),
    },
    orderBy: [{ departamento: { nombre: 'asc' } }, { nombre: 'asc' }],
    select: {
      id: true,
      nombre: true,
      codigo: true,
      departamento: {
        select: {
          id: true,
          nombre: true,
          codigo: true,
          region: { select: { id: true, nombre: true, codigo: true } },
        },
      },
    },
  });
}

function listTiposBrigada() {
  return prisma.tipoBrigada.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true, descripcion: true },
  });
}

module.exports = {
  listAreas,
  listProcesos,
  listTiposEvento,
  listCriticidades,
  listEstadosCaso,
  listEstadosAccion,
  listRegiones,
  listDepartamentos,
  listMunicipios,
  listTiposBrigada,
};
