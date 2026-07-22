const prisma = require('../config/prisma');
const AppError = require('../utils/app-error');
const { parsePagination, buildPagination } = require('../utils/pagination');

const CLOSED_CASE_STATES = ['Cerrado', 'Rechazado'];

function parseOptionalPositiveId(value, field) {
  if (value === undefined || value === null || value === '') return undefined;

  const parsed = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${field} debe ser un entero positivo`, 400);
  }

  return parsed;
}

function buildBrigadaWhere(query = {}) {
  const regionId = parseOptionalPositiveId(query.region, 'region');
  const departamentoId = parseOptionalPositiveId(query.departamento, 'departamento');
  const municipioId = parseOptionalPositiveId(query.municipio, 'municipio');
  const tipoBrigadaId = parseOptionalPositiveId(query.tipoBrigada, 'tipoBrigada');

  return {
    ...(regionId ? { regionId } : {}),
    ...(departamentoId ? { departamentoId } : {}),
    ...(municipioId ? { municipioId } : {}),
    ...(tipoBrigadaId ? { tipoBrigadaId } : {}),
  };
}

function hasFilters(where) {
  return Object.keys(where).length > 0;
}

const brigadaDashboardSelect = {
  id: true,
  numero: true,
  nombre: true,
  region: { select: { id: true, nombre: true } },
  departamento: { select: { id: true, nombre: true } },
  municipio: { select: { id: true, nombre: true } },
};

function getFilteredBrigadas(brigadaWhere) {
  return prisma.brigada.findMany({
    where: brigadaWhere,
    orderBy: [{ numero: 'asc' }, { id: 'asc' }],
    select: brigadaDashboardSelect,
  });
}

async function getCaseCountsByBrigada(brigadas, { openOnly = false } = {}) {
  const brigadaIds = brigadas.map((brigada) => brigada.id);

  if (!brigadaIds.length) return new Map();

  const groups = await prisma.casiAccidente.groupBy({
    by: ['brigadaReportanteId'],
    where: {
      brigadaReportanteId: { in: brigadaIds },
      ...(openOnly
        ? { estadoCaso: { nombre: { notIn: CLOSED_CASE_STATES } } }
        : {}),
    },
    _count: { _all: true },
  });

  return new Map(groups.map((group) => [group.brigadaReportanteId, group._count._all]));
}

function sortByTotalAndName(items, totalField, nameField) {
  return items.sort(
    (left, right) =>
      right[totalField] - left[totalField] ||
      left[nameField].localeCompare(right[nameField], 'es'),
  );
}

function aggregateCasesByLocation(brigadas, countsByBrigada, relation, idField, nameField, emptyLabel) {
  const totals = new Map();

  brigadas.forEach((brigada) => {
    const totalCasos = countsByBrigada.get(brigada.id) ?? 0;
    if (!totalCasos) return;

    const location = brigada[relation];
    const key = location?.id ?? 'null';
    const current = totals.get(key) ?? {
      [idField]: location?.id ?? null,
      [nameField]: location?.nombre ?? emptyLabel,
      totalCasos: 0,
    };

    current.totalCasos += totalCasos;
    totals.set(key, current);
  });

  return sortByTotalAndName([...totals.values()], 'totalCasos', nameField);
}

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

async function getOverdueActions(query = {}) {
  const pagination = parsePagination(query, { defaultLimit: 100 });
  const where = {
    fechaCompromiso: { lt: new Date() },
    estadoAccion: { nombre: { not: 'Cerrada' } },
  };
  const [actions, totalItems] = await Promise.all([
    prisma.accionCorrectiva.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: [{ fechaCompromiso: 'asc' }, { id: 'asc' }],
      include: {
        casiAccidente: { select: { id: true, correlativo: true, titulo: true } },
        responsable: { select: { id: true, nombre: true, correo: true } },
        estadoAccion: { select: { id: true, nombre: true } },
      },
    }),
    prisma.accionCorrectiva.count({ where }),
  ]);

  return {
    acciones: actions.map((action) => ({
      id: action.id,
      descripcion: action.descripcion,
      fechaCompromiso: action.fechaCompromiso,
      caso: action.casiAccidente,
      responsable: action.responsable,
      estado: action.estadoAccion,
    })),
    pagination: buildPagination({ ...pagination, totalItems }),
  };
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

async function getBrigadasSummary(query = {}) {
  const brigadaWhere = buildBrigadaWhere(query);
  const filterCasesByBrigada = hasFilters(brigadaWhere);
  const casosConBrigadaWhere = {
    brigadaReportanteId: { not: null },
    ...(filterCasesByBrigada ? { brigadaReportante: brigadaWhere } : {}),
  };
  const casosAbiertosWhere = {
    ...casosConBrigadaWhere,
    estadoCaso: { nombre: { notIn: CLOSED_CASE_STATES } },
  };

  const [
    totalBrigadas,
    brigadasActivas,
    brigadasInactivas,
    totalMiembrosActivos,
    totalCasosConBrigada,
    totalCasosSinBrigada,
    brigadasConCasosAbiertosGroups,
  ] = await Promise.all([
    prisma.brigada.count({ where: brigadaWhere }),
    prisma.brigada.count({ where: { ...brigadaWhere, activo: true } }),
    prisma.brigada.count({ where: { ...brigadaWhere, activo: false } }),
    prisma.brigadaMiembro.count({
      where: {
        activo: true,
        ...(filterCasesByBrigada ? { brigada: brigadaWhere } : {}),
      },
    }),
    prisma.casiAccidente.count({ where: casosConBrigadaWhere }),
    filterCasesByBrigada
      ? Promise.resolve(0)
      : prisma.casiAccidente.count({ where: { brigadaReportanteId: null } }),
    prisma.casiAccidente.groupBy({
      by: ['brigadaReportanteId'],
      where: casosAbiertosWhere,
      _count: { _all: true },
    }),
  ]);

  return {
    totalBrigadas,
    brigadasActivas,
    brigadasInactivas,
    totalMiembrosActivos,
    totalCasosConBrigada,
    totalCasosSinBrigada,
    brigadasConCasosAbiertos: brigadasConCasosAbiertosGroups.length,
  };
}

async function getBrigadaCasesByRegion(query = {}) {
  const brigadas = await getFilteredBrigadas(buildBrigadaWhere(query));
  const countsByBrigada = await getCaseCountsByBrigada(brigadas);

  return aggregateCasesByLocation(
    brigadas,
    countsByBrigada,
    'region',
    'regionId',
    'region',
    'Sin región',
  );
}

async function getBrigadaCasesByDepartamento(query = {}) {
  const brigadas = await getFilteredBrigadas(buildBrigadaWhere(query));
  const countsByBrigada = await getCaseCountsByBrigada(brigadas);

  return aggregateCasesByLocation(
    brigadas,
    countsByBrigada,
    'departamento',
    'departamentoId',
    'departamento',
    'Sin departamento',
  );
}

async function getBrigadaCasesByMunicipio(query = {}) {
  const brigadas = await getFilteredBrigadas(buildBrigadaWhere(query));
  const countsByBrigada = await getCaseCountsByBrigada(brigadas);

  return aggregateCasesByLocation(
    brigadas,
    countsByBrigada,
    'municipio',
    'municipioId',
    'municipio',
    'Sin municipio',
  );
}

async function getCasesByBrigada(query = {}) {
  const brigadas = await getFilteredBrigadas(buildBrigadaWhere(query));
  const countsByBrigada = await getCaseCountsByBrigada(brigadas);

  const items = brigadas.map((brigada) => ({
    brigadaId: brigada.id,
    numero: brigada.numero,
    nombre: brigada.nombre,
    region: brigada.region?.nombre ?? 'Sin región',
    departamento: brigada.departamento?.nombre ?? 'Sin departamento',
    municipio: brigada.municipio?.nombre ?? 'Sin municipio',
    totalCasos: countsByBrigada.get(brigada.id) ?? 0,
  }));

  return sortByTotalAndName(items, 'totalCasos', 'nombre');
}

async function getActiveMembersByBrigada(query = {}) {
  const brigadas = await getFilteredBrigadas(buildBrigadaWhere(query));
  const brigadaIds = brigadas.map((brigada) => brigada.id);

  if (!brigadaIds.length) return [];

  const [memberGroups, leaderGroups] = await Promise.all([
    prisma.brigadaMiembro.groupBy({
      by: ['brigadaId'],
      where: { brigadaId: { in: brigadaIds }, activo: true },
      _count: { _all: true },
    }),
    prisma.brigadaMiembro.groupBy({
      by: ['brigadaId'],
      where: { brigadaId: { in: brigadaIds }, activo: true, esLider: true },
      _count: { _all: true },
    }),
  ]);

  const membersByBrigada = new Map(
    memberGroups.map((group) => [group.brigadaId, group._count._all]),
  );
  const leadersByBrigada = new Map(
    leaderGroups.map((group) => [group.brigadaId, group._count._all]),
  );

  return brigadas.map((brigada) => ({
    brigadaId: brigada.id,
    numero: brigada.numero,
    nombre: brigada.nombre,
    totalIntegrantesActivos: membersByBrigada.get(brigada.id) ?? 0,
    totalLideresActivos: leadersByBrigada.get(brigada.id) ?? 0,
  }));
}

async function getOpenCasesByBrigada(query = {}) {
  const brigadas = await getFilteredBrigadas(buildBrigadaWhere(query));
  const countsByBrigada = await getCaseCountsByBrigada(brigadas, { openOnly: true });

  const items = brigadas.map((brigada) => ({
    brigadaId: brigada.id,
    numero: brigada.numero,
    nombre: brigada.nombre,
    casosAbiertos: countsByBrigada.get(brigada.id) ?? 0,
  }));

  return sortByTotalAndName(items, 'casosAbiertos', 'nombre');
}

module.exports = {
  getSummary,
  getCasesByState,
  getCasesByArea,
  getCasesByCriticality,
  getOverdueActions,
  getLatestCases,
  getBrigadasSummary,
  getBrigadaCasesByRegion,
  getBrigadaCasesByDepartamento,
  getBrigadaCasesByMunicipio,
  getCasesByBrigada,
  getActiveMembersByBrigada,
  getOpenCasesByBrigada,
};
