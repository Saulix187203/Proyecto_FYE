const { Router } = require('express');
const usuariosController = require('../controllers/usuarios.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = Router();
const onlyAdministrator = roleMiddleware(['Administrador']);
const canSelectUsuarios = roleMiddleware([
  'Administrador',
  'PRL Contratista',
  'Responsable del Proceso',
  'SYMA',
]);

router.use(authMiddleware);
router.get('/opciones', canSelectUsuarios, usuariosController.listOpciones);
router.use(onlyAdministrator);

router.get('/', usuariosController.list);
router.get('/:id', usuariosController.getById);
router.post('/', usuariosController.create);
router.put('/:id', usuariosController.update);
router.put('/:id/roles', usuariosController.updateRoles);
router.put('/:id/password', usuariosController.updatePassword);
router.delete('/:id', usuariosController.remove);

module.exports = router;
