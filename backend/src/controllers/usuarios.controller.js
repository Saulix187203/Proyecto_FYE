const usuariosService = require('../services/usuarios.service');

async function list(req, res) {
  const usuarios = await usuariosService.listUsuarios();

  res.status(200).json({
    success: true,
    message: 'Usuarios obtenidos correctamente',
    data: { usuarios },
  });
}

async function getById(req, res) {
  const usuario = await usuariosService.getUsuarioById(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Usuario obtenido correctamente',
    data: { usuario },
  });
}

async function create(req, res) {
  const usuario = await usuariosService.createUsuario(req.body);

  res.status(201).json({
    success: true,
    message: 'Usuario creado correctamente',
    data: { usuario },
  });
}

async function update(req, res) {
  const usuario = await usuariosService.updateUsuario(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Usuario actualizado correctamente',
    data: { usuario },
  });
}

async function remove(req, res) {
  const usuario = await usuariosService.deactivateUsuario(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Usuario desactivado correctamente',
    data: { usuario },
  });
}

module.exports = { list, getById, create, update, remove };
