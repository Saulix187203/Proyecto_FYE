const prisma = require('../config/prisma');
const AppError = require('../utils/app-error');

const safeUserSelect = { id: true, nombre: true, correo: true };

function parseCaseId(value) {
  const parsed = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError('idCaso debe ser un entero positivo', 400);
  }
  return parsed;
}

async function getCaseFile(idCaso) {
  const casoId = parseCaseId(idCaso);
  const caso = await prisma.casiAccidente.findUnique({
    where: { id: casoId },
    include: {
      area: { select: { id: true, nombre: true } },
      proceso: { select: { id: true, nombre: true } },
      tipoEvento: { select: { id: true, nombre: true } },
      criticidad: { select: { id: true, nombre: true, color: true } },
      estadoCaso: { select: { id: true, nombre: true } },
      reportadoPor: { select: safeUserSelect },
      reporteInicial: true,
      validacionesProcedencia: {
        orderBy: { fechaValidacion: 'asc' },
        include: { validador: { select: safeUserSelect } },
      },
      divulgaciones: { orderBy: { fechaDivulgacion: 'asc' } },
      accionesCorrectivas: {
        orderBy: { createdAt: 'asc' },
        include: {
          responsable: { select: safeUserSelect },
          estadoAccion: { select: { id: true, nombre: true } },
        },
      },
      evidencias: {
        orderBy: { createdAt: 'asc' },
        include: {
          subidoPor: { select: safeUserSelect },
          accionCorrectiva: { select: { id: true, titulo: true } },
        },
      },
      comentariosObservacion: {
        orderBy: { createdAt: 'asc' },
        include: { usuario: { select: safeUserSelect } },
      },
      bitacora: {
        orderBy: { fecha: 'asc' },
        include: {
          usuario: { select: safeUserSelect },
          estadoAnterior: { select: { id: true, nombre: true } },
          estadoNuevo: { select: { id: true, nombre: true } },
        },
      },
      notificaciones: {
        orderBy: { createdAt: 'asc' },
        include: { usuario: { select: safeUserSelect } },
      },
    },
  });

  if (!caso) throw new AppError('Expediente no encontrado', 404);

  return {
    datosGenerales: {
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
    },
    reporteInicial: caso.reporteInicial,
    validacionesProcedencia: caso.validacionesProcedencia,
    divulgaciones: caso.divulgaciones,
    accionesCorrectivas: caso.accionesCorrectivas,
    evidencias: caso.evidencias,
    comentariosObservacion: caso.comentariosObservacion,
    bitacora: caso.bitacora,
    notificaciones: caso.notificaciones,
  };
}

module.exports = { getCaseFile };
