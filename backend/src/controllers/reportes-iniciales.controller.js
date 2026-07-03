const reportesService = require('../services/reportes-iniciales.service');

async function save(req, res) {
  const reporte = await reportesService.saveInitialReport(req.body, req.user.id);
  res.status(200).json({
    success: true,
    message: 'Reporte inicial guardado correctamente',
    data: { reporte },
  });
}

async function getByCase(req, res) {
  const reporte = await reportesService.getInitialReportByCase(req.params.idCaso);
  res.status(200).json({
    success: true,
    message: 'Reporte inicial obtenido correctamente',
    data: { reporte },
  });
}

module.exports = { save, getByCase };
