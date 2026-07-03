const prisma = require('../config/prisma');
const AppError = require('../utils/app-error');
const { verifyToken } = require('../utils/jwt');

async function authMiddleware(req, _res, next) {
  try {
    const authorization = req.get('Authorization');

    if (!authorization) {
      throw new AppError('Token de autenticación requerido', 401);
    }

    const match = authorization.match(/^Bearer\s+([^\s]+)$/i);

    if (!match) {
      throw new AppError('Formato de token inválido. Use Bearer <token>', 401);
    }

    let payload;

    try {
      payload = verifyToken(match[1]);
    } catch (_error) {
      throw new AppError('Token inválido o expirado', 401);
    }

    const usuarioId = Number.parseInt(payload.sub, 10);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new AppError('Token inválido', 401);
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nombre: true,
        correo: true,
        activo: true,
        roles: {
          select: {
            rol: {
              select: { id: true, nombre: true, activo: true },
            },
          },
        },
      },
    });

    if (!usuario || !usuario.activo) {
      throw new AppError('Usuario no autorizado', 401);
    }

    req.user = {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      roles: usuario.roles
        .filter(({ rol }) => rol.activo)
        .map(({ rol }) => ({ id: rol.id, nombre: rol.nombre })),
    };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authMiddleware;
