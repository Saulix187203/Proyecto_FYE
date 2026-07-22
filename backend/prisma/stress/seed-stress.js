const {
  assertNonProduction,
  createManyInChunks,
  defaultRunId,
  elapsed,
  itemsForIndex,
  normalizeRunId,
  pad,
  parseArguments,
  readInteger,
  requireConfirmation,
} = require('./stress-utils');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DAY_MS = 24 * 60 * 60 * 1000;

function readConfiguration() {
  const args = parseArguments();
  const users = readInteger({
    args,
    argumentName: 'users',
    environmentName: 'STRESS_USERS',
    defaultValue: 100,
    min: 1,
  });
  const brigades = readInteger({
    args,
    argumentName: 'brigadas',
    environmentName: 'STRESS_BRIGADAS',
    defaultValue: 20,
  });
  const cases = readInteger({
    args,
    argumentName: 'casos',
    environmentName: 'STRESS_CASOS',
    defaultValue: 1000,
    min: 1,
  });

  return {
    runId: normalizeRunId(args.get('run-id') ?? process.env.STRESS_RUN_ID ?? defaultRunId()),
    users,
    brigades,
    cases,
    membersPerBrigade: readInteger({
      args,
      argumentName: 'miembros-por-brigada',
      environmentName: 'STRESS_MIEMBROS_POR_BRIGADA',
      defaultValue: 3,
      max: 1000,
    }),
    actionsPerCase: readInteger({
      args,
      argumentName: 'acciones-por-caso',
      environmentName: 'STRESS_ACCIONES_POR_CASO',
      defaultValue: 1,
      max: 100,
    }),
    casesWithActionsPercent: readInteger({
      args,
      argumentName: 'porcentaje-acciones',
      environmentName: 'STRESS_PORCENTAJE_CASOS_CON_ACCIONES',
      defaultValue: 60,
      max: 100,
    }),
    casesWithBrigadePercent: readInteger({
      args,
      argumentName: 'porcentaje-brigada',
      environmentName: 'STRESS_PORCENTAJE_CASOS_CON_BRIGADA',
      defaultValue: 75,
      max: 100,
    }),
    notifications: readInteger({
      args,
      argumentName: 'notificaciones',
      environmentName: 'STRESS_NOTIFICACIONES',
      defaultValue: cases,
    }),
    logEntries: readInteger({
      args,
      argumentName: 'bitacora',
      environmentName: 'STRESS_BITACORA',
      defaultValue: cases,
    }),
    evidence: readInteger({
      args,
      argumentName: 'evidencias',
      environmentName: 'STRESS_EVIDENCIAS',
      defaultValue: 0,
      max: 100_000,
    }),
    batchSize: readInteger({
      args,
      argumentName: 'batch-size',
      environmentName: 'BATCH_SIZE',
      defaultValue: 1000,
      min: 1,
      max: 50_000,
    }),
  };
}

async function ensureRunDoesNotExist(runId) {
  const emailPrefix = `stress.user.${runId.toLowerCase()}.`;
  const brigadePrefix = `STR-${runId}-`;
  const casePrefix = `SISCA-STRESS-${runId}-`;
  const [users, brigades, cases] = await Promise.all([
    prisma.usuario.count({ where: { correo: { startsWith: emailPrefix } } }),
    prisma.brigada.count({ where: { numero: { startsWith: brigadePrefix } } }),
    prisma.casiAccidente.count({ where: { correlativo: { startsWith: casePrefix } } }),
  ]);

  if (users || brigades || cases) {
    throw new Error(
      `Ya existen datos para STRESS_RUN_ID=${runId} ` +
        `(usuarios=${users}, brigadas=${brigades}, casos=${cases}). ` +
        'Use otro runId o ejecute db:clear:stress antes de repetirlo.',
    );
  }
}

async function loadCatalogs() {
  const [role, processes, eventTypes, criticalities, caseStates, actionStates, brigadeTypes, locations] =
    await Promise.all([
      prisma.rol.findUnique({ where: { nombre: 'Brigada' }, select: { id: true } }),
      prisma.proceso.findMany({
        where: { activo: true, area: { activo: true } },
        select: { id: true, areaId: true },
        orderBy: { id: 'asc' },
      }),
      prisma.tipoEvento.findMany({ where: { activo: true }, select: { id: true }, orderBy: { id: 'asc' } }),
      prisma.criticidad.findMany({ where: { activo: true }, select: { id: true }, orderBy: { orden: 'asc' } }),
      prisma.estadoCaso.findMany({
        where: { activo: true },
        select: { id: true, esFinal: true },
        orderBy: { orden: 'asc' },
      }),
      prisma.estadoAccion.findMany({
        where: { activo: true },
        select: { id: true, esFinal: true },
        orderBy: { orden: 'asc' },
      }),
      prisma.tipoBrigada.findMany({ where: { activo: true }, select: { id: true }, orderBy: { id: 'asc' } }),
      prisma.municipio.findMany({
        where: { activo: true, departamento: { activo: true, region: { activo: true } } },
        select: {
          id: true,
          departamentoId: true,
          departamento: { select: { codigo: true, regionId: true } },
        },
        orderBy: { id: 'asc' },
      }),
    ]);

  const missing = [
    !role && 'rol Brigada',
    !processes.length && 'procesos/áreas',
    !eventTypes.length && 'tipos de evento',
    !criticalities.length && 'criticidades',
    !caseStates.length && 'estados de caso',
    !actionStates.length && 'estados de acción',
    !brigadeTypes.length && 'tipos de brigada',
    !locations.length && 'regiones/departamentos/municipios',
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(`Faltan catálogos requeridos: ${missing.join(', ')}. Ejecute npm run db:seed.`);
  }

  return { role, processes, eventTypes, criticalities, caseStates, actionStates, brigadeTypes, locations };
}

async function createUsers(config, role, passwordHash, counters) {
  const emailPrefix = `stress.user.${config.runId.toLowerCase()}.`;
  const rows = Array.from({ length: config.users }, (_, index) => {
    const sequence = index + 1;
    return {
      nombre: `Usuario Stress ${pad(sequence, 6)} [${config.runId}]`,
      correo: `${emailPrefix}${pad(sequence, 6)}@sisca.local`,
      passwordHash,
      activo: true,
    };
  });

  counters.users = await createManyInChunks(prisma.usuario, rows, {
    batchSize: config.batchSize,
    fieldsPerRow: 4,
  });
  const users = await prisma.usuario.findMany({
    where: { correo: { startsWith: emailPrefix } },
    select: { id: true, correo: true },
    orderBy: { correo: 'asc' },
  });

  if (users.length !== config.users) {
    throw new Error(`Se esperaban ${config.users} usuarios del run y se recuperaron ${users.length}.`);
  }

  counters.userRoles = await createManyInChunks(
    prisma.usuarioRol,
    users.map((user) => ({ usuarioId: user.id, rolId: role.id })),
    { batchSize: config.batchSize, fieldsPerRow: 2, skipDuplicates: true },
  );
  console.log(`[usuarios] ${counters.users}/${config.users} insertados; ${counters.userRoles} roles asignados`);
  return users;
}

async function createBrigades(config, catalogs, users, counters) {
  if (!config.brigades) {
    console.log('[brigadas] 0 solicitadas');
    return [];
  }

  const brigadePrefix = `STR-${config.runId}-`;
  const rows = Array.from({ length: config.brigades }, (_, index) => {
    const sequence = index + 1;
    const location = catalogs.locations[index % catalogs.locations.length];
    return {
      numero: `${brigadePrefix}${location.departamento.codigo}-${pad(sequence, 4)}`,
      nombre: `[STRESS TEST ${config.runId}] Brigada ${pad(sequence, 4)}`,
      tipoBrigadaId: catalogs.brigadeTypes[index % catalogs.brigadeTypes.length].id,
      regionId: location.departamento.regionId,
      departamentoId: location.departamentoId,
      municipioId: location.id,
      activo: true,
    };
  });

  counters.brigades = await createManyInChunks(prisma.brigada, rows, {
    batchSize: config.batchSize,
    fieldsPerRow: 7,
  });
  const brigades = await prisma.brigada.findMany({
    where: { numero: { startsWith: brigadePrefix } },
    select: { id: true, numero: true },
    orderBy: { numero: 'asc' },
  });
  const membersPerBrigade = Math.min(config.membersPerBrigade, users.length);
  const memberRows = [];

  for (let brigadeIndex = 0; brigadeIndex < brigades.length; brigadeIndex += 1) {
    for (let memberIndex = 0; memberIndex < membersPerBrigade; memberIndex += 1) {
      const user = users[(brigadeIndex * Math.max(1, membersPerBrigade) + memberIndex) % users.length];
      memberRows.push({
        brigadaId: brigades[brigadeIndex].id,
        usuarioId: user.id,
        cargoEnBrigada: memberIndex === 0 ? 'Líder Stress' : 'Integrante Stress',
        esLider: memberIndex === 0,
        activo: true,
        fechaDesde: new Date(),
      });
    }
  }

  counters.members = await createManyInChunks(prisma.brigadaMiembro, memberRows, {
    batchSize: config.batchSize,
    fieldsPerRow: 6,
  });
  console.log(
    `[brigadas] ${counters.brigades}/${config.brigades} insertadas; ${counters.members} miembros asignados`,
  );
  return brigades;
}

function buildCaseRows(config, catalogs, users, brigades, offset, size, now) {
  return Array.from({ length: size }, (_, localIndex) => {
    const globalIndex = offset + localIndex;
    const sequence = globalIndex + 1;
    const process = catalogs.processes[globalIndex % catalogs.processes.length];
    const eventDate = new Date(
      now.getTime() - ((globalIndex % 365) + 1) * DAY_MS - (globalIndex % 24) * 60 * 60 * 1000,
    );
    const hasBrigade =
      brigades.length > 0 &&
      ((globalIndex * 53) % 100) < config.casesWithBrigadePercent;

    return {
      correlativo: `SISCA-STRESS-${config.runId}-${pad(sequence, 7)}`,
      titulo: `[STRESS TEST ${config.runId}] Caso ${pad(sequence, 7)}`,
      descripcion: `[STRESS TEST ${config.runId}] Registro falso para pruebas de APIs y rendimiento.`,
      fechaHoraEvento: eventDate,
      fechaReporte: new Date(eventDate.getTime() + 60 * 60 * 1000),
      ubicacion: `[STRESS TEST] Ubicación simulada ${(globalIndex % 100) + 1}`,
      areaId: process.areaId,
      procesoId: process.id,
      tipoEventoId: catalogs.eventTypes[globalIndex % catalogs.eventTypes.length].id,
      criticidadId: catalogs.criticalities[globalIndex % catalogs.criticalities.length].id,
      estadoCasoId: catalogs.caseStates[globalIndex % catalogs.caseStates.length].id,
      reportadoPorId: users[globalIndex % users.length].id,
      brigadaReportanteId: hasBrigade ? brigades[globalIndex % brigades.length].id : null,
    };
  });
}

async function createCaseDependencies(config, catalogs, users, caseRows, createdCases, offset, counters, now) {
  const metadataByCorrelative = new Map(
    caseRows.map((row, localIndex) => [row.correlativo, { row, globalIndex: offset + localIndex }]),
  );
  const reports = [];
  const actions = [];
  const logEntries = [];
  const notifications = [];
  const evidence = [];

  for (const currentCase of createdCases) {
    const metadata = metadataByCorrelative.get(currentCase.correlativo);
    if (!metadata) throw new Error(`No se encontró metadata para ${currentCase.correlativo}.`);

    const { row, globalIndex } = metadata;
    reports.push({
      casiAccidenteId: currentCase.id,
      descripcionDetallada: `[STRESS TEST ${config.runId}] Descripción detallada simulada.`,
      condicionDetectada: '[STRESS TEST] Condición insegura simulada.',
      accionInmediata: '[STRESS TEST] Señalización preventiva simulada.',
      observaciones: '[STRESS TEST] Reporte inicial generado automáticamente.',
      personasInvolucradas: 'Personas ficticias de prueba',
      medidasInmediatas: 'Aislamiento simulado del área',
      huboLesion: globalIndex % 20 === 0,
      huboDanoMaterial: globalIndex % 7 === 0,
    });

    const hasActions = ((globalIndex * 37) % 100) < config.casesWithActionsPercent;
    if (hasActions) {
      for (let actionIndex = 0; actionIndex < config.actionsPerCase; actionIndex += 1) {
        const state = catalogs.actionStates[(globalIndex + actionIndex) % catalogs.actionStates.length];
        const isPastDue = (globalIndex + actionIndex) % 2 === 0;
        actions.push({
          casiAccidenteId: currentCase.id,
          responsableId: users[(globalIndex + actionIndex) % users.length].id,
          estadoAccionId: state.id,
          titulo: `[STRESS TEST ${config.runId}] Acción ${actionIndex + 1}`,
          descripcion: '[STRESS TEST] Acción correctiva ficticia generada automáticamente.',
          fechaCompromiso: new Date(now.getTime() + (isPastDue ? -15 : 30) * DAY_MS),
          fechaCierre: state.esFinal ? new Date(now.getTime() - 2 * DAY_MS) : null,
          porcentajeAvance: state.esFinal ? 100 : (globalIndex % 4) * 25,
          observacion: '[STRESS TEST] Información sin validez operativa.',
        });
      }
    }

    const caseLogEntries = itemsForIndex(globalIndex, config.cases, config.logEntries);
    for (let entryIndex = 0; entryIndex < caseLogEntries; entryIndex += 1) {
      logEntries.push({
        casiAccidenteId: currentCase.id,
        usuarioId: users[(globalIndex + entryIndex) % users.length].id,
        estadoAnteriorId: null,
        estadoNuevoId: row.estadoCasoId,
        accionRealizada: '[STRESS TEST] Registro automático',
        observacion: `[STRESS TEST ${config.runId}] Evento ficticio de bitácora.`,
        fecha: new Date(row.fechaReporte.getTime() + entryIndex * 60 * 1000),
      });
    }

    const caseNotifications = itemsForIndex(globalIndex, config.cases, config.notifications);
    for (let notificationIndex = 0; notificationIndex < caseNotifications; notificationIndex += 1) {
      const read = (globalIndex + notificationIndex) % 2 === 0;
      notifications.push({
        usuarioId: users[(globalIndex + notificationIndex) % users.length].id,
        casiAccidenteId: currentCase.id,
        tipo: 'STRESS_TEST',
        titulo: `[STRESS TEST ${config.runId}] Notificación simulada`,
        mensaje: '[STRESS TEST] Notificación ficticia para pruebas de volumen.',
        leida: read,
        fechaLectura: read ? now : null,
        createdAt: row.fechaReporte,
      });
    }

    const caseEvidence = itemsForIndex(globalIndex, config.cases, config.evidence);
    for (let evidenceIndex = 0; evidenceIndex < caseEvidence; evidenceIndex += 1) {
      const sequence = counters.evidence + evidence.length + 1;
      evidence.push({
        casiAccidenteId: currentCase.id,
        accionCorrectivaId: null,
        subidoPorId: users[(globalIndex + evidenceIndex) % users.length].id,
        nombreArchivo: 'dummy-evidence.txt',
        nombreAlmacenado: `stress-${config.runId.toLowerCase()}-${pad(sequence, 8)}.txt`,
        rutaArchivo: 'prisma/stress/dummy-evidence.txt',
        tipoMime: 'text/plain',
        tamanoBytes: 76,
        descripcion: `[STRESS TEST ${config.runId}] Evidencia dummy reutilizable.`,
      });
    }
  }

  counters.reports += await createManyInChunks(prisma.reporteInicial, reports, {
    batchSize: config.batchSize,
    fieldsPerRow: 9,
  });
  counters.actions += await createManyInChunks(prisma.accionCorrectiva, actions, {
    batchSize: config.batchSize,
    fieldsPerRow: 9,
  });
  counters.logEntries += await createManyInChunks(prisma.bitacoraCaso, logEntries, {
    batchSize: config.batchSize,
    fieldsPerRow: 7,
  });
  counters.notifications += await createManyInChunks(prisma.notificacion, notifications, {
    batchSize: config.batchSize,
    fieldsPerRow: 8,
  });
  counters.evidence += await createManyInChunks(prisma.evidencia, evidence, {
    batchSize: config.batchSize,
    fieldsPerRow: 9,
  });
}

async function createCases(config, catalogs, users, brigades, counters) {
  const now = new Date();

  for (let offset = 0; offset < config.cases; offset += config.batchSize) {
    const size = Math.min(config.batchSize, config.cases - offset);
    const rows = buildCaseRows(config, catalogs, users, brigades, offset, size, now);
    counters.cases += await createManyInChunks(prisma.casiAccidente, rows, {
      batchSize: config.batchSize,
      fieldsPerRow: 13,
    });
    const createdCases = await prisma.casiAccidente.findMany({
      where: { correlativo: { in: rows.map((row) => row.correlativo) } },
      select: { id: true, correlativo: true },
    });

    if (createdCases.length !== rows.length) {
      throw new Error(`El lote esperaba ${rows.length} casos y recuperó ${createdCases.length}.`);
    }

    await createCaseDependencies(config, catalogs, users, rows, createdCases, offset, counters, now);
    console.log(
      `[casos] ${offset + size}/${config.cases} | reportes=${counters.reports} ` +
        `acciones=${counters.actions} bitácora=${counters.logEntries} ` +
        `notificaciones=${counters.notifications} evidencias=${counters.evidence}`,
    );
  }
}

async function main() {
  const startedAt = Date.now();
  assertNonProduction();
  requireConfirmation('CONFIRM_STRESS_SEED');
  const config = readConfiguration();
  console.log('[STRESS TEST] Configuración efectiva:');
  console.table(config);
  await ensureRunDoesNotExist(config.runId);

  const catalogs = await loadCatalogs();
  const passwordHash = await bcrypt.hash('StressTest123*', 10);
  const counters = {
    users: 0,
    userRoles: 0,
    brigades: 0,
    members: 0,
    cases: 0,
    reports: 0,
    actions: 0,
    logEntries: 0,
    notifications: 0,
    evidence: 0,
  };

  const users = await createUsers(config, catalogs.role, passwordHash, counters);
  const brigades = await createBrigades(config, catalogs, users, counters);
  await createCases(config, catalogs, users, brigades, counters);

  console.log('[STRESS TEST] Carga completada correctamente.');
  console.table({ ...counters, elapsed: elapsed(startedAt), runId: config.runId });
}

main()
  .catch((error) => {
    console.error(`[STRESS TEST] Error: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
