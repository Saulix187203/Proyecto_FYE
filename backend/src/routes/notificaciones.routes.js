const { Router } = require('express');
const notificationsController = require('../controllers/notificaciones.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = Router();

router.use(authMiddleware);
router.get('/', notificationsController.list);
router.get('/resumen', notificationsController.summary);
router.put('/marcar-todas-leidas', notificationsController.markAllAsRead);
router.put('/:id/leida', notificationsController.markAsRead);

module.exports = router;
