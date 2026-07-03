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
]);

router.use(authMiddleware, canViewDashboard);
router.get('/resumen', dashboardController.summary);
router.get('/casos-por-estado', dashboardController.casesByState);
router.get('/casos-por-area', dashboardController.casesByArea);
router.get('/casos-por-criticidad', dashboardController.casesByCriticality);
router.get('/acciones-vencidas', dashboardController.overdueActions);
router.get('/ultimos-casos', dashboardController.latestCases);

module.exports = router;
