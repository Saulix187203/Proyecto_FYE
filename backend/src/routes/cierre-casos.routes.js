const { Router } = require('express');
const closureController = require('../controllers/cierre-casos.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = Router();
const canClose = roleMiddleware(['Administrador', 'SYMA', 'Gestión y Control SYMA']);

router.use(authMiddleware, canClose);
router.post('/:idCaso/cerrar', closureController.close);
router.post('/:idCaso/cerrar-sin-acciones', closureController.closeWithoutActions);
router.post('/:idCaso/devolver-cierre', closureController.returnClosure);

module.exports = router;
