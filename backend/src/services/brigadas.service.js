const prisma = require('../config/prisma');
const AppError = require('../utils/app-error');
const {
  parsePagination,
  parseSorting,
  buildPagination,
  hasPaginationParams,
} = require('../utils/pagination');

const BRIGADA_RELATIONS = {
  tipoBrigada: { select: { id: true, nombre: true, descripcion: true } },
  region: { select: { id: true, nombre: true, codigo: true } },
  departamento: { select: { id: true, nombre: true, codigo: true } },
  municipio: { select: { id: true, nombre: true, codigo: true } },
  _count: { select: { miembros: { where: { activo: true } } } },
};

const BRIGADA_OPTION_SELECT = {
  id: true,
  numero: true,
  nombre: true,
  tipoBrigada: { select: { id: true, nombre: true } },
  region: { select: { id: true, nombre: true } },
  departamento: { select: { id: true, nombre: true } },
  municipio: { select: { id: true, nombre: true } },
};

const BRIGADA_LIST_MAX_LIMIT = 500;
const BRIGADA_OPTIONS_DEFAULT_LIMIT = 20;
const BRIGADA_OPTIONS_MAX_LIMIT = 100;

const MEMBER_RELATIONS = {
  usuario: { select: { id: true, nombre: true, correo: true, activo: true } },
};

const MY_BRIGADA_RELATIONS = {
  brigada: {
    include: {
      tipoBrigada: { select: { id: true, nombre: true, descripcion: true } },
      region: { select: { id: true, nombre: true, codigo: true } },
      departamento: { select: { id: true, nombre: true, codigo: true } },
      municipio: { select: { id: true, nombre: true, codigo: true } },
    },
  },
};
const BRIGADA_SORT_FIELDS = {
  id: 'id',
  numero: 'numero',
  nombre: 'nombre',
  activo: 'activo',
  createdAt: 'createdAt',
};

function parsePositiveId(value, field) {
  const parsed = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${field} debe ser un entero positivo`, 400);
  }

  return parsed;
}

function parseOptionalPositiveId(value, field) {
  if (value === undefined || value === null || value === '') return null;
  return parsePositiveId(value, field);
}

function parseOptionalBoolean(value, field) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new AppError(`${field} debe ser verdadero o falso`, 400);
}

function validateText(value, field, { maxLength, required = true } = {}) {
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`${field} es requerido`, 400);
  }

  const normalized = value.trim();
  if (maxLength && normalized.length > maxLength) {
    throw new AppError(`${field} debe tener hasta ${maxLength} caracteres`, 400);
  }

  return normalized;
}

function validateOptionalText(value, field, { maxLength } = {}) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return validateText(value, field, { maxLength });
}

function parseDate(value, field) {
  if (typeof value !== 'string' && !(value instanceof Date)) {
    throw new AppError(`${field} debe ser una fecha válida`, 400);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${field} debe ser una fecha válida`, 400);
  }

  return date;
}

function parseOptionalDate(value, field) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return parseDate(value, field);
}

function serializeBrigada(brigada) {
  const { _count, ...data } = brigada;

  return {
    ...data,
    miembrosActivos: _count?.miembros ?? 0,
  };
}

function serializeMiembro(miembro) {
  return {
    id: miembro.id,
    usuario: miembro.usuario,
    cargoEnBrigada: miembro.cargoEnBrigada,
    esLider: miembro.esLider,
    activo: miembro.activo,
    fechaDesde: miembro.fechaDesde,
    fechaHasta: miembro.fechaHasta,
    createdAt: miembro.createdAt,
    updatedAt: miembro.updatedAt,
  };
}

function serializeMiBrigada(miembro) {
  return {
    ...miembro.brigada,
    membresia: {
      id: miembro.id,
      cargoEnBrigada: miembro.cargoEnBrigada,
      esLider: miembro.esLider,
      fechaDesde: miembro.fechaDesde,
      fechaHasta: miembro.fechaHasta,
    },
  };
}

async function validateBrigadaCatalogs({
  tipoBrigadaId,
  regionId,
  departamentoId,
  municipioId,
}) {
  if (municipioId && !departamentoId) {
    throw new AppError('municipioId requiere departamentoId', 400);
  }

  const [tipoBrigada, region, departamento, municipio] = await Promise.all([
    prisma.tipoBrigada.findFirst({
      where: { id: tipoBrigadaId, activo: true },
      select: { id: true },
    }),
    prisma.region.findFirst({
      where: { id: regionId, activo: true },
      select: { id: true },
    }),
    departamentoId
      ? prisma.departamento.findFirst({
          where: { id: departamentoId, activo: true },
          select: { id: true, regionId: true },
        })
      : null,
    municipioId
      ? prisma.municipio.findFirst({
          where: { id: municipioId, activo: true },
          select: { id: true, departamentoId: true },
        })
      : null,
  ]);

  if (!tipoBrigada) throw new AppError('Tipo de brigada no encontrado o inactivo', 404);
  if (!region) throw new AppError('Región no encontrada o inactiva', 404);
  if (departamentoId && !departamento) {
    throw new AppError('Departamento no encontrado o inactivo', 404);
  }
  if (municipioId && !municipio) {
    throw new AppError('Municipio no encontrado o inactivo', 404);
  }
  if (departamento && departamento.regionId !== regionId) {
    throw new AppError('El departamento seleccionado no pertenece a la región indicada', 400);
  }
  if (municipio && municipio.departamentoId !== departamentoId) {
    throw new AppError('El municipio seleccionado no pertenece al departamento indicado', 400);
  }
}

async function getBrigadaForMembership(brigadaId, { requireActive = false } = {}) {
  const brigada = await prisma.brigada.findUnique({
    where: { id: brigadaId },
    select: { id: true, activo: true },
  });

  if (!brigada) throw new AppError('Brigada no encontrada', 404);
  if (requireActive && !brigada.activo) {
    throw new AppError('La brigada se encuentra inactiva', 400);
  }

  return brigada;
}

async function ensureUsuarioActivo(usuarioId) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, activo: true },
  });

  if (!usuario) throw new AppError('Usuario no encontrado', 404);
  if (!usuario.activo) throw new AppError('El usuario se encuentra inactivo', 400);

  return usuario;
}

async function ensureNoActiveDuplicateMember(brigadaId, usuarioId, excludeId) {
  const duplicated = await prisma.brigadaMiembro.findFirst({
    where: {
      brigadaId,
      usuarioId,
      activo: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (duplicated) {
    throw new AppError('El usuario ya es miembro activo de esta brigada', 400);
  }
}

async function ensureNoOtherActiveLeader(brigadaId, excludeId) {
  const leader = await prisma.brigadaMiembro.findFirst({
    where: {
      brigadaId,
      esLider: true,
      activo: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (leader) {
    throw new AppError('Ya existe un líder activo en esta brigada', 400);
  }
}

function validateMembershipDates(fechaDesde, fechaHasta) {
  if (fechaHasta && fechaHasta < fechaDesde) {
    throw new AppError('fechaHasta no puede ser menor que fechaDesde', 400);
  }
}

async function ensureUniqueActiveBrigada({
  numero,
  tipoBrigadaId,
  regionId,
  departamentoId,
  municipioId,
  excludeId,
}) {
  const duplicated = await prisma.brigada.findFirst({
    where: {
      numero: { equals: numero, mode: 'insensitive' },
      tipoBrigadaId,
      regionId,
      departamentoId,
      municipioId,
      activo: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (duplicated) {
    throw new AppError(
      'Ya existe una brigada activa con ese número, tipo y ubicación',
      400,
    );
  }
}

function buildBrigadaWhere(query = {}, { defaultActivo } = {}) {
  const activo = parseOptionalBoolean(query.activo, 'activo') ?? defaultActivo;
  const tipoBrigadaId = parseOptionalPositiveId(query.tipoBrigadaId, 'tipoBrigadaId');
  const regionId = parseOptionalPositiveId(query.regionId, 'regionId');
  const departamentoId = parseOptionalPositiveId(query.departamentoId, 'departamentoId');
  const municipioId = parseOptionalPositiveId(query.municipioId, 'municipioId');
  const texto = validateText(query.texto, 'texto', { maxLength: 150, required: false });
  const where = {};

  if (activo !== undefined) where.activo = activo;
  if (tipoBrigadaId) where.tipoBrigadaId = tipoBrigadaId;
  if (regionId) where.regionId = regionId;
  if (departamentoId) where.departamentoId = departamentoId;
  if (municipioId) where.municipioId = municipioId;
  if (texto) {
    where.OR = [
      { nombre: { contains: texto, mode: 'insensitive' } },
      { numero: { contains: texto, mode: 'insensitive' } },
    ];
  }

  return where;
}

async function listBrigadas(query = {}) {
  const where = buildBrigadaWhere(query);

  if (!hasPaginationParams(query)) {
    const brigadas = await prisma.brigada.findMany({
      where,
      orderBy: [
        { region: { nombre: 'asc' } },
        { departamento: { nombre: 'asc' } },
        { municipio: { nombre: 'asc' } },
        { tipoBrigada: { nombre: 'asc' } },
        { numero: 'asc' },
        { id: 'asc' },
      ],
      include: BRIGADA_RELATIONS,
    });

    return brigadas.map(serializeBrigada);
  }

  const pagination = parsePagination(query, { maxLimit: BRIGADA_LIST_MAX_LIMIT });
  const sorting = parseSorting(query, BRIGADA_SORT_FIELDS, {
    sortBy: 'numero',
    sortDir: 'asc',
  });
  const [brigadas, totalItems] = await Promise.all([
    prisma.brigada.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: sorting.orderBy,
      include: BRIGADA_RELATIONS,
    }),
    prisma.brigada.count({ where }),
  ]);

  return {
    brigadas: brigadas.map(serializeBrigada),
    pagination: buildPagination({ ...pagination, totalItems }),
    sort: { sortBy: sorting.sortBy, sortDir: sorting.sortDir },
  };
}

async function listBrigadaOptions(query = {}) {
  const where = buildBrigadaWhere(query, { defaultActivo: true });
  const pagination = parsePagination(query, {
    defaultLimit: BRIGADA_OPTIONS_DEFAULT_LIMIT,
    maxLimit: BRIGADA_OPTIONS_MAX_LIMIT,
  });
  const [brigadas, totalItems] = await Promise.all([
    prisma.brigada.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: [{ numero: 'asc' }, { id: 'asc' }],
      select: BRIGADA_OPTION_SELECT,
    }),
    prisma.brigada.count({ where }),
  ]);

  return {
    brigadas,
    pagination: buildPagination({ ...pagination, totalItems }),
  };
}

async function getBrigadaById(id) {
  const brigadaId = parsePositiveId(id, 'id');
  const brigada = await prisma.brigada.findUnique({
    where: { id: brigadaId },
    include: BRIGADA_RELATIONS,
  });

  if (!brigada) throw new AppError('Brigada no encontrada', 404);
  return serializeBrigada(brigada);
}

async function createBrigada(input = {}) {
  const numero = validateText(input.numero, 'numero', { maxLength: 30 });
  const nombre = validateText(input.nombre, 'nombre', { maxLength: 150 });
  const tipoBrigadaId = parsePositiveId(input.tipoBrigadaId, 'tipoBrigadaId');
  const regionId = parsePositiveId(input.regionId, 'regionId');
  const departamentoId = parseOptionalPositiveId(input.departamentoId, 'departamentoId');
  const municipioId = parseOptionalPositiveId(input.municipioId, 'municipioId');

  await validateBrigadaCatalogs({ tipoBrigadaId, regionId, departamentoId, municipioId });
  await ensureUniqueActiveBrigada({
    numero,
    tipoBrigadaId,
    regionId,
    departamentoId,
    municipioId,
  });

  const brigada = await prisma.brigada.create({
    data: {
      numero,
      nombre,
      tipoBrigadaId,
      regionId,
      departamentoId,
      municipioId,
    },
    include: BRIGADA_RELATIONS,
  });

  return serializeBrigada(brigada);
}

async function updateBrigada(id, input = {}) {
  const brigadaId = parsePositiveId(id, 'id');
  const current = await prisma.brigada.findUnique({ where: { id: brigadaId } });

  if (!current) throw new AppError('Brigada no encontrada', 404);

  const data = {};
  if (input.numero !== undefined) {
    data.numero = validateText(input.numero, 'numero', { maxLength: 30 });
  }
  if (input.nombre !== undefined) {
    data.nombre = validateText(input.nombre, 'nombre', { maxLength: 150 });
  }
  if (input.tipoBrigadaId !== undefined) {
    data.tipoBrigadaId = parsePositiveId(input.tipoBrigadaId, 'tipoBrigadaId');
  }
  if (input.regionId !== undefined) {
    data.regionId = parsePositiveId(input.regionId, 'regionId');
  }
  if (input.departamentoId !== undefined) {
    data.departamentoId = parseOptionalPositiveId(input.departamentoId, 'departamentoId');
  }
  if (input.municipioId !== undefined) {
    data.municipioId = parseOptionalPositiveId(input.municipioId, 'municipioId');
  }
  if (input.activo !== undefined) {
    data.activo = parseOptionalBoolean(input.activo, 'activo');
  }

  if (Object.keys(data).length === 0) {
    throw new AppError('Debe enviar al menos un campo para actualizar', 400);
  }

  const next = {
    numero: data.numero ?? current.numero,
    tipoBrigadaId: data.tipoBrigadaId ?? current.tipoBrigadaId,
    regionId: data.regionId ?? current.regionId,
    departamentoId:
      data.departamentoId !== undefined ? data.departamentoId : current.departamentoId,
    municipioId: data.municipioId !== undefined ? data.municipioId : current.municipioId,
  };
  const nextActivo = data.activo ?? current.activo;

  await validateBrigadaCatalogs(next);
  if (nextActivo) {
    await ensureUniqueActiveBrigada({ ...next, excludeId: brigadaId });
  }

  const brigada = await prisma.brigada.update({
    where: { id: brigadaId },
    data,
    include: BRIGADA_RELATIONS,
  });

  return serializeBrigada(brigada);
}

async function deactivateBrigada(id) {
  const brigadaId = parsePositiveId(id, 'id');
  const existing = await prisma.brigada.findUnique({ where: { id: brigadaId } });

  if (!existing) throw new AppError('Brigada no encontrada', 404);

  const brigada = await prisma.brigada.update({
    where: { id: brigadaId },
    data: { activo: false },
    include: BRIGADA_RELATIONS,
  });

  return serializeBrigada(brigada);
}

async function listMiembrosBrigada(id, query = {}) {
  const brigadaId = parsePositiveId(id, 'id');
  const activo = parseOptionalBoolean(query.activo, 'activo');

  await getBrigadaForMembership(brigadaId);

  const miembros = await prisma.brigadaMiembro.findMany({
    where: {
      brigadaId,
      ...(activo !== undefined ? { activo } : {}),
    },
    orderBy: [
      { activo: 'desc' },
      { esLider: 'desc' },
      { usuario: { nombre: 'asc' } },
      { id: 'asc' },
    ],
    include: MEMBER_RELATIONS,
  });

  return miembros.map(serializeMiembro);
}

async function addMiembroBrigada(id, input = {}) {
  const brigadaId = parsePositiveId(id, 'id');
  const usuarioId = parsePositiveId(input.idUsuario, 'idUsuario');
  const cargoEnBrigada = validateOptionalText(input.cargoEnBrigada, 'cargoEnBrigada', {
    maxLength: 120,
  });
  const esLider = parseOptionalBoolean(input.esLider, 'esLider') ?? false;
  const fechaDesde =
    input.fechaDesde === undefined ? new Date() : parseDate(input.fechaDesde, 'fechaDesde');
  const fechaHasta = parseOptionalDate(input.fechaHasta, 'fechaHasta') ?? null;

  validateMembershipDates(fechaDesde, fechaHasta);

  await getBrigadaForMembership(brigadaId, { requireActive: true });
  await ensureUsuarioActivo(usuarioId);
  await ensureNoActiveDuplicateMember(brigadaId, usuarioId);

  if (esLider) {
    await ensureNoOtherActiveLeader(brigadaId);
  }

  const miembro = await prisma.brigadaMiembro.create({
    data: {
      brigadaId,
      usuarioId,
      cargoEnBrigada: cargoEnBrigada ?? null,
      esLider,
      fechaDesde,
      fechaHasta,
      activo: true,
    },
    include: MEMBER_RELATIONS,
  });

  return serializeMiembro(miembro);
}

async function updateMiembroBrigada(id, idMiembro, input = {}) {
  const brigadaId = parsePositiveId(id, 'id');
  const miembroId = parsePositiveId(idMiembro, 'idMiembro');

  await getBrigadaForMembership(brigadaId);

  const current = await prisma.brigadaMiembro.findFirst({
    where: { id: miembroId, brigadaId },
    include: MEMBER_RELATIONS,
  });

  if (!current) throw new AppError('Miembro de brigada no encontrado', 404);

  const data = {};
  if (input.cargoEnBrigada !== undefined) {
    data.cargoEnBrigada = validateOptionalText(input.cargoEnBrigada, 'cargoEnBrigada', {
      maxLength: 120,
    });
  }
  if (input.esLider !== undefined) {
    data.esLider = parseOptionalBoolean(input.esLider, 'esLider');
  }
  if (input.activo !== undefined) {
    data.activo = parseOptionalBoolean(input.activo, 'activo');
  }
  if (input.fechaDesde !== undefined) {
    data.fechaDesde = parseDate(input.fechaDesde, 'fechaDesde');
  }
  if (input.fechaHasta !== undefined) {
    data.fechaHasta = parseOptionalDate(input.fechaHasta, 'fechaHasta');
  }

  if (Object.keys(data).length === 0) {
    throw new AppError('Debe enviar al menos un campo para actualizar', 400);
  }

  const nextActivo = data.activo ?? current.activo;
  const nextEsLider = data.esLider ?? current.esLider;
  const nextFechaDesde = data.fechaDesde ?? current.fechaDesde;
  let nextFechaHasta = data.fechaHasta !== undefined ? data.fechaHasta : current.fechaHasta;

  if (data.activo === false && data.fechaHasta === undefined && !current.fechaHasta) {
    data.fechaHasta = new Date();
    nextFechaHasta = data.fechaHasta;
  }

  if (data.activo === true && data.fechaHasta === undefined) {
    data.fechaHasta = null;
    nextFechaHasta = null;
  }

  validateMembershipDates(nextFechaDesde, nextFechaHasta);

  if (nextActivo) {
    await ensureNoActiveDuplicateMember(brigadaId, current.usuarioId, miembroId);
  }

  if (nextActivo && nextEsLider) {
    await ensureNoOtherActiveLeader(brigadaId, miembroId);
  }

  const miembro = await prisma.brigadaMiembro.update({
    where: { id: miembroId },
    data,
    include: MEMBER_RELATIONS,
  });

  return serializeMiembro(miembro);
}

async function deactivateMiembroBrigada(id, idMiembro) {
  const brigadaId = parsePositiveId(id, 'id');
  const miembroId = parsePositiveId(idMiembro, 'idMiembro');

  await getBrigadaForMembership(brigadaId);

  const current = await prisma.brigadaMiembro.findFirst({
    where: { id: miembroId, brigadaId },
    select: { id: true, fechaHasta: true },
  });

  if (!current) throw new AppError('Miembro de brigada no encontrado', 404);

  const miembro = await prisma.brigadaMiembro.update({
    where: { id: miembroId },
    data: {
      activo: false,
      fechaHasta: current.fechaHasta ?? new Date(),
    },
    include: MEMBER_RELATIONS,
  });

  return serializeMiembro(miembro);
}

async function listMisBrigadas(usuarioId) {
  const brigadas = await prisma.brigadaMiembro.findMany({
    where: {
      usuarioId,
      activo: true,
      brigada: { activo: true },
    },
    orderBy: [
      { brigada: { region: { nombre: 'asc' } } },
      { brigada: { departamento: { nombre: 'asc' } } },
      { brigada: { municipio: { nombre: 'asc' } } },
      { brigada: { numero: 'asc' } },
    ],
    include: MY_BRIGADA_RELATIONS,
  });

  return brigadas.map(serializeMiBrigada);
}

module.exports = {
  listBrigadas,
  listBrigadaOptions,
  getBrigadaById,
  createBrigada,
  updateBrigada,
  deactivateBrigada,
  listMiembrosBrigada,
  addMiembroBrigada,
  updateMiembroBrigada,
  deactivateMiembroBrigada,
  listMisBrigadas,
};
