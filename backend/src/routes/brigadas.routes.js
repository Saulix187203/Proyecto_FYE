const { Router } = require('express');
const brigadasController = require('../controllers/brigadas.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const denyRoleMiddleware = require('../middlewares/deny-role.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = Router();
const canRead = roleMiddleware([
  'Administrador',
  'SYMA',
  'PRL Contratista',
  'Responsable del Proceso',
  'Brigada',
  'Gestión y Control SYMA',
  'Gerencia',
  'Extractor API',
]);
const canUseOptions = roleMiddleware([
  'Administrador',
  'SYMA',
  'PRL Contratista',
  'Responsable del Proceso',
  'Brigada',
  'Gestión y Control SYMA',
  'Gerencia',
]);
const onlyAdministrator = roleMiddleware(['Administrador']);
const denyExtractor = denyRoleMiddleware(['Extractor API']);

router.use(authMiddleware);
router.get('/mis-brigadas', denyExtractor, brigadasController.misBrigadas);
router.get('/opciones', canUseOptions, brigadasController.listOptions);
router.get('/', canRead, brigadasController.list);
router.get('/:id', canRead, brigadasController.getById);
router.get('/:id/miembros', canRead, brigadasController.listMiembros);
router.post('/:id/miembros', onlyAdministrator, brigadasController.addMiembro);
router.put('/:id/miembros/:idMiembro', onlyAdministrator, brigadasController.updateMiembro);
router.delete('/:id/miembros/:idMiembro', onlyAdministrator, brigadasController.removeMiembro);
router.post('/', onlyAdministrator, brigadasController.create);
router.put('/:id', onlyAdministrator, brigadasController.update);
router.delete('/:id', onlyAdministrator, brigadasController.remove);

module.exports = router;
