const closureService = require('../services/cierre-casos.service');

async function close(req, res) {
  const caso = await closureService.closeCase(req.params.idCaso, req.user.id, req.body);
  res.status(200).json({ success: true, message: 'Caso cerrado correctamente', data: { caso } });
}

async function closeWithoutActions(req, res) {
  const caso = await closureService.closeCaseWithoutActions(req.params.idCaso, req.user.id, req.body);
  res.status(200).json({ success: true, message: 'Caso cerrado sin acciones correctamente', data: { caso } });
}

async function returnClosure(req, res) {
  const caso = await closureService.returnClosure(req.params.idCaso, req.user.id, req.body);
  res.status(200).json({ success: true, message: 'Cierre devuelto correctamente', data: { caso } });
}

module.exports = { close, closeWithoutActions, returnClosure };
