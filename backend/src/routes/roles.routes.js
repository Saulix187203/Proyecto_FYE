const { Router } = require('express');
const rolesController = require('../controllers/roles.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = Router();
const onlyAdministrator = roleMiddleware(['Administrador']);

router.use(authMiddleware, onlyAdministrator);

router.get('/', rolesController.list);
router.post('/', rolesController.create);
router.put('/:id', rolesController.update);
router.delete('/:id', rolesController.remove);

module.exports = router;
