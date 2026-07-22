const { Prisma } = require('@prisma/client');
const prisma = require('../config/prisma');
const AppError = require('../utils/app-error');
const { registrarBitacora } = require('./bitacora.service');
const {
  createNotification,
  notifyUsersByRoles,
} = require('./notificaciones.service');
const {
  parsePagination,
  parseSorting,
  buildPagination,
} = require('../utils/pagination');

const safeUserSelect = { id: true, nombre: true, correo: true };
const evidenceSelect = {
  id: true,
  nombreArchivo: true,
  nombreAlmacenado: true,
  rutaArchivo: true,
  tipoMime: true,
  tamanoBytes: true,
  descripcion: true,
  createdAt: true,
};
const actionInclude = {
  casiAccidente: {
    select: {
      id: true,
      correlativo: true,
      estadoCaso: { select: { id: true, nombre: true } },
    },
  },
  responsable: { select: safeUserSelect },
  estadoAccion: { select: { id: true, nombre: true } },
  evidencias: { orderBy: { createdAt: 'asc' }, select: evidenceSelect },
};
const actionListInclude = {
  casiAccidente: {
    select: {
      id: true,
      correlativo: true,
      estadoCaso: { select: { id: true, nombre: true } },
    },
  },
  responsable: { select: safeUserSelect },
  estadoAccion: { select: { id: true, nombre: true } },
};
const ACTION_SORT_FIELDS = {
  id: 'id',
  fechaCompromiso: 'fechaCompromiso',
  fechaCierre: 'fechaCierre',
  porcentajeAvance: 'porcentajeAvance',
  createdAt: 'createdAt',
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

function requiredText(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`${field} es obligatorio`, 400);
  }
  return value.trim();
}

function optionalText(value, field, required = false) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new AppError(`${field} es obligatorio`, 400);
    return null;
  }
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`${field} debe ser un texto válido`, 400);
  }
  return value.trim();
}

function parseOptionalBoolean(value, field) {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new AppError(`${field} debe ser true o false`, 400);
}

function catalogFilter(value) {
  if (/^\d+$/.test(String(value))) return { id: Number(value) };
  return { nombre: { equals: String(value).trim(), mode: 'insensitive' } };
}

function serializeAction(action) {
  return {
    id: action.id,
    idCaso: action.casiAccidenteId,
    caso: action.casiAccidente,
    titulo: action.titulo,
    descripcion: action.descripcion,
    responsable: action.responsable,
    estado: action.estadoAccion,
    fechaCompromiso: action.fechaCompromiso,
    fechaCierre: action.fechaCierre,
    porcentajeAvance: action.porcentajeAvance,
    observaciones: action.observacion,
    evidencias: action.evidencias,
    createdAt: action.createdAt,
    updatedAt: action.updatedAt,
  };
}

async function withSerializableRetry(operation) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (error.code !== 'P2034' || attempt === 3) throw error;
    }
  }
  throw new AppError('No fue posible completar la operación', 500);
}

async function createAction(input = {}, usuarioId) {
  const casoId = parsePositiveId(input.idCaso, 'idCaso');
  const responsableId = parsePositiveId(input.idResponsable, 'idResponsable');
  const descripcion = requiredText(input.descripcion, 'descripcion');
  const fechaCompromiso = parseDate(input.fechaCompromiso, 'fechaCompromiso');
  const titulo = descripcion.slice(0, 200);

  const action = await withSerializableRetry(async (tx) => {
    const [caso, responsable, pendingState] = await Promise.all([
      tx.casiAccidente.findUnique({
        where: { id: casoId },
        include: { estadoCaso: { select: { id: true, nombre: true } } },
      }),
      tx.usuario.findFirst({
        where: { id: responsableId, activo: true },
        select: { id: true },
      }),
      tx.estadoAccion.findFirst({
        where: { nombre: 'Pendiente', activo: true },
        select: { id: true },
      }),
    ]);

    if (!caso) throw new AppError('Caso no encontrado', 404);
    if (!['Aprobado', 'Con acciones'].includes(caso.estadoCaso.nombre)) {
      throw new AppError(
        `No se pueden crear acciones cuando el caso está en estado ${caso.estadoCaso.nombre}`,
        400,
      );
    }
    if (!responsable) throw new AppError('Usuario responsable no encontrado o inactivo', 404);
    if (!pendingState) throw new AppError('El estado Pendiente no está configurado', 500);

    const created = await tx.accionCorrectiva.create({
      data: {
        casiAccidenteId: casoId,
        responsableId,
        estadoAccionId: pendingState.id,
        titulo,
        descripcion,
        fechaCompromiso,
      },
      select: { id: true },
    });

    let newCaseStateId = caso.estadoCaso.id;
    if (caso.estadoCaso.nombre === 'Aprobado') {
      const withActionsState = await tx.estadoCaso.findFirst({
        where: { nombre: 'Con acciones', activo: true },
        select: { id: true },
      });
      if (!withActionsState) throw new AppError('El estado Con acciones no está configurado', 500);

      await tx.casiAccidente.update({
        where: { id: casoId },
        data: { estadoCasoId: withActionsState.id },
      });
      newCaseStateId = withActionsState.id;
    }

    await registrarBitacora({
      idCaso: casoId,
      idUsuario: usuarioId,
      accion: 'CREACION_ACCION_CORRECTIVA',
      estadoAnterior: caso.estadoCaso.id,
      estadoNuevo: newCaseStateId,
      observacion: `Se creó la acción correctiva #${created.id} en estado Pendiente`,
      client: tx,
    });

    await createNotification({
      idUsuario: responsableId,
      idCaso: casoId,
      tipo: 'ACCION_ASIGNADA',
      titulo: `Nueva acción correctiva en ${caso.correlativo}`,
      mensaje: descripcion,
      client: tx,
    });

    return tx.accionCorrectiva.findUnique({
      where: { id: created.id },
      include: actionInclude,
    });
  });

  return serializeAction(action);
}

async function listByCase(idCaso) {
  const casoId = parsePositiveId(idCaso, 'idCaso');
  const exists = await prisma.casiAccidente.findUnique({
    where: { id: casoId },
    select: { id: true },
  });
  if (!exists) throw new AppError('Caso no encontrado', 404);

  const actions = await prisma.accionCorrectiva.findMany({
    where: { casiAccidenteId: casoId },
    orderBy: [{ fechaCompromiso: 'asc' }, { id: 'asc' }],
    include: actionInclude,
  });
  return actions.map(serializeAction);
}

async function listActions(query = {}) {
  const pagination = parsePagination(query);
  const sorting = parseSorting(query, ACTION_SORT_FIELDS, {
    sortBy: 'createdAt',
    sortDir: 'desc',
  });
  const where = {};

  if (query.estado) where.estadoAccion = catalogFilter(query.estado);

  if (query.responsable) {
    if (/^\d+$/.test(String(query.responsable))) {
      where.responsableId = parsePositiveId(query.responsable, 'responsable');
    } else {
      const responsable = requiredText(query.responsable, 'responsable');
      where.responsable = {
        OR: [
          { nombre: { contains: responsable, mode: 'insensitive' } },
          { correo: { contains: responsable, mode: 'insensitive' } },
        ],
      };
    }
  }

  if (query.caso) {
    if (/^\d+$/.test(String(query.caso))) {
      where.casiAccidenteId = parsePositiveId(query.caso, 'caso');
    } else {
      where.casiAccidente = {
        correlativo: { equals: requiredText(query.caso, 'caso'), mode: 'insensitive' },
      };
    }
  }

  if (query.fechaDesde || query.fechaHasta) {
    where.fechaCompromiso = {};
    if (query.fechaDesde) {
      where.fechaCompromiso.gte = parseDate(query.fechaDesde, 'fechaDesde');
    }
    if (query.fechaHasta) {
      where.fechaCompromiso.lte = parseDate(query.fechaHasta, 'fechaHasta');
    }
    if (
      where.fechaCompromiso.gte &&
      where.fechaCompromiso.lte &&
      where.fechaCompromiso.gte > where.fechaCompromiso.lte
    ) {
      throw new AppError('fechaDesde no puede ser mayor que fechaHasta', 400);
    }
  }

  const vencidas = parseOptionalBoolean(query.vencidas, 'vencidas');
  if (vencidas === true) {
    where.AND = [
      { fechaCompromiso: { lt: new Date() } },
      { estadoAccion: { nombre: { not: 'Cerrada' } } },
    ];
  } else if (vencidas === false) {
    where.OR = [
      { fechaCompromiso: { gte: new Date() } },
      { estadoAccion: { nombre: 'Cerrada' } },
    ];
  }

  const [acciones, totalItems] = await Promise.all([
    prisma.accionCorrectiva.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: sorting.orderBy,
      include: actionListInclude,
    }),
    prisma.accionCorrectiva.count({ where }),
  ]);

  return {
    acciones: acciones.map(serializeAction),
    pagination: buildPagination({ ...pagination, totalItems }),
    sort: { sortBy: sorting.sortBy, sortDir: sorting.sortDir },
  };
}

async function getById(id) {
  const actionId = parsePositiveId(id, 'id');
  const action = await prisma.accionCorrectiva.findUnique({
    where: { id: actionId },
    include: actionInclude,
  });
  if (!action) throw new AppError('Acción correctiva no encontrada', 404);
  return serializeAction(action);
}

async function updateAction(id, input = {}, usuarioId) {
  const actionId = parsePositiveId(id, 'id');
  const data = {};
  const changedFields = [];

  if (input.descripcion !== undefined) {
    data.descripcion = requiredText(input.descripcion, 'descripcion');
    data.titulo = data.descripcion.slice(0, 200);
    changedFields.push('descripción');
  }
  if (input.idResponsable !== undefined) {
    data.responsableId = parsePositiveId(input.idResponsable, 'idResponsable');
    changedFields.push('responsable');
  }
  if (input.fechaCompromiso !== undefined) {
    data.fechaCompromiso = parseDate(input.fechaCompromiso, 'fechaCompromiso');
    changedFields.push('fecha de compromiso');
  }
  if (input.observaciones !== undefined) {
    data.observacion = optionalText(input.observaciones, 'observaciones');
    changedFields.push('observaciones');
  }
  if (changedFields.length === 0) {
    throw new AppError('Debe enviar al menos un campo permitido para actualizar', 400);
  }

  const action = await withSerializableRetry(async (tx) => {
    const current = await tx.accionCorrectiva.findUnique({
      where: { id: actionId },
      include: {
        estadoAccion: { select: { nombre: true } },
        casiAccidente: { select: { id: true, estadoCasoId: true } },
      },
    });
    if (!current) throw new AppError('Acción correctiva no encontrada', 404);
    if (current.estadoAccion.nombre === 'Cerrada') {
      throw new AppError('No se puede editar una acción cerrada', 400);
    }

    if (data.responsableId) {
      const responsible = await tx.usuario.findFirst({
        where: { id: data.responsableId, activo: true },
        select: { id: true },
      });
      if (!responsible) throw new AppError('Usuario responsable no encontrado o inactivo', 404);
    }

    const updated = await tx.accionCorrectiva.update({
      where: { id: actionId },
      data,
      include: actionInclude,
    });
    await registrarBitacora({
      idCaso: current.casiAccidente.id,
      idUsuario: usuarioId,
      accion: 'ACTUALIZACION_ACCION_CORRECTIVA',
      estadoAnterior: current.casiAccidente.estadoCasoId,
      estadoNuevo: current.casiAccidente.estadoCasoId,
      observacion: `Acción #${actionId}. Campos actualizados: ${changedFields.join(', ')}`,
      client: tx,
    });

    return updated;
  });

  return serializeAction(action);
}

async function changeActionState({
  id,
  usuarioId,
  allowedStates,
  targetState,
  observations,
  observationsRequired = false,
  evidenceRequired = false,
}) {
  const actionId = parsePositiveId(id, 'id');
  const normalizedObservations = optionalText(
    observations,
    'observaciones',
    observationsRequired,
  );

  return withSerializableRetry(async (tx) => {
    const current = await tx.accionCorrectiva.findUnique({
      where: { id: actionId },
      include: {
        estadoAccion: { select: { id: true, nombre: true } },
        casiAccidente: {
          select: {
            id: true,
            estadoCaso: { select: { id: true, nombre: true } },
          },
        },
        _count: { select: { evidencias: true } },
      },
    });
    if (!current) throw new AppError('Acción correctiva no encontrada', 404);
    if (!allowedStates.includes(current.estadoAccion.nombre)) {
      throw new AppError(
        `No se puede realizar esta operación cuando la acción está en estado ${current.estadoAccion.nombre}`,
        400,
      );
    }
    if (evidenceRequired && current._count.evidencias === 0) {
      throw new AppError('La acción debe tener al menos una evidencia asociada', 400);
    }

    const nextState = await tx.estadoAccion.findFirst({
      where: { nombre: targetState, activo: true },
      select: { id: true, nombre: true },
    });
    if (!nextState) throw new AppError(`El estado ${targetState} no está configurado`, 500);

    await tx.accionCorrectiva.update({
      where: { id: actionId },
      data: {
        estadoAccionId: nextState.id,
        ...(targetState === 'Cerrada' ? { fechaCierre: new Date() } : {}),
        ...(targetState === 'Devuelta' ? { fechaCierre: null } : {}),
      },
    });

    if (targetState === 'Devuelta') {
      await tx.comentarioObservacion.create({
        data: {
          casiAccidenteId: current.casiAccidente.id,
          usuarioId,
          comentario: normalizedObservations,
        },
      });
    }

    await registrarBitacora({
      idCaso: current.casiAccidente.id,
      idUsuario: usuarioId,
      accion: `ACCION_CORRECTIVA_${targetState.toUpperCase().replace(/\s+/g, '_')}`,
      estadoAnterior: current.casiAccidente.estadoCaso.id,
      estadoNuevo: current.casiAccidente.estadoCaso.id,
      observacion: `Acción #${actionId}: ${current.estadoAccion.nombre} → ${targetState}${
        normalizedObservations ? `. ${normalizedObservations}` : ''
      }`,
      client: tx,
    });

    if (targetState === 'Devuelta') {
      await createNotification({
        idUsuario: current.responsableId,
        idCaso: current.casiAccidente.id,
        tipo: 'ACCION_DEVUELTA',
        titulo: `Acción correctiva #${actionId} devuelta`,
        mensaje: normalizedObservations,
        client: tx,
      });
    }

    if (targetState === 'En validación') {
      await notifyUsersByRoles({
        roleNames: ['SYMA', 'Gestión y Control SYMA'],
        idCaso: current.casiAccidente.id,
        tipo: 'ACCION_EN_VALIDACION',
        titulo: `Acción correctiva #${actionId} pendiente de validación`,
        mensaje: normalizedObservations || 'La acción fue enviada a validación.',
        client: tx,
      });
    }

    let updatedCase = null;
    if (targetState === 'Cerrada') {
      const openActions = await tx.accionCorrectiva.count({
        where: {
          casiAccidenteId: current.casiAccidente.id,
          estadoAccion: { nombre: { not: 'Cerrada' } },
        },
      });

      if (openActions === 0 && current.casiAccidente.estadoCaso.nombre !== 'Cerrado') {
        const validationState = await tx.estadoCaso.findFirst({
          where: { nombre: 'En validación', activo: true },
          select: { id: true, nombre: true },
        });
        if (!validationState) {
          throw new AppError('El estado En validación no está configurado', 500);
        }

        updatedCase = await tx.casiAccidente.update({
          where: { id: current.casiAccidente.id },
          data: { estadoCasoId: validationState.id },
          select: {
            id: true,
            correlativo: true,
            estadoCaso: { select: { id: true, nombre: true } },
          },
        });
        await registrarBitacora({
          idCaso: current.casiAccidente.id,
          idUsuario: usuarioId,
          accion: 'ACCIONES_CORRECTIVAS_COMPLETADAS',
          estadoAnterior: current.casiAccidente.estadoCaso.id,
          estadoNuevo: validationState.id,
          observacion: 'Todas las acciones correctivas fueron cerradas',
          client: tx,
        });
      }
    }

    const updatedAction = await tx.accionCorrectiva.findUnique({
      where: { id: actionId },
      include: actionInclude,
    });
    return { accion: serializeAction(updatedAction), caso: updatedCase };
  });
}

function startAction(id, usuarioId) {
  return changeActionState({
    id,
    usuarioId,
    allowedStates: ['Pendiente', 'Devuelta'],
    targetState: 'En proceso',
  });
}

function sendToValidation(id, usuarioId, input = {}) {
  return changeActionState({
    id,
    usuarioId,
    allowedStates: ['En proceso', 'Devuelta'],
    targetState: 'En validación',
    observations: input.observaciones,
    evidenceRequired: true,
  });
}

function closeAction(id, usuarioId, input = {}) {
  return changeActionState({
    id,
    usuarioId,
    allowedStates: ['En validación'],
    targetState: 'Cerrada',
    observations: input.observaciones,
  });
}

function returnAction(id, usuarioId, input = {}) {
  return changeActionState({
    id,
    usuarioId,
    allowedStates: ['En validación'],
    targetState: 'Devuelta',
    observations: input.observaciones,
    observationsRequired: true,
  });
}

module.exports = {
  createAction,
  listActions,
  listByCase,
  getById,
  updateAction,
  startAction,
  sendToValidation,
  closeAction,
  returnAction,
};
