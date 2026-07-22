const rolesService = require('../services/roles.service');

async function list(req, res) {
  const roles = await rolesService.listRoles();

  res.status(200).json({
    success: true,
    message: 'Roles obtenidos correctamente',
    data: { roles },
  });
}

async function create(req, res) {
  const rol = await rolesService.createRol(req.body);

  res.status(201).json({
    success: true,
    message: 'Rol creado correctamente',
    data: { rol },
  });
}

async function update(req, res) {
  const rol = await rolesService.updateRol(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Rol actualizado correctamente',
    data: { rol },
  });
}

async function remove(req, res) {
  const rol = await rolesService.deleteRol(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Rol eliminado correctamente',
    data: { rol },
  });
}

module.exports = { list, create, update, remove };
