const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const geografiaGuatemala = require('./data/geografia-guatemala');
const { synchronizeGeography } = require('./lib/seed-geografia-lib');

const prisma = new PrismaClient();

const EXTRACTOR_ROLE_NAME = 'Extractor API';
const EXTRACTOR_ROLE_DESCRIPTION =
  'Rol técnico de solo lectura para extracción de información mediante API.';
const EXTRACTOR_EMAIL = 'tecnico.api@sisca.com';
const DEVELOPMENT_EXTRACTOR_PASSWORD = 'TecnicoApi123*';

const roles = [
  'Administrador',
  'Brigada',
  'PRL Contratista',
  'Responsable del Proceso',
  'SYMA',
  'Gestión y Control SYMA',
  'Gerencia',
];

const estadosCaso = [
  { nombre: 'Reportado', esFinal: false },
  { nombre: 'En revisión', esFinal: false },
  { nombre: 'Devuelto', esFinal: false },
  { nombre: 'Aprobado', esFinal: false },
  { nombre: 'Con acciones', esFinal: false },
  { nombre: 'En validación', esFinal: false },
  { nombre: 'Cerrado', esFinal: true },
  { nombre: 'Rechazado', esFinal: true },
];

const estadosAccion = [
  { nombre: 'Pendiente', esFinal: false },
  { nombre: 'En proceso', esFinal: false },
  { nombre: 'En validación', esFinal: false },
  { nombre: 'Cerrada', esFinal: true },
  { nombre: 'Vencida', esFinal: false },
  { nombre: 'Devuelta', esFinal: false },
];

const criticidades = [
  { nombre: 'Baja', color: '#22C55E' },
  { nombre: 'Media', color: '#EAB308' },
  { nombre: 'Alta', color: '#F97316' },
  { nombre: 'Crítica', color: '#DC2626' },
];

const tiposEvento = [
  'Condición insegura',
  'Acto inseguro',
  'Casi caída',
  'Golpe o atrapamiento',
  'Derrame o fuga',
  'Otro',
];

const areas = [
  'Producción',
  'Bodega',
  'Mantenimiento',
  'Administración',
  'Seguridad Industrial',
];

const procesos = [
  { area: 'Producción', nombre: 'Proceso general de producción' },
  { area: 'Bodega', nombre: 'Recepción y despacho' },
  { area: 'Mantenimiento', nombre: 'Mantenimiento general' },
  { area: 'Administración', nombre: 'Gestión administrativa' },
  { area: 'Seguridad Industrial', nombre: 'Gestión de seguridad industrial' },
];

const tiposBrigada = [
  'Brigada de Emergencia',
  'Brigada de Primeros Auxilios',
  'Brigada contra Incendios',
  'Brigada de Evacuación',
  'Brigada de Seguridad Industrial',
];

async function upsertNamedCatalog(model, names) {
  await Promise.all(
    names.map((nombre) =>
      model.upsert({
        where: { nombre },
        update: { activo: true },
        create: { nombre },
      }),
    ),
  );
}

async function main() {
  await upsertNamedCatalog(prisma.rol, roles);
  const rolExtractor = await prisma.rol.upsert({
    where: { nombre: EXTRACTOR_ROLE_NAME },
    update: {
      descripcion: EXTRACTOR_ROLE_DESCRIPTION,
      activo: true,
    },
    create: {
      nombre: EXTRACTOR_ROLE_NAME,
      descripcion: EXTRACTOR_ROLE_DESCRIPTION,
    },
  });
  await upsertNamedCatalog(prisma.tipoEvento, tiposEvento);
  await upsertNamedCatalog(prisma.area, areas);
  await upsertNamedCatalog(prisma.tipoBrigada, tiposBrigada);

  await synchronizeGeography({ prisma, geography: geografiaGuatemala });

  const areasCreadas = await prisma.area.findMany({
    where: { nombre: { in: areas } },
    select: { id: true, nombre: true },
  });
  const areaIdPorNombre = new Map(areasCreadas.map((area) => [area.nombre, area.id]));

  await Promise.all(
    procesos.map(({ area, nombre }) => {
      const areaId = areaIdPorNombre.get(area);

      if (!areaId) {
        throw new Error(`No se encontró el área requerida para el proceso: ${area}`);
      }

      return prisma.proceso.upsert({
        where: { areaId_nombre: { areaId, nombre } },
        update: { activo: true },
        create: { areaId, nombre },
      });
    }),
  );

  await Promise.all(
    estadosCaso.map(({ nombre, esFinal }, index) =>
      prisma.estadoCaso.upsert({
        where: { nombre },
        update: { orden: index + 1, esFinal, activo: true },
        create: { nombre, orden: index + 1, esFinal },
      }),
    ),
  );

  await Promise.all(
    estadosAccion.map(({ nombre, esFinal }, index) =>
      prisma.estadoAccion.upsert({
        where: { nombre },
        update: { orden: index + 1, esFinal, activo: true },
        create: { nombre, orden: index + 1, esFinal },
      }),
    ),
  );

  await Promise.all(
    criticidades.map(({ nombre, color }, index) =>
      prisma.criticidad.upsert({
        where: { nombre },
        update: { orden: index + 1, color, activo: true },
        create: { nombre, orden: index + 1, color },
      }),
    ),
  );

  const passwordHash = await bcrypt.hash('Admin123*', 12);
  const administrador = await prisma.usuario.upsert({
    where: { correo: 'admin@sisca.com' },
    update: {
      nombre: 'Administrador SISCA',
      activo: true,
    },
    create: {
      nombre: 'Administrador SISCA',
      correo: 'admin@sisca.com',
      passwordHash,
    },
  });

  const rolAdministrador = await prisma.rol.findUniqueOrThrow({
    where: { nombre: 'Administrador' },
  });

  await prisma.usuarioRol.upsert({
    where: {
      usuarioId_rolId: {
        usuarioId: administrador.id,
        rolId: rolAdministrador.id,
      },
    },
    update: {},
    create: {
      usuarioId: administrador.id,
      rolId: rolAdministrador.id,
    },
  });

  const extractorPassword =
    process.env.API_EXTRACTOR_PASSWORD || DEVELOPMENT_EXTRACTOR_PASSWORD;
  const extractorPasswordHash = await bcrypt.hash(extractorPassword, 12);
  const tecnicoApi = await prisma.usuario.upsert({
    where: { correo: EXTRACTOR_EMAIL },
    update: {
      nombre: 'Técnico API',
      passwordHash: extractorPasswordHash,
      activo: true,
    },
    create: {
      nombre: 'Técnico API',
      correo: EXTRACTOR_EMAIL,
      passwordHash: extractorPasswordHash,
      activo: true,
    },
  });

  await prisma.$transaction([
    prisma.usuarioRol.deleteMany({
      where: {
        usuarioId: tecnicoApi.id,
        rolId: { not: rolExtractor.id },
      },
    }),
    prisma.usuarioRol.upsert({
      where: {
        usuarioId_rolId: {
          usuarioId: tecnicoApi.id,
          rolId: rolExtractor.id,
        },
      },
      update: {},
      create: {
        usuarioId: tecnicoApi.id,
        rolId: rolExtractor.id,
      },
    }),
  ]);

  if (!process.env.API_EXTRACTOR_PASSWORD && process.env.NODE_ENV !== 'production') {
    console.warn(
      'API_EXTRACTOR_PASSWORD no está configurada; se usó la contraseña temporal exclusiva para desarrollo. Cámbiela antes de habilitar el acceso técnico.',
    );
  }

  console.log('SISCA seed completed successfully.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
