const { Router } = require('express');
const catalogosController = require('../controllers/catalogos.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = Router();

router.use(authMiddleware);
router.get('/areas', catalogosController.areas);
router.get('/procesos', catalogosController.procesos);
router.get('/tipos-evento', catalogosController.tiposEvento);
router.get('/criticidades', catalogosController.criticidades);
router.get('/estados-caso', catalogosController.estadosCaso);
router.get('/estados-accion', catalogosController.estadosAccion);

module.exports = router;
