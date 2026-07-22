const casosService = require('../services/casos.service');

async function create(req, res) {
  const caso = await casosService.createCase(req.body, req.user);
  res.status(201).json({
    success: true,
    message: 'Caso creado correctamente',
    data: { caso },
  });
}

async function list(req, res) {
  const data = await casosService.listCases(req.query);
  res.status(200).json({
    success: true,
    message: 'Casos obtenidos correctamente',
    data,
  });
}

async function getById(req, res) {
  const caso = await casosService.getCaseById(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Caso obtenido correctamente',
    data: { caso },
  });
}

async function update(req, res) {
  const caso = await casosService.updateCase(req.params.id, req.body, req.user);
  res.status(200).json({
    success: true,
    message: 'Caso actualizado correctamente',
    data: { caso },
  });
}

module.exports = { create, list, getById, update };
