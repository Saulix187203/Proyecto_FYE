const notificationsService = require('../services/notificaciones.service');

async function list(req, res) {
  const data = await notificationsService.listNotifications(req.user.id, req.query);
  res.status(200).json({
    success: true,
    message: 'Notificaciones obtenidas correctamente',
    data,
  });
}

async function markAsRead(req, res) {
  const notificacion = await notificationsService.markAsRead(req.params.id, req.user.id);
  res.status(200).json({
    success: true,
    message: 'Notificación marcada como leída',
    data: { notificacion },
  });
}

async function markAllAsRead(req, res) {
  const data = await notificationsService.markAllAsRead(req.user.id);
  res.status(200).json({
    success: true,
    message: 'Notificaciones marcadas como leídas',
    data,
  });
}

async function summary(req, res) {
  const resumen = await notificationsService.getSummary(req.user.id);
  res.status(200).json({
    success: true,
    message: 'Resumen de notificaciones obtenido correctamente',
    data: resumen,
  });
}

module.exports = { list, markAsRead, markAllAsRead, summary };
