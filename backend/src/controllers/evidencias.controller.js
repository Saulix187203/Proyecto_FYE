const evidenceService = require('../services/evidencias.service');

async function createForCase(req, res) {
  const evidencia = await evidenceService.createCaseEvidence(
    req.params.idCaso,
    req.user.id,
    req.file,
    req.body,
  );
  res.status(201).json({ success: true, message: 'Evidencia cargada correctamente', data: { evidencia } });
}

async function createForAction(req, res) {
  const evidencia = await evidenceService.createActionEvidence(
    req.params.idAccion,
    req.user.id,
    req.file,
    req.body,
  );
  res.status(201).json({ success: true, message: 'Evidencia cargada correctamente', data: { evidencia } });
}

async function listByCase(req, res) {
  const evidencias = await evidenceService.listByCase(req.params.idCaso);
  res.status(200).json({ success: true, message: 'Evidencias obtenidas correctamente', data: { evidencias } });
}

async function listByAction(req, res) {
  const evidencias = await evidenceService.listByAction(req.params.idAccion);
  res.status(200).json({ success: true, message: 'Evidencias obtenidas correctamente', data: { evidencias } });
}

async function download(req, res, next) {
  const file = await evidenceService.getDownload(req.params.id);
  res.download(file.filePath, file.downloadName, (error) => {
    if (error && !res.headersSent) next(error);
  });
}

module.exports = { createForCase, createForAction, listByCase, listByAction, download };
