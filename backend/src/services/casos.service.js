const { Prisma } = require('@prisma/client');
const prisma = require('../config/prisma');
const AppError = require('../utils/app-error');
const { generarCorrelativo } = require('../utils/correlativo');
const { registrarBitacora } = require('./bitacora.service');

const caseRelations = {
  area: { select: { id: true, nombre: true } },
  proceso: { select: { id: true, nombre: true } },
  tipoEvento: { select: { id: true, nombre: true } },
  criticidad: { select: { id: true, nombre: true, color: true } },
  estadoCaso: { select: { id: true, nombre: true } },
  reportadoPor: { select: { id: true, nombre: true, correo: true } },
};

function parsePositiveId(value, field) {
  const parsed = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${field} debe ser un entero positivo`, 400);
  }

  return parsed;
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

function serializeCase(caso) {
  return {
    id: caso.id,
    correlativo: caso.correlativo,
    titulo: caso.titulo,
    descripcion: caso.descripcion,
    fechaEvento: caso.fechaHoraEvento,
    fechaReporte: caso.fechaReporte,
    lugar: caso.ubicacion,
    area: caso.area,
    proceso: caso.proceso,
    tipoEvento: caso.tipoEvento,
    criticidad: caso.criticidad,
    estado: caso.estadoCaso,
    usuarioReporta: caso.reportadoPor,
    createdAt: caso.createdAt,
    updatedAt: caso.updatedAt,
  };
}

async function validateCatalogs({ idArea, idProceso, idTipoEvento, idCriticidad }) {
  const [area, proceso, tipoEvento, criticidad] = await Promise.all([
    prisma.area.findFirst({ where: { id: idArea, activo: true }, select: { id: true } }),
    prisma.proceso.findFirst({
      where: { id: idProceso, activo: true },
      select: { id: true, areaId: true },
    }),
    prisma.tipoEvento.findFirst({
      where: { id: idTipoEvento, activo: true },
      select: { id: true },
    }),
    prisma.criticidad.findFirst({
      where: { id: idCriticidad, activo: true },
      select: { id: true },
    }),
  ]);

  if (!area) throw new AppError('Área no encontrada o inactiva', 404);
  if (!proceso) throw new AppError('Proceso no encontrado o inactivo', 404);
  if (!tipoEvento) throw new AppError('Tipo de evento no encontrado o inactivo', 404);
  if (!criticidad) throw new AppError('Criticidad no encontrada o inactiva', 404);
  if (proceso.areaId !== area.id) {
    throw new AppError('El proceso seleccionado no pertenece al área indicada', 400);
  }
}

async function createCase(input = {}, usuarioId) {
  const idArea = parsePositiveId(input.idArea, 'idArea');
  const idProceso = parsePositiveId(input.idProceso, 'idProceso');
  const idTipoEvento = parsePositiveId(input.idTipoEvento, 'idTipoEvento');
  const idCriticidad = parsePositiveId(input.idCriticidad, 'idCriticidad');
  const fechaEvento = parseDate(input.fechaEvento, 'fechaEvento');
  const lugar = validateText(input.lugar, 'lugar', { maxLength: 255 });
  const descripcion = validateText(input.descripcion, 'descripcion');
  const titulo =
    validateText(input.titulo, 'titulo', { maxLength: 200, required: false }) ||
    descripcion.slice(0, 200);

  await validateCatalogs({ idArea, idProceso, idTipoEvento, idCriticidad });

  const estadoInicial = await prisma.estadoCaso.findFirst({
    where: { nombre: 'Reportado', activo: true },
    select: { id: true },
  });

  if (!estadoInicial) {
    throw new AppError('No se encontró el estado inicial Reportado', 500);
  }

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const caso = await prisma.$transaction(
        async (tx) => {
          const correlativo = await generarCorrelativo(tx);
          const created = await tx.casiAccidente.create({
            data: {
              correlativo,
              titulo,
              descripcion,
              fechaHoraEvento: fechaEvento,
              ubicacion: lugar,
              areaId: idArea,
              procesoId: idProceso,
              tipoEventoId: idTipoEvento,
              criticidadId: idCriticidad,
              estadoCasoId: estadoInicial.id,
              reportadoPorId: usuarioId,
            },
            include: caseRelations,
          });

          await registrarBitacora({
            idCaso: created.id,
            idUsuario: usuarioId,
            accion: 'CREACION_CASO',
            estadoNuevo: estadoInicial.id,
            observacion: `Caso ${correlativo} creado en estado Reportado`,
            client: tx,
          });

          return created;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      return serializeCase(caso);
    } catch (error) {
      const isRetryable = error.code === 'P2034' || error.code === 'P2002';
      if (!isRetryable || attempt === 3) throw error;
    }
  }

  throw new AppError('No fue posible generar un correlativo único', 500);
}

function catalogFilter(value) {
  if (/^\d+$/.test(String(value))) return { id: Number(value) };
  return { nombre: { equals: String(value).trim(), mode: 'insensitive' } };
}

async function listCases(query = {}) {
  const where = {};

  if (query.estado) where.estadoCaso = catalogFilter(query.estado);
  if (query.area) where.area = catalogFilter(query.area);
  if (query.criticidad) where.criticidad = catalogFilter(query.criticidad);

  if (query.fechaDesde || query.fechaHasta) {
    where.fechaHoraEvento = {};
    if (query.fechaDesde) where.fechaHoraEvento.gte = parseDate(query.fechaDesde, 'fechaDesde');
    if (query.fechaHasta) where.fechaHoraEvento.lte = parseDate(query.fechaHasta, 'fechaHasta');
  }

  if (query.texto) {
    const texto = validateText(query.texto, 'texto', { maxLength: 200 });
    where.OR = [
      { correlativo: { contains: texto, mode: 'insensitive' } },
      { titulo: { contains: texto, mode: 'insensitive' } },
      { descripcion: { contains: texto, mode: 'insensitive' } },
      { ubicacion: { contains: texto, mode: 'insensitive' } },
    ];
  }

  const casos = await prisma.casiAccidente.findMany({
    where,
    orderBy: [{ fechaReporte: 'desc' }, { id: 'desc' }],
    include: caseRelations,
  });

  return casos.map((caso) => ({
    id: caso.id,
    correlativo: caso.correlativo,
    fechaEvento: caso.fechaHoraEvento,
    fechaReporte: caso.fechaReporte,
    area: caso.area,
    proceso: caso.proceso,
    tipoEvento: caso.tipoEvento,
    criticidad: caso.criticidad,
    estado: caso.estadoCaso,
    usuarioReporta: caso.reportadoPor,
    descripcionCorta:
      caso.descripcion.length > 160 ? `${caso.descripcion.slice(0, 157)}...` : caso.descripcion,
  }));
}

async function getCaseById(id) {
  const casoId = parsePositiveId(id, 'id');
  const caso = await prisma.casiAccidente.findUnique({
    where: { id: casoId },
    include: caseRelations,
  });

  if (!caso) throw new AppError('Caso no encontrado', 404);
  return serializeCase(caso);
}

async function updateCase(id, input = {}, usuarioId) {
  const casoId = parsePositiveId(id, 'id');

  if (
    input.estado !== undefined ||
    input.idEstado !== undefined ||
    input.idEstadoCaso !== undefined ||
    input.estadoCasoId !== undefined
  ) {
    throw new AppError('El estado del caso no puede modificarse desde este endpoint', 400);
  }

  const current = await prisma.casiAccidente.findUnique({
    where: { id: casoId },
    select: {
      id: true,
      areaId: true,
      procesoId: true,
      tipoEventoId: true,
      criticidadId: true,
      estadoCasoId: true,
    },
  });

  if (!current) throw new AppError('Caso no encontrado', 404);

  const data = {};
  const changedFields = [];

  if (input.idArea !== undefined) {
    data.areaId = parsePositiveId(input.idArea, 'idArea');
    changedFields.push('área');
  }
  if (input.idProceso !== undefined) {
    data.procesoId = parsePositiveId(input.idProceso, 'idProceso');
    changedFields.push('proceso');
  }
  if (input.idTipoEvento !== undefined) {
    data.tipoEventoId = parsePositiveId(input.idTipoEvento, 'idTipoEvento');
    changedFields.push('tipo de evento');
  }
  if (input.idCriticidad !== undefined) {
    data.criticidadId = parsePositiveId(input.idCriticidad, 'idCriticidad');
    changedFields.push('criticidad');
  }
  if (input.fechaEvento !== undefined) {
    data.fechaHoraEvento = parseDate(input.fechaEvento, 'fechaEvento');
    changedFields.push('fecha del evento');
  }
  if (input.lugar !== undefined) {
    data.ubicacion = validateText(input.lugar, 'lugar', { maxLength: 255 });
    changedFields.push('lugar');
  }
  if (input.descripcion !== undefined) {
    data.descripcion = validateText(input.descripcion, 'descripcion');
    changedFields.push('descripción');
  }

  if (changedFields.length === 0) {
    throw new AppError('Debe enviar al menos un campo permitido para actualizar', 400);
  }

  await validateCatalogs({
    idArea: data.areaId ?? current.areaId,
    idProceso: data.procesoId ?? current.procesoId,
    idTipoEvento: data.tipoEventoId ?? current.tipoEventoId,
    idCriticidad: data.criticidadId ?? current.criticidadId,
  });

  const caso = await prisma.$transaction(async (tx) => {
    const updated = await tx.casiAccidente.update({
      where: { id: casoId },
      data,
      include: caseRelations,
    });

    await registrarBitacora({
      idCaso: casoId,
      idUsuario: usuarioId,
      accion: 'ACTUALIZACION_DATOS_CASO',
      estadoAnterior: current.estadoCasoId,
      estadoNuevo: current.estadoCasoId,
      observacion: `Campos actualizados: ${changedFields.join(', ')}`,
      client: tx,
    });

    return updated;
  });

  return serializeCase(caso);
}

module.exports = { createCase, listCases, getCaseById, updateCase };
