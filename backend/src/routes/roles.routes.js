const { Router } = require('express');
const rolesController = require('../controllers/roles.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = Router();

router.get('/', authMiddleware, rolesController.list);

module.exports = router;
