const { Router } = require('express');
const validationController = require('../controllers/validaciones-procedencia.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const denyRoleMiddleware = require('../middlewares/deny-role.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = Router();
const denyExtractor = denyRoleMiddleware(['Extractor API']);
const canValidate = roleMiddleware(['Administrador', 'PRL Contratista', 'SYMA']);

router.use(authMiddleware, denyExtractor);
router.get('/caso/:idCaso', validationController.listByCase);
router.post('/:idCaso/iniciar-revision', canValidate, validationController.startReview);
router.post('/:idCaso/aprobar', canValidate, validationController.approve);
router.post('/:idCaso/devolver', canValidate, validationController.returnCase);
router.post('/:idCaso/rechazar', canValidate, validationController.reject);

module.exports = router;
