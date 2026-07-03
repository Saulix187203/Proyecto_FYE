const fs = require('fs/promises');
const path = require('path');
const prisma = require('../config/prisma');
const AppError = require('../utils/app-error');
const { UPLOAD_DIRECTORY } = require('../middlewares/upload.middleware');
const { registrarBitacora } = require('./bitacora.service');

const backendRoot = path.resolve(__dirname, '../..');
const safeUserSelect = { id: true, nombre: true, correo: true };
const evidenceInclude = {
  subidoPor: { select: safeUserSelect },
  accionCorrectiva: { select: { id: true, titulo: true } },
};

function parsePositiveId(value, field) {
  const parsed = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${field} debe ser un entero positivo`, 400);
  }
  return parsed;
}

function requireFile(file) {
  if (!file) throw new AppError('Debe adjuntar un archivo en el campo archivo', 400);
  return file;
}

function serializeEvidence(evidence) {
  return {
    id: evidence.id,
    idCaso: evidence.casiAccidenteId,
    idAccion: evidence.accionCorrectivaId,
    nombreOriginal: evidence.nombreArchivo,
    nombreAlmacenado: evidence.nombreAlmacenado,
    ruta: evidence.rutaArchivo,
    tipoMime: evidence.tipoMime,
    tamanoBytes: evidence.tamanoBytes,
    descripcion: evidence.descripcion,
    subidoPor: evidence.subidoPor,
    accionCorrectiva: evidence.accionCorrectiva,
    createdAt: evidence.createdAt,
    updatedAt: evidence.updatedAt,
  };
}

function evidenceData(file, usuarioId, casoId, actionId = null, description = null) {
  const originalName = path.basename(file.originalname).slice(0, 255);
  const relativePath = path.relative(backendRoot, file.path).split(path.sep).join('/');
  return {
    casiAccidenteId: casoId,
    accionCorrectivaId: actionId,
    subidoPorId: usuarioId,
    nombreArchivo: originalName,
    nombreAlmacenado: file.filename,
    rutaArchivo: relativePath,
    tipoMime: file.mimetype,
    tamanoBytes: file.size,
    descripcion: description,
  };
}

async function cleanupFailedUpload(file) {
  if (!file?.path) return;
  const resolved = path.resolve(file.path);
  if (!resolved.startsWith(`${UPLOAD_DIRECTORY}${path.sep}`)) return;
  try {
    await fs.unlink(resolved);
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Could not clean failed upload:', error);
  }
}

function normalizeDescription(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError('La descripción debe ser un texto válido', 400);
  }
  return value.trim();
}

async function createCaseEvidence(idCaso, usuarioId, uploadedFile, input = {}) {
  const file = requireFile(uploadedFile);
  try {
    const casoId = parsePositiveId(idCaso, 'idCaso');
    const description = normalizeDescription(input.descripcion);
    const caso = await prisma.casiAccidente.findUnique({
      where: { id: casoId },
      select: { id: true, estadoCasoId: true },
    });
    if (!caso) throw new AppError('Caso no encontrado', 404);

    const evidence = await prisma.$transaction(async (tx) => {
      const created = await tx.evidencia.create({
        data: evidenceData(file, usuarioId, casoId, null, description),
        include: evidenceInclude,
      });
      await registrarBitacora({
        idCaso: casoId,
        idUsuario: usuarioId,
        accion: 'CARGA_EVIDENCIA_CASO',
        estadoAnterior: caso.estadoCasoId,
        estadoNuevo: caso.estadoCasoId,
        observacion: `Se adjuntó la evidencia ${created.nombreArchivo} al caso`,
        client: tx,
      });
      return created;
    });
    return serializeEvidence(evidence);
  } catch (error) {
    await cleanupFailedUpload(file);
    throw error;
  }
}

async function createActionEvidence(idAccion, usuarioId, uploadedFile, input = {}) {
  const file = requireFile(uploadedFile);
  try {
    const actionId = parsePositiveId(idAccion, 'idAccion');
    const description = normalizeDescription(input.descripcion);
    const action = await prisma.accionCorrectiva.findUnique({
      where: { id: actionId },
      select: {
        id: true,
        casiAccidenteId: true,
        casiAccidente: { select: { estadoCasoId: true } },
      },
    });
    if (!action) throw new AppError('Acción correctiva no encontrada', 404);

    const evidence = await prisma.$transaction(async (tx) => {
      const created = await tx.evidencia.create({
        data: evidenceData(file, usuarioId, action.casiAccidenteId, actionId, description),
        include: evidenceInclude,
      });
      await registrarBitacora({
        idCaso: action.casiAccidenteId,
        idUsuario: usuarioId,
        accion: 'CARGA_EVIDENCIA_ACCION',
        estadoAnterior: action.casiAccidente.estadoCasoId,
        estadoNuevo: action.casiAccidente.estadoCasoId,
        observacion: `Se adjuntó la evidencia ${created.nombreArchivo} a la acción #${actionId}`,
        client: tx,
      });
      return created;
    });
    return serializeEvidence(evidence);
  } catch (error) {
    await cleanupFailedUpload(file);
    throw error;
  }
}

async function listByCase(idCaso) {
  const casoId = parsePositiveId(idCaso, 'idCaso');
  const exists = await prisma.casiAccidente.findUnique({
    where: { id: casoId },
    select: { id: true },
  });
  if (!exists) throw new AppError('Caso no encontrado', 404);

  const evidence = await prisma.evidencia.findMany({
    where: { casiAccidenteId: casoId },
    orderBy: { createdAt: 'desc' },
    include: evidenceInclude,
  });
  return evidence.map(serializeEvidence);
}

async function listByAction(idAccion) {
  const actionId = parsePositiveId(idAccion, 'idAccion');
  const exists = await prisma.accionCorrectiva.findUnique({
    where: { id: actionId },
    select: { id: true },
  });
  if (!exists) throw new AppError('Acción correctiva no encontrada', 404);

  const evidence = await prisma.evidencia.findMany({
    where: { accionCorrectivaId: actionId },
    orderBy: { createdAt: 'desc' },
    include: evidenceInclude,
  });
  return evidence.map(serializeEvidence);
}

async function getDownload(id) {
  const evidenceId = parsePositiveId(id, 'id');
  const evidence = await prisma.evidencia.findUnique({ where: { id: evidenceId } });
  if (!evidence) throw new AppError('Evidencia no encontrada', 404);

  const filePath = path.resolve(backendRoot, evidence.rutaArchivo);
  if (!filePath.startsWith(`${UPLOAD_DIRECTORY}${path.sep}`)) {
    throw new AppError('La ruta física de la evidencia no es válida', 404);
  }

  try {
    await fs.access(filePath);
  } catch (_error) {
    throw new AppError('El archivo físico de la evidencia no existe', 404);
  }

  return { filePath, downloadName: evidence.nombreArchivo };
}

module.exports = {
  createCaseEvidence,
  createActionEvidence,
  listByCase,
  listByAction,
  getDownload,
};
