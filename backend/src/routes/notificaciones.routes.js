const { Router } = require('express');
const notificationsController = require('../controllers/notificaciones.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const denyRoleMiddleware = require('../middlewares/deny-role.middleware');

const router = Router();
const denyExtractor = denyRoleMiddleware(['Extractor API']);

router.use(authMiddleware, denyExtractor);
router.get('/', notificationsController.list);
router.get('/resumen', notificationsController.summary);
router.put('/marcar-todas-leidas', notificationsController.markAllAsRead);
router.put('/:id/leida', notificationsController.markAsRead);

module.exports = router;
