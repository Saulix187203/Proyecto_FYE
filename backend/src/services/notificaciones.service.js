const prisma = require('../config/prisma');
const AppError = require('../utils/app-error');

const notificationInclude = {
  casiAccidente: { select: { id: true, correlativo: true, titulo: true } },
};

function createNotification({
  idUsuario,
  idCaso = null,
  tipo = null,
  titulo,
  mensaje,
  client = prisma,
}) {
  return client.notificacion.create({
    data: {
      usuarioId: idUsuario,
      casiAccidenteId: idCaso,
      tipo,
      titulo,
      mensaje,
    },
  });
}

async function createNotifications({
  userIds,
  idCaso = null,
  tipo = null,
  titulo,
  mensaje,
  client = prisma,
}) {
  const uniqueUserIds = [...new Set(userIds)];
  if (uniqueUserIds.length === 0) return { count: 0 };

  return client.notificacion.createMany({
    data: uniqueUserIds.map((usuarioId) => ({
      usuarioId,
      casiAccidenteId: idCaso,
      tipo,
      titulo,
      mensaje,
    })),
  });
}

async function notifyUsersByRoles({ roleNames, client = prisma, ...notification }) {
  const users = await client.usuario.findMany({
    where: {
      activo: true,
      roles: {
        some: { rol: { activo: true, nombre: { in: roleNames } } },
      },
    },
    select: { id: true },
  });

  return createNotifications({
    ...notification,
    userIds: users.map((user) => user.id),
    client,
  });
}

function parseReadFilter(value) {
  if (value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new AppError('El filtro leida debe ser true o false', 400);
}

function listNotifications(usuarioId, query = {}) {
  const leida = parseReadFilter(query.leida);
  return prisma.notificacion.findMany({
    where: {
      usuarioId,
      ...(leida === undefined ? {} : { leida }),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: notificationInclude,
  });
}

async function markAsRead(id, usuarioId) {
  const notificationId = Number(id);
  if (!Number.isInteger(notificationId) || notificationId <= 0) {
    throw new AppError('El id de la notificación debe ser un entero positivo', 400);
  }

  const notification = await prisma.notificacion.findFirst({
    where: { id: notificationId, usuarioId },
    select: { id: true },
  });
  if (!notification) throw new AppError('Notificación no encontrada', 404);

  return prisma.notificacion.update({
    where: { id: notificationId },
    data: { leida: true, fechaLectura: new Date() },
    include: notificationInclude,
  });
}

async function markAllAsRead(usuarioId) {
  const result = await prisma.notificacion.updateMany({
    where: { usuarioId, leida: false },
    data: { leida: true, fechaLectura: new Date() },
  });
  return { actualizadas: result.count };
}

async function getSummary(usuarioId) {
  const [total, noLeidas] = await Promise.all([
    prisma.notificacion.count({ where: { usuarioId } }),
    prisma.notificacion.count({ where: { usuarioId, leida: false } }),
  ]);
  return { total, noLeidas };
}

module.exports = {
  createNotification,
  createNotifications,
  notifyUsersByRoles,
  listNotifications,
  markAsRead,
  markAllAsRead,
  getSummary,
};
