const expedientesService = require('../services/expedientes.service');

async function getByCase(req, res) {
  const expediente = await expedientesService.getCaseFile(req.params.idCaso);
  res.status(200).json({
    success: true,
    message: 'Expediente obtenido correctamente',
    data: { expediente },
  });
}

module.exports = { getByCase };
