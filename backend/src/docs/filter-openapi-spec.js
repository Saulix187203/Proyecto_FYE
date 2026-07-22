const HTTP_METHODS = new Set([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
  'trace',
]);

function clone(value) {
  return structuredClone(value);
}

function filterOpenApiSpec(openApiSpec, allowedOperations) {
  if (!openApiSpec || typeof openApiSpec !== 'object') {
    throw new TypeError('openApiSpec debe ser un objeto OpenAPI');
  }

  if (!allowedOperations || typeof allowedOperations !== 'object') {
    throw new TypeError('allowedOperations debe ser un objeto con paths y métodos permitidos');
  }

  const filteredSpec = clone(openApiSpec);
  const filteredPaths = {};
  const usedTags = new Set();

  for (const [path, methods] of Object.entries(allowedOperations)) {
    const sourcePath = openApiSpec.paths?.[path];

    if (!sourcePath) {
      throw new Error(`La allowlist referencia un path OpenAPI inexistente: ${path}`);
    }

    if (!Array.isArray(methods) || methods.length === 0) {
      throw new Error(`La allowlist debe declarar al menos un método para: ${path}`);
    }

    const filteredPath = Object.fromEntries(
      Object.entries(sourcePath)
        .filter(([key]) => !HTTP_METHODS.has(key.toLowerCase()))
        .map(([key, value]) => [key, clone(value)]),
    );

    for (const configuredMethod of methods) {
      const method = String(configuredMethod).toLowerCase();

      if (!HTTP_METHODS.has(method)) {
        throw new Error(`Método HTTP no válido en allowlist: ${configuredMethod} ${path}`);
      }

      if (!sourcePath[method]) {
        throw new Error(`La allowlist referencia una operación OpenAPI inexistente: ${method.toUpperCase()} ${path}`);
      }

      filteredPath[method] = clone(sourcePath[method]);
      sourcePath[method].tags?.forEach((tag) => usedTags.add(tag));
    }

    filteredPaths[path] = filteredPath;
  }

  filteredSpec.paths = filteredPaths;

  if (Array.isArray(filteredSpec.tags)) {
    filteredSpec.tags = filteredSpec.tags.filter((tag) => usedTags.has(tag.name));
  }

  return filteredSpec;
}

module.exports = filterOpenApiSpec;
