const prisma = require('../config/prisma');
const AppError = require('../utils/app-error');
const { signToken } = require('../utils/jwt');
const { comparePassword } = require('../utils/password');

function serializeUsuario(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    activo: usuario.activo,
    ultimoAcceso: usuario.ultimoAcceso,
    roles: usuario.roles.map(({ rol }) => ({
      id: rol.id,
      nombre: rol.nombre,
    })),
  };
}

async function login({ correo, password } = {}) {
  if (typeof correo !== 'string' || !correo.trim()) {
    throw new AppError('El correo es requerido', 400);
  }

  if (typeof password !== 'string' || !password) {
    throw new AppError('La contraseña es requerida', 400);
  }

  const usuario = await prisma.usuario.findUnique({
    where: { correo: correo.trim().toLowerCase() },
    include: {
      roles: {
        where: { rol: { activo: true } },
        include: { rol: true },
      },
    },
  });

  if (!usuario || !(await comparePassword(password, usuario.passwordHash))) {
    throw new AppError('Correo o contraseña incorrectos', 401);
  }

  if (!usuario.activo) {
    throw new AppError('El usuario se encuentra inactivo', 403);
  }

  const roles = usuario.roles.map(({ rol }) => rol.nombre);
  const token = signToken({ sub: String(usuario.id), roles });
  const ultimoAcceso = new Date();

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimoAcceso },
  });

  usuario.ultimoAcceso = ultimoAcceso;

  return {
    usuario: serializeUsuario(usuario),
    token,
  };
}

async function getAuthenticatedUser(usuarioId) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: {
      roles: {
        where: { rol: { activo: true } },
        include: { rol: true },
      },
    },
  });

  if (!usuario || !usuario.activo) {
    throw new AppError('Usuario autenticado no encontrado', 404);
  }

  return serializeUsuario(usuario);
}

module.exports = { login, getAuthenticatedUser };
