const { Router } = require('express');
const reportesController = require('../controllers/reportes-iniciales.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = Router();
const canSave = roleMiddleware([
  'Administrador',
  'PRL Contratista',
  'Responsable del Proceso',
  'SYMA',
]);

router.use(authMiddleware);
router.get('/caso/:idCaso', reportesController.getByCase);
router.post('/', canSave, reportesController.save);

module.exports = router;
