const AppError = require('../utils/app-error');

function denyRoleMiddleware(deniedRoles) {
  if (!Array.isArray(deniedRoles) || deniedRoles.length === 0) {
    throw new Error('denyRoleMiddleware requires at least one denied role');
  }

  return function denyRole(req, _res, next) {
    if (!req.user) {
      return next(new AppError('Usuario no autenticado', 401));
    }

    const userRoles = req.user.roles.map((rol) => rol.nombre);
    const isDenied = deniedRoles.some((rol) => userRoles.includes(rol));

    if (isDenied) {
      return next(new AppError('No tiene permisos para realizar esta operación', 403));
    }

    return next();
  };
}

module.exports = denyRoleMiddleware;
