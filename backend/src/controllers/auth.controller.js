const authService = require('../services/auth.service');

async function login(req, res) {
  const data = await authService.login(req.body);

  res.status(200).json({
    success: true,
    message: 'Inicio de sesión exitoso',
    data,
  });
}

async function me(req, res) {
  const usuario = await authService.getAuthenticatedUser(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Usuario autenticado obtenido correctamente',
    data: { usuario },
  });
}

module.exports = { login, me };
