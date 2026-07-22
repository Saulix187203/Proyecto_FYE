const prisma = require('../config/prisma');
const AppError = require('../utils/app-error');

const BASE_ROLE_NAMES = new Set([
  'Administrador',
  'Brigada',
  'PRL Contratista',
  'Responsable del Proceso',
  'SYMA',
  'Gestión y Control SYMA',
  'Gerencia',
]);

function parseRolId(id) {
  const rolId = Number.parseInt(id, 10);

  if (!Number.isInteger(rolId) || rolId <= 0 || String(rolId) !== String(id)) {
    throw new AppError('El id del rol debe ser un entero positivo', 400);
  }

  return rolId;
}

function validateNombre(nombre, required = true) {
  if (nombre === undefined && !required) return undefined;

  if (typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > 100) {
    throw new AppError('El nombre del rol es requerido y debe tener hasta 100 caracteres', 400);
  }

  return nombre.trim();
}

function validateDescripcion(descripcion) {
  if (descripcion === undefined) return undefined;

  if (descripcion === null) return null;

  if (typeof descripcion !== 'string' || descripcion.trim().length > 255) {
    throw new AppError('La descripción del rol debe tener hasta 255 caracteres', 400);
  }

  return descripcion.trim() || null;
}

const rolSelect = {
  id: true,
  nombre: true,
  descripcion: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
};

function isBaseRole(nombre) {
  return BASE_ROLE_NAMES.has(nombre);
}

function serializeRol(rol) {
  return {
    ...rol,
    esBase: isBaseRole(rol.nombre),
  };
}

async function listRoles() {
  const roles = await prisma.rol.findMany({
    orderBy: { nombre: 'asc' },
    select: rolSelect,
  });

  return roles.map(serializeRol);
}

async function createRol(input = {}) {
  const nombre = validateNombre(input.nombre);
  const descripcion = validateDescripcion(input.descripcion);

  const existing = await prisma.rol.findUnique({ where: { nombre } });

  if (existing) {
    throw new AppError('Ya existe un rol con ese nombre', 400);
  }

  const rol = await prisma.rol.create({
    data: {
      nombre,
      descripcion,
    },
    select: rolSelect,
  });

  return serializeRol(rol);
}

async function updateRol(id, input = {}) {
  const rolId = parseRolId(id);
  const nombre = validateNombre(input.nombre, false);
  const descripcion = validateDescripcion(input.descripcion);

  if (nombre === undefined && descripcion === undefined) {
    throw new AppError('Debe enviar al menos un campo para actualizar', 400);
  }

  const current = await prisma.rol.findUnique({ where: { id: rolId } });

  if (!current) {
    throw new AppError('Rol no encontrado', 404);
  }

  if (isBaseRole(current.nombre) && nombre !== undefined && nombre !== current.nombre) {
    throw new AppError('No se puede cambiar el nombre de un rol base del sistema.', 400);
  }

  if (nombre !== undefined && nombre !== current.nombre) {
    const nombreEnUso = await prisma.rol.findUnique({ where: { nombre } });

    if (nombreEnUso) {
      throw new AppError('Ya existe un rol con ese nombre', 400);
    }
  }

  const data = {};
  if (nombre !== undefined) data.nombre = nombre;
  if (descripcion !== undefined) data.descripcion = descripcion;

  const rol = await prisma.rol.update({
    where: { id: rolId },
    data,
    select: rolSelect,
  });

  return serializeRol(rol);
}

async function deleteRol(id) {
  const rolId = parseRolId(id);
  const current = await prisma.rol.findUnique({ where: { id: rolId } });

  if (!current) {
    throw new AppError('Rol no encontrado', 404);
  }

  if (isBaseRole(current.nombre)) {
    throw new AppError('No se puede eliminar un rol base del sistema.', 400);
  }

  const usuariosAsignados = await prisma.usuarioRol.count({ where: { rolId } });

  if (usuariosAsignados > 0) {
    throw new AppError('No se puede eliminar un rol asignado a usuarios.', 400);
  }

  await prisma.rol.delete({ where: { id: rolId } });

  return serializeRol(current);
}

module.exports = { listRoles, createRol, updateRol, deleteRol };
