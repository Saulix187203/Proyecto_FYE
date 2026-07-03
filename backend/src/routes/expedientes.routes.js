const { Router } = require('express');
const expedientesController = require('../controllers/expedientes.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = Router();

router.get('/:idCaso', authMiddleware, expedientesController.getByCase);

module.exports = router;
