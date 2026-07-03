const prisma = require('../config/prisma');
const AppError = require('../utils/app-error');
const { hashPassword } = require('../utils/password');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const usuarioSelect = {
  id: true,
  nombre: true,
  correo: true,
  activo: true,
  ultimoAcceso: true,
  createdAt: true,
  updatedAt: true,
  roles: {
    select: {
      rol: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  },
};

function serializeUsuario(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    activo: usuario.activo,
    ultimoAcceso: usuario.ultimoAcceso,
    createdAt: usuario.createdAt,
    updatedAt: usuario.updatedAt,
    roles: usuario.roles.map(({ rol }) => rol),
  };
}

function parseUsuarioId(id) {
  const usuarioId = Number.parseInt(id, 10);

  if (!Number.isInteger(usuarioId) || usuarioId <= 0 || String(usuarioId) !== String(id)) {
    throw new AppError('El id del usuario debe ser un entero positivo', 400);
  }

  return usuarioId;
}

function validateNombre(nombre, required = true) {
  if (nombre === undefined && !required) return undefined;

  if (typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > 150) {
    throw new AppError('El nombre es requerido y debe tener hasta 150 caracteres', 400);
  }

  return nombre.trim();
}

function validateCorreo(correo, required = true) {
  if (correo === undefined && !required) return undefined;

  if (
    typeof correo !== 'string' ||
    !EMAIL_PATTERN.test(correo.trim()) ||
    correo.trim().length > 255
  ) {
    throw new AppError('El correo no tiene un formato válido', 400);
  }

  return correo.trim().toLowerCase();
}

function validatePassword(password, required = true) {
  if (password === undefined && !required) return undefined;

  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    throw new AppError('La contraseña debe tener entre 8 y 72 caracteres', 400);
  }

  return password;
}

function validateRoles(roles, required = true) {
  if (roles === undefined && !required) return undefined;

  if (
    !Array.isArray(roles) ||
    (required && roles.length === 0) ||
    roles.some((id) => !Number.isInteger(id) || id <= 0)
  ) {
    throw new AppError('Los roles deben ser una lista de ids enteros positivos', 400);
  }

  return [...new Set(roles)];
}

async function ensureRolesExist(client, roleIds) {
  const count = await client.rol.count({
    where: { id: { in: roleIds }, activo: true },
  });

  if (count !== roleIds.length) {
    throw new AppError('Uno o más roles no existen o están inactivos', 400);
  }
}

async function listUsuarios() {
  const usuarios = await prisma.usuario.findMany({
    orderBy: { id: 'asc' },
    select: usuarioSelect,
  });

  return usuarios.map(serializeUsuario);
}

async function getUsuarioById(id) {
  const usuarioId = parseUsuarioId(id);
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: usuarioSelect,
  });

  if (!usuario) {
    throw new AppError('Usuario no encontrado', 404);
  }

  return serializeUsuario(usuario);
}

async function createUsuario(input = {}) {
  const nombre = validateNombre(input.nombre);
  const correo = validateCorreo(input.correo);
  const password = validatePassword(input.password);
  const roleIds = validateRoles(input.roles);
  const passwordHash = await hashPassword(password);

  const usuario = await prisma.$transaction(async (tx) => {
    const existing = await tx.usuario.findUnique({ where: { correo } });

    if (existing) {
      throw new AppError('Ya existe un usuario con ese correo', 400);
    }

    await ensureRolesExist(tx, roleIds);

    return tx.usuario.create({
      data: {
        nombre,
        correo,
        passwordHash,
        roles: {
          create: roleIds.map((rolId) => ({
            rol: { connect: { id: rolId } },
          })),
        },
      },
      select: usuarioSelect,
    });
  });

  return serializeUsuario(usuario);
}

async function updateUsuario(id, input = {}) {
  const usuarioId = parseUsuarioId(id);
  const nombre = validateNombre(input.nombre, false);
  const correo = validateCorreo(input.correo, false);
  const password = validatePassword(input.password, false);
  const roleIds = validateRoles(input.roles, false);

  if (input.activo !== undefined && typeof input.activo !== 'boolean') {
    throw new AppError('El estado activo debe ser verdadero o falso', 400);
  }

  if (
    nombre === undefined &&
    correo === undefined &&
    password === undefined &&
    roleIds === undefined &&
    input.activo === undefined
  ) {
    throw new AppError('Debe enviar al menos un campo para actualizar', 400);
  }

  const passwordHash = password === undefined ? undefined : await hashPassword(password);

  const usuario = await prisma.$transaction(async (tx) => {
    const current = await tx.usuario.findUnique({ where: { id: usuarioId } });

    if (!current) {
      throw new AppError('Usuario no encontrado', 404);
    }

    if (correo !== undefined && correo !== current.correo) {
      const correoEnUso = await tx.usuario.findUnique({ where: { correo } });

      if (correoEnUso) {
        throw new AppError('Ya existe un usuario con ese correo', 400);
      }
    }

    if (roleIds !== undefined) {
      await ensureRolesExist(tx, roleIds);
    }

    const data = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (correo !== undefined) data.correo = correo;
    if (passwordHash !== undefined) data.passwordHash = passwordHash;
    if (input.activo !== undefined) data.activo = input.activo;
    if (roleIds !== undefined) {
      data.roles = {
        deleteMany: {},
        create: roleIds.map((rolId) => ({
          rol: { connect: { id: rolId } },
        })),
      };
    }

    return tx.usuario.update({
      where: { id: usuarioId },
      data,
      select: usuarioSelect,
    });
  });

  return serializeUsuario(usuario);
}

async function deactivateUsuario(id) {
  const usuarioId = parseUsuarioId(id);
  const existing = await prisma.usuario.findUnique({ where: { id: usuarioId } });

  if (!existing) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const usuario = await prisma.usuario.update({
    where: { id: usuarioId },
    data: { activo: false },
    select: usuarioSelect,
  });

  return serializeUsuario(usuario);
}

module.exports = {
  listUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deactivateUsuario,
};
