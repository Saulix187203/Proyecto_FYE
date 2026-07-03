const AppError = require('../utils/app-error');

function roleMiddleware(allowedRoles) {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    throw new Error('roleMiddleware requires at least one allowed role');
  }

  return function authorizeRole(req, _res, next) {
    if (!req.user) {
      return next(new AppError('Usuario no autenticado', 401));
    }

    const userRoles = req.user.roles.map((rol) => rol.nombre);
    const isAllowed = allowedRoles.some((rol) => userRoles.includes(rol));

    if (!isAllowed) {
      return next(new AppError('No tiene permisos para realizar esta operación', 403));
    }

    return next();
  };
}

module.exports = roleMiddleware;
