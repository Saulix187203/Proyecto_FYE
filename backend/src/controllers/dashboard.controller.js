const dashboardService = require('../services/dashboard.service');

function respond(res, message, data) {
  res.status(200).json({ success: true, message, data });
}

async function summary(_req, res) {
  respond(res, 'Resumen del dashboard obtenido correctamente', await dashboardService.getSummary());
}

async function casesByState(_req, res) {
  respond(res, 'Casos por estado obtenidos correctamente', { items: await dashboardService.getCasesByState() });
}

async function casesByArea(_req, res) {
  respond(res, 'Casos por área obtenidos correctamente', { items: await dashboardService.getCasesByArea() });
}

async function casesByCriticality(_req, res) {
  respond(res, 'Casos por criticidad obtenidos correctamente', { items: await dashboardService.getCasesByCriticality() });
}

async function overdueActions(_req, res) {
  respond(res, 'Acciones vencidas obtenidas correctamente', { acciones: await dashboardService.getOverdueActions() });
}

async function latestCases(req, res) {
  respond(res, 'Últimos casos obtenidos correctamente', { casos: await dashboardService.getLatestCases(req.query) });
}

module.exports = { summary, casesByState, casesByArea, casesByCriticality, overdueActions, latestCases };
