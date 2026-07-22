const prisma = require('../config/prisma');
const AppError = require('../utils/app-error');
const {
  parsePagination,
  parseSorting,
  buildPagination,
} = require('../utils/pagination');

const notificationInclude = {
  casiAccidente: { select: { id: true, correlativo: true, titulo: true } },
};
const NOTIFICATION_SORT_FIELDS = {
  id: 'id',
  createdAt: 'createdAt',
  fechaLectura: 'fechaLectura',
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

function parseDate(value, field) {
  if (typeof value !== 'string' && !(value instanceof Date)) {
    throw new AppError(`${field} debe ser una fecha válida`, 400);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${field} debe ser una fecha válida`, 400);
  }

  return date;
}

async function listNotifications(usuarioId, query = {}) {
  const leida = parseReadFilter(query.leida);
  const pagination = parsePagination(query);
  const sorting = parseSorting(query, NOTIFICATION_SORT_FIELDS, {
    sortBy: 'createdAt',
    sortDir: 'desc',
  });
  const where = {
    usuarioId,
    ...(leida === undefined ? {} : { leida }),
  };

  if (query.fechaDesde || query.fechaHasta) {
    where.createdAt = {};
    if (query.fechaDesde) where.createdAt.gte = parseDate(query.fechaDesde, 'fechaDesde');
    if (query.fechaHasta) where.createdAt.lte = parseDate(query.fechaHasta, 'fechaHasta');
    if (where.createdAt.gte && where.createdAt.lte && where.createdAt.gte > where.createdAt.lte) {
      throw new AppError('fechaDesde no puede ser mayor que fechaHasta', 400);
    }
  }

  const [notificaciones, totalItems] = await Promise.all([
    prisma.notificacion.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: sorting.orderBy,
      include: notificationInclude,
    }),
    prisma.notificacion.count({ where }),
  ]);

  return {
    notificaciones,
    pagination: buildPagination({ ...pagination, totalItems }),
    sort: { sortBy: sorting.sortBy, sortDir: sorting.sortDir },
  };
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
