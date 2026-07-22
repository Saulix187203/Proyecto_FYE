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

async function regiones(_req, res) {
  respond(res, await catalogosService.listRegiones());
}

async function departamentos(req, res) {
  respond(res, await catalogosService.listDepartamentos(req.query));
}

async function municipios(req, res) {
  respond(res, await catalogosService.listMunicipios(req.query));
}

async function tiposBrigada(_req, res) {
  respond(res, await catalogosService.listTiposBrigada());
}

module.exports = {
  areas,
  procesos,
  tiposEvento,
  criticidades,
  estadosCaso,
  estadosAccion,
  regiones,
  departamentos,
  municipios,
  tiposBrigada,
};
