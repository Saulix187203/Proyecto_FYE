const actionsService = require('../services/acciones-correctivas.service');

async function create(req, res) {
  const accion = await actionsService.createAction(req.body, req.user.id);
  res.status(201).json({ success: true, message: 'Acción correctiva creada correctamente', data: { accion } });
}

async function list(req, res) {
  const data = await actionsService.listActions(req.query);
  res.status(200).json({
    success: true,
    message: 'Acciones correctivas obtenidas correctamente',
    data,
  });
}

async function listByCase(req, res) {
  const acciones = await actionsService.listByCase(req.params.idCaso);
  res.status(200).json({ success: true, message: 'Acciones obtenidas correctamente', data: { acciones } });
}

async function getById(req, res) {
  const accion = await actionsService.getById(req.params.id);
  res.status(200).json({ success: true, message: 'Acción obtenida correctamente', data: { accion } });
}

async function update(req, res) {
  const accion = await actionsService.updateAction(req.params.id, req.body, req.user.id);
  res.status(200).json({ success: true, message: 'Acción actualizada correctamente', data: { accion } });
}

async function start(req, res) {
  const data = await actionsService.startAction(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: 'Acción iniciada correctamente', data });
}

async function sendToValidation(req, res) {
  const data = await actionsService.sendToValidation(req.params.id, req.user.id, req.body);
  res.status(200).json({ success: true, message: 'Acción enviada a validación', data });
}

async function close(req, res) {
  const data = await actionsService.closeAction(req.params.id, req.user.id, req.body);
  res.status(200).json({ success: true, message: 'Acción cerrada correctamente', data });
}

async function returnAction(req, res) {
  const data = await actionsService.returnAction(req.params.id, req.user.id, req.body);
  res.status(200).json({ success: true, message: 'Acción devuelta correctamente', data });
}

module.exports = { create, list, listByCase, getById, update, start, sendToValidation, close, returnAction };
