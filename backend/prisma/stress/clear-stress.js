const {
  assertNonProduction,
  elapsed,
  normalizeRunId,
  parseArguments,
  readInteger,
  requireConfirmation,
} = require('./stress-utils');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteByIdBatches(delegate, where, batchSize, label, beforeDelete) {
  let deleted = 0;

  while (true) {
    const records = await delegate.findMany({
      where,
      select: { id: true },
      orderBy: { id: 'asc' },
      take: batchSize,
    });
    if (!records.length) break;

    const ids = records.map((record) => record.id);
    if (beforeDelete) await beforeDelete(ids);
    const result = await delegate.deleteMany({ where: { id: { in: ids } } });
    deleted += result.count;
    console.log(`[limpieza:${label}] ${deleted} eliminados`);
  }

  return deleted;
}

function buildFilters(runId) {
  return {
    cases: {
      AND: [
        { correlativo: { startsWith: runId ? `SISCA-STRESS-${runId}-` : 'SISCA-STRESS-' } },
        { descripcion: { startsWith: '[STRESS TEST ' } },
      ],
    },
    brigades: {
      AND: [
        { numero: { startsWith: runId ? `STR-${runId}-` : 'STR-' } },
        { nombre: { startsWith: runId ? `[STRESS TEST ${runId}]` : '[STRESS TEST ' } },
      ],
    },
    users: {
      AND: [
        { correo: { startsWith: runId ? `stress.user.${runId.toLowerCase()}.` : 'stress.user.' } },
        { correo: { endsWith: '@sisca.local' } },
        { nombre: { startsWith: 'Usuario Stress ' } },
      ],
    },
  };
}

async function countCaseDependencies(caseFilter) {
  const relationFilter = { casiAccidente: caseFilter };
  const [reports, validations, disclosures, actions, evidence, logEntries, notifications, comments] =
    await Promise.all([
      prisma.reporteInicial.count({ where: relationFilter }),
      prisma.validacionProcedencia.count({ where: relationFilter }),
      prisma.divulgacionCaso.count({ where: relationFilter }),
      prisma.accionCorrectiva.count({ where: relationFilter }),
      prisma.evidencia.count({ where: relationFilter }),
      prisma.bitacoraCaso.count({ where: relationFilter }),
      prisma.notificacion.count({ where: relationFilter }),
      prisma.comentarioObservacion.count({ where: relationFilter }),
    ]);

  return { reports, validations, disclosures, actions, evidence, logEntries, notifications, comments };
}

async function main() {
  const startedAt = Date.now();
  assertNonProduction();
  requireConfirmation('CONFIRM_CLEAR_STRESS');
  const args = parseArguments();
  const configuredRunId = args.get('run-id') ?? process.env.STRESS_RUN_ID;
  const runId = configuredRunId ? normalizeRunId(configuredRunId) : null;
  const batchSize = readInteger({
    args,
    argumentName: 'batch-size',
    environmentName: 'BATCH_SIZE',
    defaultValue: 1000,
    min: 1,
    max: 50_000,
  });
  const filters = buildFilters(runId);
  const [caseCount, brigadeCount, userCount, dependencies] = await Promise.all([
    prisma.casiAccidente.count({ where: filters.cases }),
    prisma.brigada.count({ where: filters.brigades }),
    prisma.usuario.count({ where: filters.users }),
    countCaseDependencies(filters.cases),
  ]);

  console.log(`[STRESS CLEAR] Alcance: ${runId ? `run ${runId}` : 'todos los runs STRESS'}`);
  console.table({ cases: caseCount, brigades: brigadeCount, users: userCount, ...dependencies });

  const deletedCases = await deleteByIdBatches(
    prisma.casiAccidente,
    filters.cases,
    batchSize,
    'casos',
  );
  const deletedBrigades = await deleteByIdBatches(
    prisma.brigada,
    filters.brigades,
    batchSize,
    'brigadas',
    async (brigadeIds) => {
      await prisma.brigadaMiembro.deleteMany({ where: { brigadaId: { in: brigadeIds } } });
    },
  );
  const deletedUsers = await deleteByIdBatches(
    prisma.usuario,
    filters.users,
    batchSize,
    'usuarios',
    async (userIds) => {
      await prisma.notificacion.deleteMany({
        where: { usuarioId: { in: userIds }, tipo: 'STRESS_TEST' },
      });
      await prisma.usuarioRol.deleteMany({ where: { usuarioId: { in: userIds } } });
    },
  );

  console.log('[STRESS CLEAR] Limpieza completada sin usar filtros sobre datos normales.');
  console.table({ deletedCases, deletedBrigades, deletedUsers, elapsed: elapsed(startedAt) });
}

main()
  .catch((error) => {
    console.error(`[STRESS CLEAR] Error: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
