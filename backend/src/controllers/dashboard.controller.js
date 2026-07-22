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

async function overdueActions(req, res) {
  respond(
    res,
    'Acciones vencidas obtenidas correctamente',
    await dashboardService.getOverdueActions(req.query),
  );
}

async function latestCases(req, res) {
  respond(res, 'Últimos casos obtenidos correctamente', { casos: await dashboardService.getLatestCases(req.query) });
}

async function brigadasSummary(req, res) {
  respond(
    res,
    'Resumen del dashboard de brigadas obtenido correctamente',
    await dashboardService.getBrigadasSummary(req.query),
  );
}

async function brigadaCasesByRegion(req, res) {
  respond(res, 'Casos por región obtenidos correctamente', {
    items: await dashboardService.getBrigadaCasesByRegion(req.query),
  });
}

async function brigadaCasesByDepartamento(req, res) {
  respond(res, 'Casos por departamento obtenidos correctamente', {
    items: await dashboardService.getBrigadaCasesByDepartamento(req.query),
  });
}

async function brigadaCasesByMunicipio(req, res) {
  respond(res, 'Casos por municipio obtenidos correctamente', {
    items: await dashboardService.getBrigadaCasesByMunicipio(req.query),
  });
}

async function casesByBrigada(req, res) {
  respond(res, 'Casos por brigada obtenidos correctamente', {
    items: await dashboardService.getCasesByBrigada(req.query),
  });
}

async function activeMembersByBrigada(req, res) {
  respond(res, 'Integrantes activos por brigada obtenidos correctamente', {
    items: await dashboardService.getActiveMembersByBrigada(req.query),
  });
}

async function openCasesByBrigada(req, res) {
  respond(res, 'Casos abiertos por brigada obtenidos correctamente', {
    items: await dashboardService.getOpenCasesByBrigada(req.query),
  });
}

module.exports = {
  summary,
  casesByState,
  casesByArea,
  casesByCriticality,
  overdueActions,
  latestCases,
  brigadasSummary,
  brigadaCasesByRegion,
  brigadaCasesByDepartamento,
  brigadaCasesByMunicipio,
  casesByBrigada,
  activeMembersByBrigada,
  openCasesByBrigada,
};
