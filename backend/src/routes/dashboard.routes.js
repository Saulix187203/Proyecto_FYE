const { Router } = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = Router();
const canViewDashboard = roleMiddleware([
  'Administrador',
  'SYMA',
  'Gestión y Control SYMA',
  'Gerencia',
  'Extractor API',
]);

router.use(authMiddleware, canViewDashboard);
router.get('/resumen', dashboardController.summary);
router.get('/casos-por-estado', dashboardController.casesByState);
router.get('/casos-por-area', dashboardController.casesByArea);
router.get('/casos-por-criticidad', dashboardController.casesByCriticality);
router.get('/acciones-vencidas', dashboardController.overdueActions);
router.get('/ultimos-casos', dashboardController.latestCases);
router.get('/brigadas/resumen', dashboardController.brigadasSummary);
router.get('/brigadas/casos-por-region', dashboardController.brigadaCasesByRegion);
router.get('/brigadas/casos-por-departamento', dashboardController.brigadaCasesByDepartamento);
router.get('/brigadas/casos-por-municipio', dashboardController.brigadaCasesByMunicipio);
router.get('/brigadas/casos-por-brigada', dashboardController.casesByBrigada);
router.get('/brigadas/integrantes-por-brigada', dashboardController.activeMembersByBrigada);
router.get('/brigadas/casos-abiertos-por-brigada', dashboardController.openCasesByBrigada);

module.exports = router;
