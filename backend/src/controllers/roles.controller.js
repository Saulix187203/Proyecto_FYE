const rolesService = require('../services/roles.service');

async function list(req, res) {
  const roles = await rolesService.listRoles();

  res.status(200).json({
    success: true,
    message: 'Roles obtenidos correctamente',
    data: { roles },
  });
}

module.exports = { list };
