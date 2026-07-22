const AppError = require('./app-error');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 1000;

function parseInteger(value, field, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (!/^\d+$/.test(String(value))) {
    throw new AppError(`${field} debe ser un entero positivo`, 400);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new AppError(`${field} debe ser un entero positivo`, 400);
  }

  return parsed;
}

function parsePagination(query = {}, { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = {}) {
  const page = parseInteger(query.page, 'page', DEFAULT_PAGE);
  const limit = parseInteger(query.limit, 'limit', defaultLimit);

  if (limit > maxLimit) {
    throw new AppError(`limit no puede ser mayor que ${maxLimit}`, 400);
  }

  const skip = (page - 1) * limit;
  if (!Number.isSafeInteger(skip)) {
    throw new AppError('page es demasiado grande', 400);
  }

  return { page, limit, skip };
}

function parseSorting(query = {}, allowedFields, defaults) {
  const sortBy = query.sortBy === undefined || query.sortBy === '' ? defaults.sortBy : query.sortBy;
  const sortDir = query.sortDir === undefined || query.sortDir === '' ? defaults.sortDir : query.sortDir;

  if (typeof sortBy !== 'string' || !Object.hasOwn(allowedFields, sortBy)) {
    throw new AppError(
      `sortBy debe ser uno de: ${Object.keys(allowedFields).join(', ')}`,
      400,
    );
  }
  if (sortDir !== 'asc' && sortDir !== 'desc') {
    throw new AppError('sortDir debe ser asc o desc', 400);
  }

  const field = allowedFields[sortBy];
  const orderBy = [{ [field]: sortDir }];
  if (field !== 'id') orderBy.push({ id: sortDir });

  return { sortBy, sortDir, orderBy };
}

function buildPagination({ page, limit, totalItems }) {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
}

function hasPaginationParams(query = {}) {
  return ['page', 'limit', 'sortBy', 'sortDir'].some(
    (key) => query[key] !== undefined && query[key] !== '',
  );
}

module.exports = {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  parsePagination,
  parseSorting,
  buildPagination,
  hasPaginationParams,
};
