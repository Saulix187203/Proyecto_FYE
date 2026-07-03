const prisma = require('../config/prisma');
const AppError = require('../utils/app-error');
const { changeCaseState } = require('./workflow.service');

function parseCaseId(value) {
  const parsed = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError('idCaso debe ser un entero positivo', 400);
  }
  return parsed;
}

function normalizeObservations(value, required) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new AppError('Las observaciones son obligatorias', 400);
    return null;
  }

  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError('Las observaciones deben ser un texto válido', 400);
  }

  return value.trim();
}

function serializeValidation(validation) {
  return {
    id: validation.id,
    idCaso: validation.casiAccidenteId,
    resultado: validation.resultado,
    procedente: validation.procedente,
    observaciones: validation.observacion,
    fecha: validation.fechaValidacion,
    usuarioValidador: validation.validador,
    createdAt: validation.createdAt,
    updatedAt: validation.updatedAt,
  };
}

async function startReview(idCaso, usuarioId) {
  const casoId = parseCaseId(idCaso);
  const result = await changeCaseState({
    idCaso: casoId,
    idUsuario: usuarioId,
    allowedCurrentStates: ['Reportado', 'Devuelto'],
    targetState: 'En revisión',
    action: 'INICIO_REVISION_PROCEDENCIA',
    observation: 'Se inició la revisión de procedencia del caso',
  });

  return result.caso;
}

async function resolveValidation({ idCaso, usuarioId, result, observations, required }) {
  const casoId = parseCaseId(idCaso);
  const normalizedObservations = normalizeObservations(observations, required);
  const actionByResult = {
    Aprobado: 'APROBACION_PROCEDENCIA',
    Devuelto: 'DEVOLUCION_PROCEDENCIA',
    Rechazado: 'RECHAZO_PROCEDENCIA',
  };

  const transition = await changeCaseState({
    idCaso: casoId,
    idUsuario: usuarioId,
    allowedCurrentStates: ['En revisión'],
    targetState: result,
    action: actionByResult[result],
    observation: normalizedObservations,
    operation: async (tx) => {
      const validation = await tx.validacionProcedencia.create({
        data: {
          casiAccidenteId: casoId,
          validadorId: usuarioId,
          procedente: result === 'Aprobado',
          resultado: result,
          observacion: normalizedObservations,
        },
        include: {
          validador: { select: { id: true, nombre: true, correo: true } },
        },
      });

      if (result === 'Devuelto') {
        await tx.comentarioObservacion.create({
          data: {
            casiAccidenteId: casoId,
            usuarioId,
            comentario: normalizedObservations,
          },
        });
      }

      return validation;
    },
  });

  return {
    validacion: serializeValidation(transition.operationResult),
    caso: transition.caso,
  };
}

function approve(idCaso, usuarioId, input = {}) {
  return resolveValidation({
    idCaso,
    usuarioId,
    result: 'Aprobado',
    observations: input.observaciones,
    required: false,
  });
}

function returnCase(idCaso, usuarioId, input = {}) {
  return resolveValidation({
    idCaso,
    usuarioId,
    result: 'Devuelto',
    observations: input.observaciones,
    required: true,
  });
}

function reject(idCaso, usuarioId, input = {}) {
  return resolveValidation({
    idCaso,
    usuarioId,
    result: 'Rechazado',
    observations: input.observaciones,
    required: true,
  });
}

async function listByCase(idCaso) {
  const casoId = parseCaseId(idCaso);
  const caso = await prisma.casiAccidente.findUnique({
    where: { id: casoId },
    select: { id: true },
  });

  if (!caso) throw new AppError('Caso no encontrado', 404);

  const validations = await prisma.validacionProcedencia.findMany({
    where: { casiAccidenteId: casoId },
    orderBy: [{ fechaValidacion: 'desc' }, { id: 'desc' }],
    include: {
      validador: { select: { id: true, nombre: true, correo: true } },
    },
  });

  return validations.map(serializeValidation);
}

module.exports = { startReview, approve, returnCase, reject, listByCase };
