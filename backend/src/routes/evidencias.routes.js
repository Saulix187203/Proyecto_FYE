const { Router } = require('express');
const evidenceController = require('../controllers/evidencias.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const { uploadEvidence } = require('../middlewares/upload.middleware');

const router = Router();
const canUploadToCase = roleMiddleware([
  'Administrador',
  'Brigada',
  'PRL Contratista',
  'Responsable del Proceso',
  'SYMA',
]);
const canUploadToAction = roleMiddleware([
  'Administrador',
  'PRL Contratista',
  'Responsable del Proceso',
  'SYMA',
]);

router.use(authMiddleware);
router.get('/caso/:idCaso', evidenceController.listByCase);
router.post('/caso/:idCaso', canUploadToCase, uploadEvidence, evidenceController.createForCase);
router.get('/accion/:idAccion', evidenceController.listByAction);
router.post('/accion/:idAccion', canUploadToAction, uploadEvidence, evidenceController.createForAction);
router.get('/:id/descargar', evidenceController.download);

module.exports = router;
