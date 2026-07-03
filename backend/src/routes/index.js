const { Router } = require('express');
const accionesCorrectivasRoutes = require('./acciones-correctivas.routes');
const authRoutes = require('./auth.routes');
const casosRoutes = require('./casos.routes');
const catalogosRoutes = require('./catalogos.routes');
const cierreCasosRoutes = require('./cierre-casos.routes');
const dashboardRoutes = require('./dashboard.routes');
const expedientesRoutes = require('./expedientes.routes');
const evidenciasRoutes = require('./evidencias.routes');
const healthRoutes = require('./health.routes');
const notificacionesRoutes = require('./notificaciones.routes');
const reportesInicialesRoutes = require('./reportes-iniciales.routes');
const rolesRoutes = require('./roles.routes');
const usuariosRoutes = require('./usuarios.routes');
const validacionesProcedenciaRoutes = require('./validaciones-procedencia.routes');

const router = Router();

router.use('/acciones-correctivas', accionesCorrectivasRoutes);
router.use('/auth', authRoutes);
router.use('/casos', casosRoutes);
router.use('/catalogos', catalogosRoutes);
router.use('/cierre-casos', cierreCasosRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/expedientes', expedientesRoutes);
router.use('/evidencias', evidenciasRoutes);
router.use('/health', healthRoutes);
router.use('/notificaciones', notificacionesRoutes);
router.use('/reportes-iniciales', reportesInicialesRoutes);
router.use('/roles', rolesRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/validaciones-procedencia', validacionesProcedenciaRoutes);

module.exports = router;
