const validationService = require('../services/validaciones-procedencia.service');

async function startReview(req, res) {
  const caso = await validationService.startReview(req.params.idCaso, req.user.id);
  res.status(200).json({
    success: true,
    message: 'Revisión iniciada correctamente',
    data: { caso },
  });
}

async function approve(req, res) {
  const data = await validationService.approve(req.params.idCaso, req.user.id, req.body);
  res.status(200).json({
    success: true,
    message: 'Caso aprobado correctamente',
    data,
  });
}

async function returnCase(req, res) {
  const data = await validationService.returnCase(req.params.idCaso, req.user.id, req.body);
  res.status(200).json({
    success: true,
    message: 'Caso devuelto correctamente',
    data,
  });
}

async function reject(req, res) {
  const data = await validationService.reject(req.params.idCaso, req.user.id, req.body);
  res.status(200).json({
    success: true,
    message: 'Caso rechazado correctamente',
    data,
  });
}

async function listByCase(req, res) {
  const validaciones = await validationService.listByCase(req.params.idCaso);
  res.status(200).json({
    success: true,
    message: 'Validaciones obtenidas correctamente',
    data: { validaciones },
  });
}

module.exports = { startReview, approve, returnCase, reject, listByCase };
