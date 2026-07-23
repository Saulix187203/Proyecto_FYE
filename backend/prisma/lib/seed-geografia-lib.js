const fs = require('fs');
const { Prisma } = require('@prisma/client');

const MAX_NAME_LENGTH = 120;
const MAX_CODE_LENGTH = 30;

class GeographyValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'GeographyValidationError';
    this.details = details;
  }
}

function canonicalName(value) {
  return value.trim().replace(/\s+/gu, ' ');
}

function normalizeName(value) {
  return canonicalName(value).toLocaleLowerCase('es-GT');
}

function canonicalCode(value) {
  return value.trim();
}

function normalizeCode(value) {
  return canonicalCode(value).toLocaleUpperCase('es-GT');
}

function validateUtf8SourceFile(filePath) {
  const bytes = fs.readFileSync(filePath);
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);

  if (text.includes('\uFFFD')) {
    throw new GeographyValidationError(
      `El archivo contiene caracteres de reemplazo UTF-8: ${filePath}`,
    );
  }

  return { bytes: bytes.length, hasBom: text.charCodeAt(0) === 0xfeff };
}

function addDuplicateError(errors, seen, key, path, field, value) {
  const previousPath = seen.get(key);
  if (previousPath) {
    errors.push({
      path: `${path}.${field}`,
      name: value,
      message: `Valor duplicado; también aparece en ${previousPath}.${field}.`,
    });
    return;
  }
  seen.set(key, path);
}

function validateTextField(errors, item, field, path, maxLength) {
  const value = item?.[field];
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push({
      path: `${path}.${field}`,
      name: String(value ?? ''),
      message: 'Debe ser una cadena no vacía.',
    });
    return false;
  }

  if (value !== canonicalName(value)) {
    errors.push({
      path: `${path}.${field}`,
      name: value,
      message: 'Contiene espacios iniciales, finales o consecutivos.',
    });
  }

  if (value.length > maxLength) {
    errors.push({
      path: `${path}.${field}`,
      name: value,
      message: `Excede el máximo de ${maxLength} caracteres definido por Prisma.`,
    });
  }

  return true;
}

function validateGeographyData(geography) {
  const errors = [];
  const warnings = [];
  const counts = { regions: 0, departments: 0, municipalities: 0 };
  const globalCodes = new Map();
  const ineCodes = new Map();
  const regionNames = new Map();

  if (!Array.isArray(geography)) {
    return {
      counts,
      errors: [
        {
          path: 'geografiaGuatemala',
          name: '',
          message: 'La exportación debe ser un arreglo.',
        },
      ],
      warnings,
    };
  }

  for (const [regionIndex, region] of geography.entries()) {
    const regionPath = `geografiaGuatemala[${regionIndex}]`;
    counts.regions += 1;

    if (!region || typeof region !== 'object' || Array.isArray(region)) {
      errors.push({ path: regionPath, name: '', message: 'La región debe ser un objeto.' });
      continue;
    }

    const validName = validateTextField(
      errors,
      region,
      'nombre',
      regionPath,
      MAX_NAME_LENGTH,
    );
    const validCode = validateTextField(
      errors,
      region,
      'codigo',
      regionPath,
      MAX_CODE_LENGTH,
    );

    if (validName) {
      addDuplicateError(
        errors,
        regionNames,
        normalizeName(region.nombre),
        regionPath,
        'nombre',
        region.nombre,
      );
    }
    if (validCode) {
      addDuplicateError(
        errors,
        globalCodes,
        normalizeCode(region.codigo),
        regionPath,
        'codigo',
        region.codigo,
      );
    }

    if (!Array.isArray(region.departamentos)) {
      errors.push({
        path: `${regionPath}.departamentos`,
        name: region.nombre || '',
        message: 'Debe ser un arreglo; el departamento quedaría sin región válida.',
      });
      continue;
    }

    const departmentNames = new Map();
    const departmentCodes = new Map();

    for (const [departmentIndex, department] of region.departamentos.entries()) {
      const departmentPath = `${regionPath}.departamentos[${departmentIndex}]`;
      counts.departments += 1;

      if (!department || typeof department !== 'object' || Array.isArray(department)) {
        errors.push({
          path: departmentPath,
          name: '',
          message: 'El departamento debe ser un objeto.',
        });
        continue;
      }

      const departmentNameValid = validateTextField(
        errors,
        department,
        'nombre',
        departmentPath,
        MAX_NAME_LENGTH,
      );
      const departmentCodeValid = validateTextField(
        errors,
        department,
        'codigo',
        departmentPath,
        MAX_CODE_LENGTH,
      );

      if (departmentNameValid) {
        addDuplicateError(
          errors,
          departmentNames,
          normalizeName(department.nombre),
          departmentPath,
          'nombre',
          department.nombre,
        );
      }
      if (departmentCodeValid) {
        const normalizedCode = normalizeCode(department.codigo);
        addDuplicateError(
          errors,
          departmentCodes,
          normalizedCode,
          departmentPath,
          'codigo',
          department.codigo,
        );
        addDuplicateError(
          errors,
          globalCodes,
          normalizedCode,
          departmentPath,
          'codigo',
          department.codigo,
        );
      }

      if (!Array.isArray(department.municipios)) {
        errors.push({
          path: `${departmentPath}.municipios`,
          name: department.nombre || '',
          message: 'Debe ser un arreglo; los municipios quedarían sin departamento válido.',
        });
        continue;
      }

      const municipalityNames = new Map();
      const municipalityCodes = new Map();

      for (const [municipalityIndex, municipality] of department.municipios.entries()) {
        const municipalityPath = `${departmentPath}.municipios[${municipalityIndex}]`;
        counts.municipalities += 1;

        if (!municipality || typeof municipality !== 'object' || Array.isArray(municipality)) {
          errors.push({
            path: municipalityPath,
            name: '',
            message: 'El municipio debe ser un objeto.',
          });
          continue;
        }

        const municipalityNameValid = validateTextField(
          errors,
          municipality,
          'nombre',
          municipalityPath,
          MAX_NAME_LENGTH,
        );
        const municipalityCodeValid = validateTextField(
          errors,
          municipality,
          'codigo',
          municipalityPath,
          MAX_CODE_LENGTH,
        );
        const ineCodeValid = validateTextField(
          errors,
          municipality,
          'codigoIne',
          municipalityPath,
          4,
        );

        if (municipalityNameValid) {
          addDuplicateError(
            errors,
            municipalityNames,
            normalizeName(municipality.nombre),
            municipalityPath,
            'nombre',
            municipality.nombre,
          );
        }
        if (municipalityCodeValid) {
          const normalizedCode = normalizeCode(municipality.codigo);
          addDuplicateError(
            errors,
            municipalityCodes,
            normalizedCode,
            municipalityPath,
            'codigo',
            municipality.codigo,
          );
          addDuplicateError(
            errors,
            globalCodes,
            normalizedCode,
            municipalityPath,
            'codigo',
            municipality.codigo,
          );
        }
        if (ineCodeValid) {
          if (!/^\d{4}$/u.test(municipality.codigoIne)) {
            errors.push({
              path: `${municipalityPath}.codigoIne`,
              name: municipality.nombre || '',
              message: 'El código INE debe contener exactamente cuatro dígitos.',
            });
          }
          addDuplicateError(
            errors,
            ineCodes,
            municipality.codigoIne,
            municipalityPath,
            'codigoIne',
            municipality.codigoIne,
          );
        }
      }
    }
  }

  if (counts.departments !== 22) {
    errors.push({
      path: 'geografiaGuatemala',
      name: '',
      message: `El archivo contiene ${counts.departments} departamentos; Guatemala tiene 22.`,
    });
  }

  return { counts, errors, warnings };
}

function groupBy(items, keySelector) {
  const result = new Map();
  for (const item of items) {
    const key = keySelector(item);
    const values = result.get(key) || [];
    values.push(item);
    result.set(key, values);
  }
  return result;
}

function uniqueRecords(records) {
  return [...new Map(records.map((record) => [record.id, record])).values()];
}

async function loadGeographySnapshot(client) {
  const [regions, departments, municipalities, brigades] = await Promise.all([
    client.region.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, nombre: true, codigo: true, activo: true },
    }),
    client.departamento.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, nombre: true, codigo: true, activo: true, regionId: true },
    }),
    client.municipio.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, nombre: true, codigo: true, activo: true, departamentoId: true },
    }),
    client.brigada.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, regionId: true, departamentoId: true, municipioId: true },
    }),
  ]);

  return { regions, departments, municipalities, brigades };
}

function duplicateIssues(items, keySelector, label, parentSelector = () => '') {
  const groups = groupBy(items, (item) => `${parentSelector(item)}\u0000${keySelector(item)}`);
  const issues = [];

  for (const records of groups.values()) {
    if (records.length > 1) {
      issues.push({
        path: `${label}[ids=${records.map(({ id }) => id).join(',')}]`,
        name: records.map(({ nombre }) => nombre).join(' / '),
        message: 'Duplicado existente por clave natural normalizada.',
      });
    }
  }

  return issues;
}

function validateDatabaseSnapshot(snapshot) {
  const issues = [
    ...duplicateIssues(snapshot.regions, (item) => normalizeName(item.nombre), 'regiones'),
    ...duplicateIssues(snapshot.regions, (item) => normalizeCode(item.codigo), 'regiones.codigo'),
    ...duplicateIssues(
      snapshot.departments,
      (item) => normalizeName(item.nombre),
      'departamentos',
      (item) => item.regionId,
    ),
    ...duplicateIssues(
      snapshot.departments,
      (item) => normalizeCode(item.codigo),
      'departamentos.codigo',
      (item) => item.regionId,
    ),
    ...duplicateIssues(
      snapshot.municipalities,
      (item) => normalizeName(item.nombre),
      'municipios',
      (item) => item.departamentoId,
    ),
    ...duplicateIssues(
      snapshot.municipalities,
      (item) => normalizeCode(item.codigo),
      'municipios.codigo',
      (item) => item.departamentoId,
    ),
  ];

  const regionsById = new Map(snapshot.regions.map((item) => [item.id, item]));
  const departmentsById = new Map(snapshot.departments.map((item) => [item.id, item]));
  const municipalitiesById = new Map(snapshot.municipalities.map((item) => [item.id, item]));
  const catalogIntegrity = {
    departmentsWithoutRegion: snapshot.departments.filter(
      ({ regionId }) => !regionsById.has(regionId),
    ).length,
    municipalitiesWithoutDepartment: snapshot.municipalities.filter(
      ({ departamentoId }) => !departmentsById.has(departamentoId),
    ).length,
  };
  const brigadeIntegrity = {
    missingRegion: 0,
    missingDepartment: 0,
    missingMunicipality: 0,
    regionDepartmentMismatch: 0,
    departmentMunicipalityMismatch: 0,
    regionMunicipalityMismatch: 0,
  };

  for (const [field, count] of Object.entries(catalogIntegrity)) {
    if (count > 0) {
      issues.push({
        path: `catalogos.${field}`,
        name: '',
        message: `${count} registro(s) geográficos no tienen un padre existente.`,
      });
    }
  }

  for (const brigade of snapshot.brigades) {
    const region = regionsById.get(brigade.regionId);
    const department =
      brigade.departamentoId === null
        ? null
        : departmentsById.get(brigade.departamentoId);
    const municipality =
      brigade.municipioId === null ? null : municipalitiesById.get(brigade.municipioId);

    if (!region) brigadeIntegrity.missingRegion += 1;
    if (brigade.departamentoId !== null && !department) {
      brigadeIntegrity.missingDepartment += 1;
    }
    if (brigade.municipioId !== null && !municipality) {
      brigadeIntegrity.missingMunicipality += 1;
    }
    if (department && department.regionId !== brigade.regionId) {
      brigadeIntegrity.regionDepartmentMismatch += 1;
    }
    if (municipality && municipality.departamentoId !== brigade.departamentoId) {
      brigadeIntegrity.departmentMunicipalityMismatch += 1;
    }
    if (
      municipality &&
      departmentsById.get(municipality.departamentoId)?.regionId !== brigade.regionId
    ) {
      brigadeIntegrity.regionMunicipalityMismatch += 1;
    }
  }

  for (const [field, count] of Object.entries(brigadeIntegrity)) {
    if (count > 0) {
      issues.push({
        path: `brigadas.${field}`,
        name: '',
        message: `${count} brigada(s) presentan esta inconsistencia; no se corregirán automáticamente.`,
      });
    }
  }

  return {
    issues,
    catalogIntegrity,
    brigadeIntegrity,
    counts: {
      regions: snapshot.regions.length,
      departments: snapshot.departments.length,
      municipalities: snapshot.municipalities.length,
      brigades: snapshot.brigades.length,
      brigadesWithRegion: snapshot.brigades.filter(({ regionId }) => regionId !== null).length,
      brigadesWithDepartment: snapshot.brigades.filter(
        ({ departamentoId }) => departamentoId !== null,
      ).length,
      brigadesWithMunicipality: snapshot.brigades.filter(
        ({ municipioId }) => municipioId !== null,
      ).length,
    },
  };
}

function makeOperation(level, path, source, existing, parentPath = null) {
  const desired = {
    nombre: canonicalName(source.nombre),
    codigo: canonicalCode(source.codigo),
    activo: true,
  };
  const changes = {};

  if (existing) {
    for (const [field, value] of Object.entries(desired)) {
      if (existing[field] !== value) changes[field] = value;
    }
  }

  return {
    level,
    path,
    parentPath,
    source,
    existingId: existing?.id ?? null,
    desired,
    changes,
    action: existing ? (Object.keys(changes).length ? 'update' : 'unchanged') : 'create',
  };
}

function conflict(path, name, message) {
  return { path, name, message };
}

function buildGeographyPlan(geography, snapshot) {
  const operations = { regions: [], departments: [], municipalities: [] };
  const conflicts = [...validateDatabaseSnapshot(snapshot).issues];

  const regionsByName = groupBy(snapshot.regions, (item) => normalizeName(item.nombre));
  const regionsByCode = groupBy(snapshot.regions, (item) => normalizeCode(item.codigo));
  const regionResolution = new Map();

  for (const [regionIndex, region] of geography.entries()) {
    const path = `geografiaGuatemala[${regionIndex}]`;
    const candidates = uniqueRecords([
      ...(regionsByName.get(normalizeName(region.nombre)) || []),
      ...(regionsByCode.get(normalizeCode(region.codigo)) || []),
    ]);

    if (candidates.length > 1) {
      conflicts.push(
        conflict(
          path,
          region.nombre,
          `Nombre y código identifican regiones distintas (IDs ${candidates
            .map(({ id }) => id)
            .join(', ')}).`,
        ),
      );
      continue;
    }

    const operation = makeOperation('region', path, region, candidates[0]);
    operations.regions.push(operation);
    regionResolution.set(path, operation);
  }

  const departmentsByName = groupBy(snapshot.departments, (item) =>
    normalizeName(item.nombre),
  );
  const departmentsByCode = groupBy(snapshot.departments, (item) =>
    normalizeCode(item.codigo),
  );
  const departmentResolution = new Map();

  for (const [regionIndex, region] of geography.entries()) {
    const regionPath = `geografiaGuatemala[${regionIndex}]`;
    const parentOperation = regionResolution.get(regionPath);
    if (!parentOperation) continue;

    for (const [departmentIndex, department] of region.departamentos.entries()) {
      const path = `${regionPath}.departamentos[${departmentIndex}]`;
      const desiredParentId = parentOperation.existingId;
      const sameName = departmentsByName.get(normalizeName(department.nombre)) || [];
      const sameCode = departmentsByCode.get(normalizeCode(department.codigo)) || [];
      const crossParent = uniqueRecords([...sameName, ...sameCode]).filter(
        (item) => desiredParentId === null || item.regionId !== desiredParentId,
      );

      if (crossParent.length) {
        conflicts.push(
          conflict(
            path,
            department.nombre,
            `Existe con el mismo nombre o código bajo otra región (IDs ${crossParent
              .map(({ id }) => id)
              .join(', ')}); no se moverá automáticamente.`,
          ),
        );
        continue;
      }

      const candidates = uniqueRecords([...sameName, ...sameCode]).filter(
        (item) => item.regionId === desiredParentId,
      );
      if (candidates.length > 1) {
        conflicts.push(
          conflict(
            path,
            department.nombre,
            `Nombre y código identifican departamentos distintos (IDs ${candidates
              .map(({ id }) => id)
              .join(', ')}).`,
          ),
        );
        continue;
      }

      const operation = makeOperation(
        'department',
        path,
        department,
        candidates[0],
        regionPath,
      );
      operations.departments.push(operation);
      departmentResolution.set(path, operation);
    }
  }

  const municipalitiesByName = groupBy(snapshot.municipalities, (item) =>
    normalizeName(item.nombre),
  );
  const municipalitiesByCode = groupBy(snapshot.municipalities, (item) =>
    normalizeCode(item.codigo),
  );

  for (const [regionIndex, region] of geography.entries()) {
    const regionPath = `geografiaGuatemala[${regionIndex}]`;
    for (const [departmentIndex, department] of region.departamentos.entries()) {
      const departmentPath = `${regionPath}.departamentos[${departmentIndex}]`;
      const parentOperation = departmentResolution.get(departmentPath);
      if (!parentOperation) continue;

      for (const [municipalityIndex, municipality] of department.municipios.entries()) {
        const path = `${departmentPath}.municipios[${municipalityIndex}]`;
        const desiredParentId = parentOperation.existingId;
        const sameName = municipalitiesByName.get(normalizeName(municipality.nombre)) || [];
        const sameCode = municipalitiesByCode.get(normalizeCode(municipality.codigo)) || [];
        const crossParentCode = sameCode.filter(
          (item) => desiredParentId === null || item.departamentoId !== desiredParentId,
        );

        if (crossParentCode.length) {
          conflicts.push(
            conflict(
              path,
              municipality.nombre,
              `El código existe bajo otro departamento (IDs ${crossParentCode
                .map(({ id }) => id)
                .join(', ')}); no se moverá automáticamente.`,
            ),
          );
          continue;
        }

        const candidates = uniqueRecords([...sameName, ...sameCode]).filter(
          (item) => item.departamentoId === desiredParentId,
        );
        if (candidates.length > 1) {
          conflicts.push(
            conflict(
              path,
              municipality.nombre,
              `Nombre y código identifican municipios distintos (IDs ${candidates
                .map(({ id }) => id)
                .join(', ')}).`,
            ),
          );
          continue;
        }

        operations.municipalities.push(
          makeOperation(
            'municipality',
            path,
            municipality,
            candidates[0],
            departmentPath,
          ),
        );
      }
    }
  }

  const summary = {};
  for (const [level, levelOperations] of Object.entries(operations)) {
    summary[level] = {
      create: levelOperations.filter(({ action }) => action === 'create').length,
      update: levelOperations.filter(({ action }) => action === 'update').length,
      unchanged: levelOperations.filter(({ action }) => action === 'unchanged').length,
    };
  }

  return { operations, conflicts, summary };
}

async function applyOperation(client, modelName, operation, parentField, parentId) {
  const data = {
    nombre: operation.desired.nombre,
    codigo: operation.desired.codigo,
    activo: true,
    ...(parentField ? { [parentField]: parentId } : {}),
  };

  if (operation.existingId !== null) {
    if (operation.action === 'update') {
      return client[modelName].update({
        where: { id: operation.existingId },
        data: operation.changes,
        select: { id: true },
      });
    }
    return { id: operation.existingId };
  }

  const where =
    modelName === 'region'
      ? { nombre: operation.desired.nombre }
      : {
          [`${parentField}_nombre`]: {
            [parentField]: parentId,
            nombre: operation.desired.nombre,
          },
        };

  return client[modelName].upsert({
    where,
    update: data,
    create: data,
    select: { id: true },
  });
}

async function synchronizeGeography({ prisma, geography }) {
  const sourceValidation = validateGeographyData(geography);
  if (sourceValidation.errors.length) {
    throw new GeographyValidationError(
      'La fuente geográfica no pasó la validación.',
      sourceValidation.errors,
    );
  }

  return prisma.$transaction(
    async (tx) => {
      const snapshot = await loadGeographySnapshot(tx);
      const plan = buildGeographyPlan(geography, snapshot);
      if (plan.conflicts.length) {
        throw new GeographyValidationError(
          'Se detectaron conflictos con los datos existentes.',
          plan.conflicts,
        );
      }

      const regionIds = new Map();
      for (const operation of plan.operations.regions) {
        const record = await applyOperation(tx, 'region', operation);
        regionIds.set(operation.path, record.id);
      }

      const departmentIds = new Map();
      for (const operation of plan.operations.departments) {
        const regionId = regionIds.get(operation.parentPath);
        const record = await applyOperation(
          tx,
          'departamento',
          operation,
          'regionId',
          regionId,
        );
        departmentIds.set(operation.path, record.id);
      }

      for (const operation of plan.operations.municipalities) {
        const departamentoId = departmentIds.get(operation.parentPath);
        await applyOperation(
          tx,
          'municipio',
          operation,
          'departamentoId',
          departamentoId,
        );
      }

      return { plan, sourceValidation };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 120_000,
    },
  );
}

module.exports = {
  GeographyValidationError,
  buildGeographyPlan,
  canonicalName,
  loadGeographySnapshot,
  normalizeName,
  synchronizeGeography,
  validateDatabaseSnapshot,
  validateGeographyData,
  validateUtf8SourceFile,
};
