const { Prisma } = require('@prisma/client');
const prisma = require('../config/prisma');
const AppError = require('../utils/app-error');
const { registrarBitacora } = require('./bitacora.service');

const caseInclude = {
  area: { select: { id: true, nombre: true } },
  proceso: { select: { id: true, nombre: true } },
  tipoEvento: { select: { id: true, nombre: true } },
  criticidad: { select: { id: true, nombre: true, color: true } },
  estadoCaso: { select: { id: true, nombre: true } },
  reportadoPor: { select: { id: true, nombre: true, correo: true } },
};

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

async function changeCaseState({
  idCaso,
  idUsuario,
  allowedCurrentStates,
  targetState,
  action,
  observation = null,
  operation,
}) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const currentCase = await tx.casiAccidente.findUnique({
            where: { id: idCaso },
            include: { estadoCaso: { select: { id: true, nombre: true } } },
          });

          if (!currentCase) throw new AppError('Caso no encontrado', 404);

          if (!allowedCurrentStates.includes(currentCase.estadoCaso.nombre)) {
            throw new AppError(
              `No se puede realizar esta operación cuando el caso está en estado ${currentCase.estadoCaso.nombre}`,
              400,
            );
          }

          const nextState = await tx.estadoCaso.findFirst({
            where: { nombre: targetState, activo: true },
            select: { id: true, nombre: true },
          });

          if (!nextState) {
            throw new AppError(`El estado ${targetState} no está configurado o está inactivo`, 500);
          }

          const operationResult = operation
            ? await operation(tx, { currentCase, nextState })
            : null;

          const updatedCase = await tx.casiAccidente.update({
            where: { id: idCaso },
            data: { estadoCasoId: nextState.id },
            include: caseInclude,
          });

          await registrarBitacora({
            idCaso,
            idUsuario,
            accion: action,
            estadoAnterior: currentCase.estadoCaso.id,
            estadoNuevo: nextState.id,
            observacion: observation,
            client: tx,
          });

          return {
            caso: serializeCase(updatedCase),
            operationResult,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (error.code !== 'P2034' || attempt === 3) throw error;
    }
  }

  throw new AppError('No fue posible actualizar el estado del caso', 500);
}

module.exports = { changeCaseState };
