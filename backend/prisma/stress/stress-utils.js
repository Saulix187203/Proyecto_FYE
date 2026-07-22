const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function assertNonProduction() {
  if ((process.env.NODE_ENV || '').trim().toLowerCase() === 'production') {
    throw new Error('Operación bloqueada: los scripts STRESS no pueden ejecutarse con NODE_ENV=production.');
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no está definida. Revise backend/.env antes de continuar.');
  }
}

function requireConfirmation(variableName) {
  if (process.env[variableName] !== 'YES') {
    throw new Error(
      `Confirmación requerida: defina ${variableName}=YES para ejecutar esta operación manual.`,
    );
  }
}

function parseArguments(argv = process.argv.slice(2)) {
  return new Map(
    argv
      .filter((argument) => argument.startsWith('--') && argument.includes('='))
      .map((argument) => {
        const separator = argument.indexOf('=');
        return [argument.slice(2, separator), argument.slice(separator + 1)];
      }),
  );
}

function readInteger({ args, argumentName, environmentName, defaultValue, min = 0, max = 10_000_000 }) {
  const rawValue = args.get(argumentName) ?? process.env[environmentName] ?? defaultValue;
  const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);

  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${environmentName} debe ser un entero entre ${min} y ${max}.`);
  }

  return value;
}

function normalizeRunId(value) {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);

  if (!normalized) {
    throw new Error('STRESS_RUN_ID debe contener al menos un carácter alfanumérico.');
  }

  return normalized;
}

function defaultRunId() {
  return Date.now().toString(36).slice(-6).toUpperCase();
}

function splitIntoChunks(items, chunkSize) {
  const chunks = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

async function createManyInChunks(delegate, data, options = {}) {
  if (!data.length) return 0;

  const requestedBatchSize = options.batchSize || 1000;
  const fieldsPerRow = options.fieldsPerRow || 10;
  const parameterSafeSize = Math.max(1, Math.floor(30_000 / fieldsPerRow));
  const chunkSize = Math.min(requestedBatchSize, parameterSafeSize);
  let inserted = 0;

  for (const chunk of splitIntoChunks(data, chunkSize)) {
    const result = await delegate.createMany({
      data: chunk,
      ...(options.skipDuplicates ? { skipDuplicates: true } : {}),
    });
    inserted += result.count;
  }

  return inserted;
}

function itemsForIndex(index, entityCount, itemCount) {
  if (!entityCount || !itemCount) return 0;
  return (
    Math.floor(((index + 1) * itemCount) / entityCount) -
    Math.floor((index * itemCount) / entityCount)
  );
}

function pad(value, length) {
  return String(value).padStart(length, '0');
}

function elapsed(startedAt) {
  return `${((Date.now() - startedAt) / 1000).toFixed(2)} s`;
}

module.exports = {
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
};
