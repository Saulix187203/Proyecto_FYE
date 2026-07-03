const { Router } = require('express');
const casosController = require('../controllers/casos.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = Router();
const canCreate = roleMiddleware(['Administrador', 'Brigada', 'PRL Contratista', 'SYMA']);
const canUpdate = roleMiddleware([
  'Administrador',
  'PRL Contratista',
  'Responsable del Proceso',
  'SYMA',
]);

router.use(authMiddleware);
router.get('/', casosController.list);
router.get('/:id', casosController.getById);
router.post('/', canCreate, casosController.create);
router.put('/:id', canUpdate, casosController.update);

module.exports = router;
