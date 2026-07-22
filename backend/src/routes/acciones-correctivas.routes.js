const { Router } = require('express');
const actionsController = require('../controllers/acciones-correctivas.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = Router();
const canManage = roleMiddleware(['Administrador', 'PRL Contratista', 'Responsable del Proceso', 'SYMA']);
const canExecute = roleMiddleware(['Administrador', 'Responsable del Proceso', 'PRL Contratista']);
const canValidate = roleMiddleware(['Administrador', 'SYMA', 'Gestión y Control SYMA']);

router.use(authMiddleware);
router.get('/', actionsController.list);
router.get('/caso/:idCaso', actionsController.listByCase);
router.get('/:id', actionsController.getById);
router.post('/', canManage, actionsController.create);
router.put('/:id', canManage, actionsController.update);
router.post('/:id/iniciar', canExecute, actionsController.start);
router.post('/:id/enviar-validacion', canExecute, actionsController.sendToValidation);
router.post('/:id/cerrar', canValidate, actionsController.close);
router.post('/:id/devolver', canValidate, actionsController.returnAction);

module.exports = router;
