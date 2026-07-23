const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const { PrismaClient } = require('@prisma/client');
const {
  GeographyValidationError,
  buildGeographyPlan,
  loadGeographySnapshot,
  synchronizeGeography,
  validateDatabaseSnapshot,
  validateGeographyData,
  validateUtf8SourceFile,
} = require('./lib/seed-geografia-lib');

const SOURCE_PATH = path.resolve(__dirname, 'data/geografia-guatemala.js');

function parseMode(argv) {
  const dryRun = argv.includes('--dry-run');
  const apply = argv.includes('--apply');
  const unknown = argv.filter((argument) => !['--dry-run', '--apply'].includes(argument));

  if (unknown.length || dryRun === apply) {
    throw new Error(
      'Debe indicar exactamente un modo: --dry-run o --apply. No se ejecutó ninguna escritura.',
    );
  }
  return apply ? 'apply' : 'dry-run';
}

function getSafeDatabaseTarget() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error('DATABASE_URL no está configurada.');
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('DATABASE_URL no tiene un formato URL válido.');
  }

  return {
    host: parsed.hostname || '(no definido)',
    port: parsed.port || '(predeterminado)',
    database: decodeURIComponent(parsed.pathname.replace(/^\//u, '')) || '(no definido)',
    schema: parsed.searchParams.get('schema') || 'public',
  };
}

function assertApplyConfirmation(mode) {
  if (mode !== 'apply') return;

  if (process.env.CONFIRM_GEOGRAPHY_SEED !== 'YES') {
    throw new Error(
      'El modo --apply exige CONFIRM_GEOGRAPHY_SEED=YES. No se ejecutó ninguna escritura.',
    );
  }

  if (
    process.env.NODE_ENV === 'production' &&
    process.env.CONFIRM_PRODUCTION_GEOGRAPHY !== 'YES'
  ) {
    throw new Error(
      'Producción exige además CONFIRM_PRODUCTION_GEOGRAPHY=YES. No se ejecutó ninguna escritura.',
    );
  }
}

function printHeading(title) {
  console.log(`\n${title}`);
}

function printSourceSummary(validation, utf8) {
  printHeading('GEOGRAFÍA DEL ARCHIVO');
  console.log(`- Regiones encontradas: ${validation.counts.regions}`);
  console.log(`- Departamentos encontrados: ${validation.counts.departments}`);
  console.log(`- Municipios encontrados: ${validation.counts.municipalities}`);
  console.log(`- UTF-8 válido: sí${utf8.hasBom ? ' (con BOM)' : ' (sin BOM)'}`);
}

function printDatabaseSummary(databaseValidation) {
  const { counts } = databaseValidation;
  printHeading('ESTADO ACTUAL EN BASE');
  console.log(`- Regiones existentes: ${counts.regions}`);
  console.log(`- Departamentos existentes: ${counts.departments}`);
  console.log(`- Municipios existentes: ${counts.municipalities}`);
  console.log(`- Brigadas existentes: ${counts.brigades}`);
  console.log(`- Brigadas relacionadas con región: ${counts.brigadesWithRegion}`);
  console.log(`- Brigadas relacionadas con departamento: ${counts.brigadesWithDepartment}`);
  console.log(`- Brigadas relacionadas con municipio: ${counts.brigadesWithMunicipality}`);
}

function printPlan(plan) {
  const labels = {
    regions: 'Regiones',
    departments: 'Departamentos',
    municipalities: 'Municipios',
  };

  printHeading('OPERACIONES PLANIFICADAS');
  for (const [level, label] of Object.entries(labels)) {
    console.log(`- ${label} a crear: ${plan.summary[level].create}`);
    console.log(`- ${label} a actualizar: ${plan.summary[level].update}`);
    console.log(`- ${label} sin cambios: ${plan.summary[level].unchanged}`);
  }
  console.log(`- Conflictos: ${plan.conflicts.length}`);

  const changes = Object.values(plan.operations)
    .flat()
    .filter(({ action }) => action !== 'unchanged');
  for (const operation of changes) {
    const fields =
      operation.action === 'update'
        ? ` (${Object.keys(operation.changes).join(', ')})`
        : '';
    console.log(
      `  · ${operation.action === 'create' ? 'CREAR' : 'ACTUALIZAR'} ${operation.path}: ${operation.desired.nombre}${fields}`,
    );
  }
}

function printIssues(title, issues) {
  if (!issues.length) return;
  printHeading(title);
  for (const issue of issues) {
    console.error(`- ${issue.path} | ${issue.name || '(sin nombre)'} | ${issue.message}`);
  }
}

function sameCatalogCounts(before, after) {
  return (
    before.regions === after.regions &&
    before.departments === after.departments &&
    before.municipalities === after.municipalities &&
    before.brigades === after.brigades
  );
}

async function main() {
  const startedAt = Date.now();
  const mode = parseMode(process.argv.slice(2));
  const databaseTarget = getSafeDatabaseTarget();
  assertApplyConfirmation(mode);

  console.log('ENTORNO');
  console.log(`- NODE_ENV: ${process.env.NODE_ENV || '(no definido)'}`);
  console.log(`- Host de base: ${databaseTarget.host}`);
  console.log(`- Puerto: ${databaseTarget.port}`);
  console.log(`- Base de datos: ${databaseTarget.database}`);
  console.log(`- Esquema: ${databaseTarget.schema}`);
  console.log(`- Modo: ${mode}`);

  const utf8 = validateUtf8SourceFile(SOURCE_PATH);
  const geografiaGuatemala = require(SOURCE_PATH);
  const sourceValidation = validateGeographyData(geografiaGuatemala);
  printSourceSummary(sourceValidation, utf8);
  printIssues('ADVERTENCIAS DEL ARCHIVO', sourceValidation.warnings);
  printIssues('ERRORES DEL ARCHIVO', sourceValidation.errors);

  if (sourceValidation.errors.length) {
    throw new GeographyValidationError(
      'La fuente geográfica no pasó la validación; no se escribió ningún dato.',
      sourceValidation.errors,
    );
  }

  const prisma = new PrismaClient();
  try {
    const beforeSnapshot = await loadGeographySnapshot(prisma);
    const beforeValidation = validateDatabaseSnapshot(beforeSnapshot);
    const plan = buildGeographyPlan(geografiaGuatemala, beforeSnapshot);

    printDatabaseSummary(beforeValidation);
    printPlan(plan);
    printIssues('CONFLICTOS', plan.conflicts);

    if (plan.conflicts.length) {
      throw new GeographyValidationError(
        'Hay conflictos que impiden una carga segura; no se escribió ningún dato.',
        plan.conflicts,
      );
    }

    let resultPlan = plan;
    if (mode === 'apply') {
      const result = await synchronizeGeography({
        prisma,
        geography: geografiaGuatemala,
      });
      resultPlan = result.plan;
    }

    const afterSnapshot = await loadGeographySnapshot(prisma);
    const afterValidation = validateDatabaseSnapshot(afterSnapshot);
    const countsUnchanged = sameCatalogCounts(beforeValidation.counts, afterValidation.counts);
    const residualPlan =
      mode === 'apply' ? buildGeographyPlan(geografiaGuatemala, afterSnapshot) : null;
    const residualChanges = residualPlan
      ? Object.values(residualPlan.operations)
          .flat()
          .filter(({ action }) => action !== 'unchanged').length
      : 0;
    const postApplyIssues = [
      ...afterValidation.issues,
      ...(residualPlan?.conflicts || []),
      ...(residualChanges
        ? [
            {
              path: 'resultado.apply',
              name: '',
              message: `Persisten ${residualChanges} operación(es) después de aplicar.`,
            },
          ]
        : []),
    ];

    printHeading('VALIDACIÓN DE RELACIONES');
    console.log(
      `- Departamentos sin región: ${afterValidation.catalogIntegrity.departmentsWithoutRegion}`,
    );
    console.log(
      `- Municipios sin departamento: ${afterValidation.catalogIntegrity.municipalitiesWithoutDepartment}`,
    );
    console.log(
      `- Duplicados por clave natural normalizada: ${afterValidation.issues.filter(({ path: issuePath }) => !issuePath.startsWith('brigadas.')).length}`,
    );
    const brigadeLabels = {
      missingRegion: 'con región inexistente',
      missingDepartment: 'con departamento inexistente',
      missingMunicipality: 'con municipio inexistente',
      regionDepartmentMismatch: 'cuya región no coincide con su departamento',
      departmentMunicipalityMismatch: 'cuyo departamento no coincide con su municipio',
      regionMunicipalityMismatch: 'cuya región no coincide con la región de su municipio',
    };
    for (const [key, value] of Object.entries(afterValidation.brigadeIntegrity)) {
      console.log(`- Brigadas ${brigadeLabels[key]}: ${value}`);
    }

    printHeading('RESULTADO');
    console.log(
      `- Creados: ${Object.values(resultPlan.summary).reduce((sum, item) => sum + item.create, 0)}`,
    );
    console.log(
      `- Actualizados: ${Object.values(resultPlan.summary).reduce((sum, item) => sum + item.update, 0)}`,
    );
    console.log(
      `- Sin cambios: ${Object.values(resultPlan.summary).reduce((sum, item) => sum + item.unchanged, 0)}`,
    );
    console.log(`- Errores: ${postApplyIssues.length}`);
    console.log(
      `- Conteos antes: ${beforeValidation.counts.regions}/${beforeValidation.counts.departments}/${beforeValidation.counts.municipalities}`,
    );
    console.log(
      `- Conteos después: ${afterValidation.counts.regions}/${afterValidation.counts.departments}/${afterValidation.counts.municipalities}`,
    );
    console.log(
      `- Conteos sin cambios en dry-run: ${
        mode === 'dry-run' && countsUnchanged ? 'sí' : mode === 'dry-run' ? 'no' : 'no aplica'
      }`,
    );
    console.log(`- Duración: ${Date.now() - startedAt} ms`);

    if (postApplyIssues.length) {
      printIssues('ERRORES POSTERIORES', postApplyIssues);
      throw new GeographyValidationError(
        'La validación posterior detectó inconsistencias.',
        postApplyIssues,
      );
    }
    if (mode === 'dry-run' && !countsUnchanged) {
      throw new Error(
        'Los conteos cambiaron durante el dry-run por una operación externa; revise la concurrencia.',
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  if (!(error instanceof GeographyValidationError)) {
    console.error(`\nERROR: ${error.message}`);
  } else {
    console.error(`\nERROR: ${error.message}`);
  }
  process.exitCode = 1;
});
