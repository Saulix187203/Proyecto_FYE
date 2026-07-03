const prisma = require('../config/prisma');
const AppError = require('../utils/app-error');

async function getSummary() {
  const now = new Date();
  const [
    totalCasos,
    casosAbiertos,
    casosCerrados,
    casosEnRevision,
    accionesPendientes,
    accionesVencidas,
    accionesEnValidacion,
  ] = await Promise.all([
    prisma.casiAccidente.count(),
    prisma.casiAccidente.count({
      where: { estadoCaso: { nombre: { notIn: ['Cerrado', 'Rechazado'] } } },
    }),
    prisma.casiAccidente.count({ where: { estadoCaso: { nombre: 'Cerrado' } } }),
    prisma.casiAccidente.count({ where: { estadoCaso: { nombre: 'En revisión' } } }),
    prisma.accionCorrectiva.count({ where: { estadoAccion: { nombre: 'Pendiente' } } }),
    prisma.accionCorrectiva.count({
      where: {
        fechaCompromiso: { lt: now },
        estadoAccion: { nombre: { not: 'Cerrada' } },
      },
    }),
    prisma.accionCorrectiva.count({ where: { estadoAccion: { nombre: 'En validación' } } }),
  ]);

  return {
    totalCasos,
    casosAbiertos,
    casosCerrados,
    casosEnRevision,
    accionesPendientes,
    accionesVencidas,
    accionesEnValidacion,
  };
}

async function groupCases(field, catalogModel, label) {
  const groups = await prisma.casiAccidente.groupBy({
    by: [field],
    _count: { _all: true },
  });
  const ids = groups.map((group) => group[field]);
  const catalogs = await catalogModel.findMany({
    where: { id: { in: ids } },
    select: { id: true, nombre: true },
  });
  const byId = new Map(catalogs.map((catalog) => [catalog.id, catalog]));

  return groups
    .map((group) => ({ [label]: byId.get(group[field]), total: group._count._all }))
    .sort((left, right) => left[label].nombre.localeCompare(right[label].nombre, 'es'));
}

function getCasesByState() {
  return groupCases('estadoCasoId', prisma.estadoCaso, 'estado');
}

function getCasesByArea() {
  return groupCases('areaId', prisma.area, 'area');
}

function getCasesByCriticality() {
  return groupCases('criticidadId', prisma.criticidad, 'criticidad');
}

async function getOverdueActions() {
  const actions = await prisma.accionCorrectiva.findMany({
    where: {
      fechaCompromiso: { lt: new Date() },
      estadoAccion: { nombre: { not: 'Cerrada' } },
    },
    orderBy: [{ fechaCompromiso: 'asc' }, { id: 'asc' }],
    include: {
      casiAccidente: { select: { id: true, correlativo: true, titulo: true } },
      responsable: { select: { id: true, nombre: true, correo: true } },
      estadoAccion: { select: { id: true, nombre: true } },
    },
  });

  return actions.map((action) => ({
    id: action.id,
    descripcion: action.descripcion,
    fechaCompromiso: action.fechaCompromiso,
    caso: action.casiAccidente,
    responsable: action.responsable,
    estado: action.estadoAccion,
  }));
}

function parseLimit(value) {
  if (value === undefined) return 10;
  if (!/^\d+$/.test(String(value))) throw new AppError('limit debe ser un entero positivo', 400);
  const limit = Number(value);
  if (limit < 1 || limit > 100) throw new AppError('limit debe estar entre 1 y 100', 400);
  return limit;
}

async function getLatestCases(query = {}) {
  const limit = parseLimit(query.limit);
  const cases = await prisma.casiAccidente.findMany({
    take: limit,
    orderBy: [{ fechaReporte: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      correlativo: true,
      fechaReporte: true,
      estadoCaso: { select: { id: true, nombre: true } },
      area: { select: { id: true, nombre: true } },
      criticidad: { select: { id: true, nombre: true, color: true } },
      reportadoPor: { select: { id: true, nombre: true, correo: true } },
    },
  });

  return cases.map((item) => ({
    id: item.id,
    correlativo: item.correlativo,
    estado: item.estadoCaso,
    area: item.area,
    criticidad: item.criticidad,
    fechaReporte: item.fechaReporte,
    usuarioReporta: item.reportadoPor,
  }));
}

module.exports = {
  getSummary,
  getCasesByState,
  getCasesByArea,
  getCasesByCriticality,
  getOverdueActions,
  getLatestCases,
};
