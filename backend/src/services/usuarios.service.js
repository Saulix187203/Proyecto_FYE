const prisma = require('../config/prisma');
const AppError = require('../utils/app-error');
const { hashPassword } = require('../utils/password');
const { parsePagination, parseSorting, buildPagination } = require('../utils/pagination');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USUARIOS_MAX_LIMIT = 500;
const OPCIONES_DEFAULT_LIMIT = 20;
const OPCIONES_MAX_LIMIT = 100;
const USUARIO_SORT_FIELDS = {
  id: 'id',
  nombre: 'nombre',
  correo: 'correo',
  activo: 'activo',
  ultimoAcceso: 'ultimoAcceso',
  createdAt: 'createdAt',
};

const usuarioSelect = {
  id: true,
  nombre: true,
  correo: true,
  activo: true,
  ultimoAcceso: true,
  createdAt: true,
  updatedAt: true,
  roles: {
    select: {
      rol: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  },
};

function serializeUsuario(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    activo: usuario.activo,
    ultimoAcceso: usuario.ultimoAcceso,
    createdAt: usuario.createdAt,
    updatedAt: usuario.updatedAt,
    roles: usuario.roles.map(({ rol }) => rol),
  };
}

function parseUsuarioId(id) {
  const usuarioId = Number.parseInt(id, 10);

  if (!Number.isInteger(usuarioId) || usuarioId <= 0 || String(usuarioId) !== String(id)) {
    throw new AppError('El id del usuario debe ser un entero positivo', 400);
  }

  return usuarioId;
}

function parseTexto(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') {
    throw new AppError('texto debe ser una cadena', 400);
  }

  const texto = value.trim();
  if (!texto) return undefined;
  if (texto.length > 255) {
    throw new AppError('texto debe tener hasta 255 caracteres', 400);
  }

  return texto;
}

function parseActivo(value, defaultValue) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new AppError('activo debe ser true o false', 400);
}

function parseRol(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (!/^\d+$/.test(String(value))) {
    throw new AppError('rol debe ser un ID entero positivo', 400);
  }

  const rol = Number(value);
  if (!Number.isSafeInteger(rol) || rol < 1) {
    throw new AppError('rol debe ser un ID entero positivo', 400);
  }

  return rol;
}

function buildUsuariosWhere({ texto, activo, rol }) {
  return {
    ...(texto
      ? {
          OR: [
            { nombre: { contains: texto, mode: 'insensitive' } },
            { correo: { contains: texto, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(activo === undefined ? {} : { activo }),
    ...(rol === undefined ? {} : { roles: { some: { rolId: rol } } }),
  };
}

function validateNombre(nombre, required = true) {
  if (nombre === undefined && !required) return undefined;

  if (typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > 150) {
    throw new AppError('El nombre es requerido y debe tener hasta 150 caracteres', 400);
  }

  return nombre.trim();
}

function validateCorreo(correo, required = true) {
  if (correo === undefined && !required) return undefined;

  if (
    typeof correo !== 'string' ||
    !EMAIL_PATTERN.test(correo.trim()) ||
    correo.trim().length > 255
  ) {
    throw new AppError('El correo no tiene un formato válido', 400);
  }

  return correo.trim().toLowerCase();
}

function validatePassword(password, required = true) {
  if (password === undefined && !required) return undefined;

  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    throw new AppError('La contraseña debe tener entre 8 y 72 caracteres', 400);
  }

  return password;
}

function validateRoles(roles, required = true) {
  if (roles === undefined && !required) return undefined;

  if (
    !Array.isArray(roles) ||
    (required && roles.length === 0) ||
    roles.some((rol) => {
      if (Number.isInteger(rol)) {
        return rol <= 0;
      }

      return typeof rol !== 'string' || !rol.trim() || rol.trim().length > 100;
    })
  ) {
    throw new AppError('Los roles deben ser una lista de nombres de rol válidos', 400);
  }

  return [
    ...new Set(
      roles.map((rol) => {
        if (Number.isInteger(rol)) {
          return rol;
        }

        return rol.trim();
      }),
    ),
  ];
}

async function getExistingRoles(client, roles) {
  const roleIds = roles.filter((rol) => Number.isInteger(rol));
  const roleNames = roles.filter((rol) => typeof rol === 'string');
  const or = [];

  if (roleIds.length) {
    or.push({ id: { in: roleIds } });
  }

  if (roleNames.length) {
    or.push({ nombre: { in: roleNames } });
  }

  const existingRoles = await client.rol.findMany({
    where: { activo: true, OR: or },
    select: { id: true, nombre: true },
  });

  const existingIds = new Set(existingRoles.map((rol) => rol.id));
  const existingNames = new Set(existingRoles.map((rol) => rol.nombre));
  const allRolesExist = roles.every((rol) =>
    Number.isInteger(rol) ? existingIds.has(rol) : existingNames.has(rol),
  );

  if (!allRolesExist) {
    throw new AppError('Uno o más roles no existen o están inactivos', 400);
  }

  return existingRoles;
}

async function listUsuarios(query = {}) {
  const pagination = parsePagination(query, {
    defaultLimit: 50,
    maxLimit: USUARIOS_MAX_LIMIT,
  });
  const sorting = parseSorting(query, USUARIO_SORT_FIELDS, {
    sortBy: 'nombre',
    sortDir: 'asc',
  });
  const where = buildUsuariosWhere({
    texto: parseTexto(query.texto),
    activo: parseActivo(query.activo, undefined),
    rol: parseRol(query.rol),
  });

  const [usuarios, totalItems] = await prisma.$transaction([
    prisma.usuario.findMany({
      where,
      orderBy: sorting.orderBy,
      skip: pagination.skip,
      take: pagination.limit,
      select: usuarioSelect,
    }),
    prisma.usuario.count({ where }),
  ]);

  return {
    usuarios: usuarios.map(serializeUsuario),
    pagination: buildPagination({ ...pagination, totalItems }),
    sort: { sortBy: sorting.sortBy, sortDir: sorting.sortDir },
  };
}

async function listUsuarioOpciones(query = {}) {
  const pagination = parsePagination(query, {
    defaultLimit: OPCIONES_DEFAULT_LIMIT,
    maxLimit: OPCIONES_MAX_LIMIT,
  });
  const where = buildUsuariosWhere({
    texto: parseTexto(query.texto),
    activo: parseActivo(query.activo, true),
    rol: undefined,
  });

  const [usuarios, totalItems] = await prisma.$transaction([
    prisma.usuario.findMany({
      where,
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
      skip: pagination.skip,
      take: pagination.limit,
      select: { id: true, nombre: true, correo: true },
    }),
    prisma.usuario.count({ where }),
  ]);

  return {
    usuarios,
    pagination: buildPagination({ ...pagination, totalItems }),
  };
}

async function getUsuarioById(id) {
  const usuarioId = parseUsuarioId(id);
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: usuarioSelect,
  });

  if (!usuario) {
    throw new AppError('Usuario no encontrado', 404);
  }

  return serializeUsuario(usuario);
}

async function createUsuario(input = {}) {
  const nombre = validateNombre(input.nombre);
  const correo = validateCorreo(input.correo);
  const password = validatePassword(input.password);
  const roles = validateRoles(input.roles);
  const passwordHash = await hashPassword(password);

  const usuario = await prisma.$transaction(async (tx) => {
    const existing = await tx.usuario.findUnique({ where: { correo } });

    if (existing) {
      throw new AppError('Ya existe un usuario con ese correo', 400);
    }

    const existingRoles = await getExistingRoles(tx, roles);

    return tx.usuario.create({
      data: {
        nombre,
        correo,
        passwordHash,
        roles: {
          create: existingRoles.map((rol) => ({
            rol: { connect: { id: rol.id } },
          })),
        },
      },
      select: usuarioSelect,
    });
  });

  return serializeUsuario(usuario);
}

async function updateUsuario(id, input = {}) {
  const usuarioId = parseUsuarioId(id);
  const nombre = validateNombre(input.nombre, false);
  const correo = validateCorreo(input.correo, false);

  if (input.activo !== undefined && typeof input.activo !== 'boolean') {
    throw new AppError('El estado activo debe ser verdadero o falso', 400);
  }

  if (input.password !== undefined || input.roles !== undefined) {
    throw new AppError('Use los endpoints específicos para cambiar contraseña o roles', 400);
  }

  if (nombre === undefined && correo === undefined && input.activo === undefined) {
    throw new AppError('Debe enviar al menos un campo para actualizar', 400);
  }

  const usuario = await prisma.$transaction(async (tx) => {
    const current = await tx.usuario.findUnique({ where: { id: usuarioId } });

    if (!current) {
      throw new AppError('Usuario no encontrado', 404);
    }

    if (correo !== undefined && correo !== current.correo) {
      const correoEnUso = await tx.usuario.findUnique({ where: { correo } });

      if (correoEnUso) {
        throw new AppError('Ya existe un usuario con ese correo', 400);
      }
    }

    const data = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (correo !== undefined) data.correo = correo;
    if (input.activo !== undefined) data.activo = input.activo;

    return tx.usuario.update({
      where: { id: usuarioId },
      data,
      select: usuarioSelect,
    });
  });

  return serializeUsuario(usuario);
}

async function updateUsuarioRoles(id, input = {}) {
  const usuarioId = parseUsuarioId(id);
  const roles = validateRoles(input.roles);

  const usuario = await prisma.$transaction(async (tx) => {
    const current = await tx.usuario.findUnique({ where: { id: usuarioId } });

    if (!current) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const existingRoles = await getExistingRoles(tx, roles);

    await tx.usuarioRol.deleteMany({ where: { usuarioId } });
    await tx.usuarioRol.createMany({
      data: existingRoles.map((rol) => ({
        usuarioId,
        rolId: rol.id,
      })),
    });

    return tx.usuario.findUnique({
      where: { id: usuarioId },
      select: usuarioSelect,
    });
  });

  return serializeUsuario(usuario);
}

async function updateUsuarioPassword(id, input = {}) {
  const usuarioId = parseUsuarioId(id);
  const password = validatePassword(input.password);
  const passwordHash = await hashPassword(password);

  const existing = await prisma.usuario.findUnique({ where: { id: usuarioId } });

  if (!existing) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const usuario = await prisma.usuario.update({
    where: { id: usuarioId },
    data: { passwordHash },
    select: usuarioSelect,
  });

  return serializeUsuario(usuario);
}

async function deactivateUsuario(id) {
  const usuarioId = parseUsuarioId(id);
  const existing = await prisma.usuario.findUnique({ where: { id: usuarioId } });

  if (!existing) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const usuario = await prisma.usuario.update({
    where: { id: usuarioId },
    data: { activo: false },
    select: usuarioSelect,
  });

  return serializeUsuario(usuario);
}

module.exports = {
  listUsuarios,
  listUsuarioOpciones,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  updateUsuarioRoles,
  updateUsuarioPassword,
  deactivateUsuario,
};
