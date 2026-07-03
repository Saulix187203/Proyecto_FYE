const prisma = require('../config/prisma');
const AppError = require('../utils/app-error');
const { registrarBitacora } = require('./bitacora.service');

function parsePositiveId(value, field) {
  const parsed = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${field} debe ser un entero positivo`, 400);
  }
  return parsed;
}

function optionalText(value, field) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`${field} debe ser un texto no vacío`, 400);
  }
  return value.trim();
}

async function saveInitialReport(input = {}, usuarioId) {
  const casoId = parsePositiveId(input.idCaso, 'idCaso');
  const fields = {
    descripcionDetallada: optionalText(input.descripcionDetallada, 'descripcionDetallada'),
    condicionDetectada: optionalText(input.condicionDetectada, 'condicionDetectada'),
    accionInmediata: optionalText(input.accionInmediata, 'accionInmediata'),
    observaciones: optionalText(input.observaciones, 'observaciones'),
  };
  const data = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  );

  if (Object.keys(data).length === 0) {
    throw new AppError('Debe enviar al menos un campo del reporte inicial', 400);
  }

  const caso = await prisma.casiAccidente.findUnique({
    where: { id: casoId },
    select: { id: true, estadoCasoId: true },
  });

  if (!caso) throw new AppError('Caso no encontrado', 404);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.reporteInicial.findUnique({
      where: { casiAccidenteId: casoId },
      select: { id: true },
    });

    const reporte = await tx.reporteInicial.upsert({
      where: { casiAccidenteId: casoId },
      update: data,
      create: { casiAccidenteId: casoId, ...data },
    });

    await registrarBitacora({
      idCaso: casoId,
      idUsuario: usuarioId,
      accion: existing ? 'ACTUALIZACION_REPORTE_INICIAL' : 'CREACION_REPORTE_INICIAL',
      estadoAnterior: caso.estadoCasoId,
      estadoNuevo: caso.estadoCasoId,
      observacion: existing
        ? 'Se actualizó el reporte inicial del caso'
        : 'Se creó el reporte inicial del caso',
      client: tx,
    });

    return reporte;
  });
}

async function getInitialReportByCase(idCaso) {
  const casoId = parsePositiveId(idCaso, 'idCaso');
  const caso = await prisma.casiAccidente.findUnique({
    where: { id: casoId },
    select: { id: true },
  });

  if (!caso) throw new AppError('Caso no encontrado', 404);

  const reporte = await prisma.reporteInicial.findUnique({
    where: { casiAccidenteId: casoId },
  });

  if (!reporte) throw new AppError('Reporte inicial no encontrado', 404);
  return reporte;
}

module.exports = { saveInitialReport, getInitialReportByCase };
