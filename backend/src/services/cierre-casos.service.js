const AppError = require('../utils/app-error');
const { changeCaseState } = require('./workflow.service');
const { createNotification, createNotifications } = require('./notificaciones.service');

function parseCaseId(value) {
  const parsed = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError('idCaso debe ser un entero positivo', 400);
  }
  return parsed;
}

function normalizeObservations(value, required = false) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new AppError('Las observaciones son obligatorias', 400);
    return null;
  }
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError('Las observaciones deben ser un texto válido', 400);
  }
  return value.trim();
}

async function closeCase(idCaso, usuarioId, input = {}) {
  const casoId = parseCaseId(idCaso);
  const observations = normalizeObservations(input.observaciones);
  const result = await changeCaseState({
    idCaso: casoId,
    idUsuario: usuarioId,
    allowedCurrentStates: ['En validación'],
    targetState: 'Cerrado',
    action: 'CIERRE_FORMAL_CASO',
    observation: observations,
    operation: async (tx, { currentCase }) => {
      const [totalActions, openActions] = await Promise.all([
        tx.accionCorrectiva.count({ where: { casiAccidenteId: casoId } }),
        tx.accionCorrectiva.count({
          where: {
            casiAccidenteId: casoId,
            estadoAccion: { nombre: { not: 'Cerrada' } },
          },
        }),
      ]);
      if (totalActions === 0) {
        throw new AppError('El caso no tiene acciones correctivas; use cerrar-sin-acciones', 400);
      }
      if (openActions > 0) {
        throw new AppError('Todas las acciones correctivas deben estar cerradas', 400);
      }

      await createNotification({
        idUsuario: currentCase.reportadoPorId,
        idCaso: casoId,
        tipo: 'CASO_CERRADO',
        titulo: `Caso ${currentCase.correlativo} cerrado`,
        mensaje: observations || 'El caso fue cerrado formalmente.',
        client: tx,
      });
    },
  });
  return result.caso;
}

async function closeCaseWithoutActions(idCaso, usuarioId, input = {}) {
  const casoId = parseCaseId(idCaso);
  const observations = normalizeObservations(input.observaciones);
  const result = await changeCaseState({
    idCaso: casoId,
    idUsuario: usuarioId,
    allowedCurrentStates: ['Aprobado'],
    targetState: 'Cerrado',
    action: 'CIERRE_CASO_SIN_ACCIONES',
    observation: observations,
    operation: async (tx, { currentCase }) => {
      const activeActions = await tx.accionCorrectiva.count({
        where: {
          casiAccidenteId: casoId,
          estadoAccion: { nombre: { not: 'Cerrada' } },
        },
      });
      if (activeActions > 0) {
        throw new AppError('El caso tiene acciones correctivas activas', 400);
      }

      await createNotification({
        idUsuario: currentCase.reportadoPorId,
        idCaso: casoId,
        tipo: 'CASO_CERRADO',
        titulo: `Caso ${currentCase.correlativo} cerrado`,
        mensaje: observations || 'El caso fue cerrado sin acciones correctivas.',
        client: tx,
      });
    },
  });
  return result.caso;
}

async function returnClosure(idCaso, usuarioId, input = {}) {
  const casoId = parseCaseId(idCaso);
  const observations = normalizeObservations(input.observaciones, true);
  const result = await changeCaseState({
    idCaso: casoId,
    idUsuario: usuarioId,
    allowedCurrentStates: ['En validación'],
    targetState: 'Con acciones',
    action: 'DEVOLUCION_CIERRE_CASO',
    observation: observations,
    operation: async (tx, { currentCase }) => {
      await tx.comentarioObservacion.create({
        data: {
          casiAccidenteId: casoId,
          usuarioId,
          comentario: observations,
        },
      });

      const responsibles = await tx.accionCorrectiva.findMany({
        where: { casiAccidenteId: casoId },
        select: { responsableId: true },
      });
      await createNotifications({
        userIds: responsibles.map((action) => action.responsableId),
        idCaso: casoId,
        tipo: 'CIERRE_DEVUELTO',
        titulo: `Cierre devuelto para ${currentCase.correlativo}`,
        mensaje: observations,
        client: tx,
      });
    },
  });
  return result.caso;
}

module.exports = { closeCase, closeCaseWithoutActions, returnClosure };
