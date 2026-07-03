const catalogosService = require('../services/catalogos.service');

function respond(res, data) {
  res.status(200).json({
    success: true,
    message: 'Catálogo obtenido correctamente',
    data,
  });
}

async function areas(_req, res) {
  respond(res, await catalogosService.listAreas());
}

async function procesos(_req, res) {
  respond(res, await catalogosService.listProcesos());
}

async function tiposEvento(_req, res) {
  respond(res, await catalogosService.listTiposEvento());
}

async function criticidades(_req, res) {
  respond(res, await catalogosService.listCriticidades());
}

async function estadosCaso(_req, res) {
  respond(res, await catalogosService.listEstadosCaso());
}

async function estadosAccion(_req, res) {
  respond(res, await catalogosService.listEstadosAccion());
}

module.exports = { areas, procesos, tiposEvento, criticidades, estadosCaso, estadosAccion };
