const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const parameterRef = (name) => ({ $ref: `#/components/parameters/${name}` });
const responseRef = (name) => ({ $ref: `#/components/responses/${name}` });

const objectSchema = (properties = {}, required = []) => ({
  type: 'object',
  properties,
  ...(required.length ? { required } : {}),
});

const arrayOf = (schema) => ({ type: 'array', items: schema });

const apiResponseSchema = (dataSchema) => ({
  allOf: [
    ref('ApiResponse'),
    {
      type: 'object',
      properties: { data: dataSchema },
    },
  ],
});

const successResponse = (description, dataSchema) => ({
  description,
  content: {
    'application/json': { schema: apiResponseSchema(dataSchema) },
  },
});

const jsonBody = (schema, required = true) => ({
  required,
  content: { 'application/json': { schema } },
});

const standardErrors = {
  400: responseRef('BadRequest'),
  401: responseRef('Unauthorized'),
  403: responseRef('Forbidden'),
  404: responseRef('NotFound'),
  500: responseRef('InternalError'),
};

function operation({
  tag,
  summary,
  operationId,
  description,
  parameters,
  requestBody,
  dataSchema = objectSchema(),
  successStatus = 200,
  successDescription = 'Operación completada correctamente.',
  security,
}) {
  return {
    tags: [tag],
    summary,
    operationId,
    ...(description ? { description } : {}),
    ...(parameters?.length ? { parameters } : {}),
    ...(requestBody ? { requestBody } : {}),
    ...(security ? { security } : {}),
    responses: {
      [successStatus]: successResponse(successDescription, dataSchema),
      ...standardErrors,
    },
  };
}

const queryParameter = (name, description, schema = { type: 'string' }) => ({
  name,
  in: 'query',
  description,
  schema,
});

const paginationParameters = [parameterRef('Page'), parameterRef('Limit')];
const sortDirectionParameter = parameterRef('SortDir');
const dateFilter = (name) =>
  queryParameter(name, `Fecha ${name === 'fechaDesde' ? 'inicial' : 'final'} del filtro.`, {
    type: 'string',
    format: 'date',
  });
const idOrNameFilter = (name, description) =>
  queryParameter(name, description, {
    oneOf: [{ type: 'integer', minimum: 1 }, { type: 'string' }],
  });
const observationsBody = (required = false) =>
  jsonBody(
    objectSchema(
      { observaciones: { type: 'string', example: 'Observación de seguimiento.' } },
      required ? ['observaciones'] : [],
    ),
    required,
  );

const paginatedData = (property, itemSchema) =>
  objectSchema(
    {
      [property]: arrayOf(itemSchema),
      pagination: ref('PaginationMetadata'),
      sort: objectSchema({
        sortBy: { type: 'string' },
        sortDir: { type: 'string', enum: ['asc', 'desc'] },
      }),
    },
    [property, 'pagination'],
  );

const paths = {
  '/health': {
    get: {
      tags: ['Health'],
      summary: 'Verificar estado del servicio',
      operationId: 'getHealth',
      security: [],
      responses: {
        200: {
          description: 'Servicio disponible.',
          content: {
            'application/json': {
              schema: objectSchema(
                {
                  status: { type: 'string', example: 'ok' },
                  service: { type: 'string', example: 'sisca-backend' },
                  timestamp: { type: 'string', format: 'date-time' },
                  uptime: { type: 'number', example: 120.5 },
                },
                ['status', 'service', 'timestamp', 'uptime'],
              ),
            },
          },
        },
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Iniciar sesión',
      operationId: 'login',
      description:
        'Valida las credenciales y devuelve un JWT. Este endpoint no requiere autenticación. Para extracción se recomienda la cuenta técnica `tecnico.api@sisca.com`, configurada con el rol de solo lectura **Extractor API**. La contraseña se administra fuera de OpenAPI mediante `API_EXTRACTOR_PASSWORD`.',
      security: [],
      requestBody: jsonBody(ref('LoginRequest')),
      responses: {
        200: {
          description: 'Inicio de sesión exitoso.',
          content: { 'application/json': { schema: ref('LoginResponse') } },
        },
        400: responseRef('BadRequest'),
        401: responseRef('Unauthorized'),
        403: responseRef('Forbidden'),
        500: responseRef('InternalError'),
      },
    },
  },
  '/auth/me': {
    get: operation({
      tag: 'Auth',
      summary: 'Obtener usuario autenticado',
      operationId: 'getAuthenticatedUser',
      dataSchema: objectSchema({ usuario: ref('Usuario') }, ['usuario']),
      successDescription: 'Usuario autenticado obtenido correctamente.',
    }),
  },
  '/usuarios': {
    get: operation({
      tag: 'Usuarios',
      summary: 'Listar usuarios de forma paginada',
      operationId: 'listUsuarios',
      description:
        'Endpoint administrativo paginado. Permite buscar por nombre o correo, filtrar por estado y rol, y ordenar únicamente por los campos permitidos.',
      parameters: [
        parameterRef('Page'),
        queryParameter('limit', 'Elementos por página (máximo 500).', {
          type: 'integer',
          minimum: 1,
          maximum: 500,
          default: 50,
        }),
        queryParameter('texto', 'Búsqueda parcial, sin distinguir mayúsculas, por nombre o correo.'),
        queryParameter('activo', 'Filtra usuarios activos o inactivos.', { type: 'boolean' }),
        queryParameter('rol', 'Identificador numérico del rol.', {
          type: 'integer',
          minimum: 1,
        }),
        queryParameter('sortBy', 'Campo de ordenamiento permitido.', {
          type: 'string',
          enum: ['id', 'nombre', 'correo', 'activo', 'ultimoAcceso', 'createdAt'],
          default: 'nombre',
        }),
        sortDirectionParameter,
      ],
      dataSchema: paginatedData('usuarios', ref('Usuario')),
    }),
    post: operation({
      tag: 'Usuarios',
      summary: 'Crear usuario',
      operationId: 'createUsuario',
      successStatus: 201,
      requestBody: jsonBody(
        objectSchema(
          {
            nombre: { type: 'string', maxLength: 150 },
            correo: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password', minLength: 8, maxLength: 72 },
            roles: {
              type: 'array',
              minItems: 1,
              items: { oneOf: [{ type: 'integer', minimum: 1 }, { type: 'string' }] },
            },
          },
          ['nombre', 'correo', 'password', 'roles'],
        ),
      ),
      dataSchema: objectSchema({ usuario: ref('Usuario') }, ['usuario']),
    }),
  },
  '/usuarios/opciones': {
    get: operation({
      tag: 'Usuarios',
      summary: 'Buscar opciones de usuarios para selectores',
      operationId: 'listUsuarioOpciones',
      description:
        'Devuelve una proyección liviana y paginada para selectores remotos de brigadas y responsables. Requiere uno de los roles funcionales autorizados y no está disponible para Extractor API.',
      parameters: [
        parameterRef('Page'),
        queryParameter('limit', 'Opciones por página (máximo 100).', {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20,
        }),
        queryParameter('texto', 'Búsqueda parcial, sin distinguir mayúsculas, por nombre o correo.'),
        queryParameter('activo', 'Filtra usuarios activos o inactivos; por defecto true.', {
          type: 'boolean',
          default: true,
        }),
      ],
      dataSchema: paginatedData('usuarios', ref('UsuarioOpcion')),
    }),
  },
  '/usuarios/{id}': {
    get: operation({
      tag: 'Usuarios',
      summary: 'Obtener usuario por id',
      operationId: 'getUsuarioById',
      parameters: [parameterRef('Id')],
      dataSchema: objectSchema({ usuario: ref('Usuario') }, ['usuario']),
    }),
    put: operation({
      tag: 'Usuarios',
      summary: 'Actualizar usuario',
      operationId: 'updateUsuario',
      parameters: [parameterRef('Id')],
      requestBody: jsonBody(
        objectSchema({
          nombre: { type: 'string', maxLength: 150 },
          correo: { type: 'string', format: 'email' },
          activo: { type: 'boolean' },
        }),
      ),
      dataSchema: objectSchema({ usuario: ref('Usuario') }, ['usuario']),
    }),
    delete: operation({
      tag: 'Usuarios',
      summary: 'Desactivar usuario',
      operationId: 'deleteUsuario',
      parameters: [parameterRef('Id')],
      dataSchema: objectSchema({ usuario: ref('Usuario') }, ['usuario']),
    }),
  },
  '/usuarios/{id}/roles': {
    put: operation({
      tag: 'Usuarios',
      summary: 'Actualizar roles de usuario',
      operationId: 'updateUsuarioRoles',
      parameters: [parameterRef('Id')],
      requestBody: jsonBody(
        objectSchema(
          {
            roles: {
              type: 'array',
              items: { oneOf: [{ type: 'integer', minimum: 1 }, { type: 'string' }] },
            },
          },
          ['roles'],
        ),
      ),
      dataSchema: objectSchema({ usuario: ref('Usuario') }, ['usuario']),
    }),
  },
  '/usuarios/{id}/password': {
    put: operation({
      tag: 'Usuarios',
      summary: 'Actualizar contraseña de usuario',
      operationId: 'updateUsuarioPassword',
      parameters: [parameterRef('Id')],
      requestBody: jsonBody(
        objectSchema(
          { password: { type: 'string', format: 'password', minLength: 8, maxLength: 72 } },
          ['password'],
        ),
      ),
      dataSchema: objectSchema({ usuario: ref('Usuario') }, ['usuario']),
    }),
  },
  '/roles': {
    get: operation({
      tag: 'Roles',
      summary: 'Listar roles',
      operationId: 'listRoles',
      dataSchema: objectSchema({ roles: arrayOf(ref('Rol')) }, ['roles']),
    }),
    post: operation({
      tag: 'Roles',
      summary: 'Crear rol',
      operationId: 'createRol',
      successStatus: 201,
      requestBody: jsonBody(
        objectSchema(
          {
            nombre: { type: 'string', maxLength: 100 },
            descripcion: { type: 'string', maxLength: 255, nullable: true },
          },
          ['nombre'],
        ),
      ),
      dataSchema: objectSchema({ rol: ref('Rol') }, ['rol']),
    }),
  },
  '/roles/{id}': {
    put: operation({
      tag: 'Roles',
      summary: 'Actualizar rol',
      operationId: 'updateRol',
      parameters: [parameterRef('Id')],
      requestBody: jsonBody(
        objectSchema({
          nombre: { type: 'string', maxLength: 100 },
          descripcion: { type: 'string', maxLength: 255, nullable: true },
        }),
      ),
      dataSchema: objectSchema({ rol: ref('Rol') }, ['rol']),
    }),
    delete: operation({
      tag: 'Roles',
      summary: 'Eliminar rol',
      operationId: 'deleteRol',
      parameters: [parameterRef('Id')],
      dataSchema: objectSchema({ rol: ref('Rol') }, ['rol']),
    }),
  },
};

const catalogEndpoints = [
  ['areas', 'áreas', 'listAreas'],
  ['procesos', 'procesos', 'listProcesos'],
  ['tipos-evento', 'tipos de evento', 'listTiposEvento'],
  ['criticidades', 'criticidades', 'listCriticidades'],
  ['estados-caso', 'estados de caso', 'listEstadosCaso'],
  ['estados-accion', 'estados de acción', 'listEstadosAccion'],
  ['regiones', 'regiones', 'listRegiones'],
  ['tipos-brigada', 'tipos de brigada', 'listTiposBrigada'],
];

for (const [path, label, operationId] of catalogEndpoints) {
  paths[`/catalogos/${path}`] = {
    get: operation({
      tag: 'Catálogos',
      summary: `Listar ${label}`,
      operationId,
      dataSchema: arrayOf(ref('Catalogo')),
      successDescription: `Catálogo de ${label} obtenido correctamente.`,
    }),
  };
}

paths['/catalogos/departamentos'] = {
  get: operation({
    tag: 'Catálogos',
    summary: 'Listar departamentos',
    operationId: 'listDepartamentos',
    parameters: [
      queryParameter('regionId', 'Filtra por región.', { type: 'integer', minimum: 1 }),
    ],
    dataSchema: arrayOf(ref('Catalogo')),
  }),
};

paths['/catalogos/municipios'] = {
  get: operation({
    tag: 'Catálogos',
    summary: 'Listar municipios',
    operationId: 'listMunicipios',
    parameters: [
      queryParameter('departamentoId', 'Filtra por departamento.', {
        type: 'integer',
        minimum: 1,
      }),
    ],
    dataSchema: arrayOf(ref('Catalogo')),
  }),
};

const caseBodyProperties = {
  titulo: { type: 'string', maxLength: 200 },
  idArea: { type: 'integer', minimum: 1 },
  idProceso: { type: 'integer', minimum: 1 },
  idTipoEvento: { type: 'integer', minimum: 1 },
  idCriticidad: { type: 'integer', minimum: 1 },
  fechaEvento: { type: 'string', format: 'date-time' },
  lugar: { type: 'string', maxLength: 255 },
  descripcion: { type: 'string' },
  idBrigadaReportante: { type: 'integer', minimum: 1, nullable: true },
};

paths['/casos'] = {
  get: operation({
    tag: 'Casos',
    summary: 'Listar casos con paginación de alto volumen',
    operationId: 'listCasos',
    description:
      'Devuelve una página de casos. `page` por defecto es 1, `limit` por defecto es 50 y el máximo es 1000. Un `limit` mayor a 1000 responde HTTP 400.',
    parameters: [
      ...paginationParameters,
      queryParameter('sortBy', 'Campo de ordenamiento.', {
        type: 'string',
        enum: ['id', 'correlativo', 'fechaEvento', 'fechaReporte', 'createdAt'],
        default: 'fechaReporte',
      }),
      sortDirectionParameter,
      queryParameter('texto', 'Busca en correlativo, título, descripción y lugar.', {
        type: 'string',
        maxLength: 200,
      }),
      idOrNameFilter('estado', 'Id o nombre del estado del caso.'),
      idOrNameFilter('area', 'Id o nombre del área.'),
      idOrNameFilter('criticidad', 'Id o nombre de la criticidad.'),
      dateFilter('fechaDesde'),
      dateFilter('fechaHasta'),
      queryParameter('brigada', 'Id de brigada reportante.', { type: 'integer', minimum: 1 }),
      queryParameter('brigadaReportante', 'Alias de `brigada`.', {
        type: 'integer',
        minimum: 1,
      }),
      queryParameter('region', 'Id de región de la brigada.', { type: 'integer', minimum: 1 }),
      queryParameter('departamento', 'Id de departamento de la brigada.', {
        type: 'integer',
        minimum: 1,
      }),
      queryParameter('municipio', 'Id de municipio de la brigada.', {
        type: 'integer',
        minimum: 1,
      }),
      queryParameter('tipoBrigada', 'Id del tipo de brigada.', { type: 'integer', minimum: 1 }),
    ],
    dataSchema: paginatedData('casos', ref('Caso')),
    successDescription: 'Casos obtenidos correctamente.',
  }),
  post: operation({
    tag: 'Casos',
    summary: 'Crear caso',
    operationId: 'createCaso',
    successStatus: 201,
    requestBody: jsonBody(
      objectSchema(caseBodyProperties, [
        'idArea',
        'idProceso',
        'idTipoEvento',
        'idCriticidad',
        'fechaEvento',
        'lugar',
        'descripcion',
      ]),
    ),
    dataSchema: objectSchema({ caso: ref('Caso') }, ['caso']),
  }),
};

paths['/casos/{id}'] = {
  get: operation({
    tag: 'Casos',
    summary: 'Obtener caso por id',
    operationId: 'getCasoById',
    parameters: [parameterRef('Id')],
    dataSchema: objectSchema({ caso: ref('Caso') }, ['caso']),
  }),
  put: operation({
    tag: 'Casos',
    summary: 'Actualizar caso',
    operationId: 'updateCaso',
    parameters: [parameterRef('Id')],
    requestBody: jsonBody(objectSchema(caseBodyProperties)),
    dataSchema: objectSchema({ caso: ref('Caso') }, ['caso']),
  }),
};

paths['/expedientes/{idCaso}'] = {
  get: operation({
    tag: 'Expedientes',
    summary: 'Obtener expediente consolidado de un caso',
    operationId: 'getExpedienteByCaso',
    parameters: [parameterRef('IdCaso')],
    dataSchema: objectSchema({ expediente: ref('Expediente') }, ['expediente']),
  }),
};

paths['/reportes-iniciales'] = {
  post: operation({
    tag: 'Reportes Iniciales',
    summary: 'Crear o actualizar reporte inicial',
    operationId: 'saveReporteInicial',
    requestBody: jsonBody(
      objectSchema(
        {
          idCaso: { type: 'integer', minimum: 1 },
          descripcionDetallada: { type: 'string' },
          condicionDetectada: { type: 'string' },
          accionInmediata: { type: 'string' },
          observaciones: { type: 'string' },
        },
        ['idCaso'],
      ),
    ),
    dataSchema: objectSchema({ reporte: { type: 'object', additionalProperties: true } }, [
      'reporte',
    ]),
  }),
};

paths['/reportes-iniciales/caso/{idCaso}'] = {
  get: operation({
    tag: 'Reportes Iniciales',
    summary: 'Obtener reporte inicial por caso',
    operationId: 'getReporteInicialByCaso',
    parameters: [parameterRef('IdCaso')],
    dataSchema: objectSchema({ reporte: { type: 'object', additionalProperties: true } }, [
      'reporte',
    ]),
  }),
};

const validationActions = [
  ['iniciar-revision', 'Iniciar revisión de procedencia', 'startProcedenciaReview', undefined],
  ['aprobar', 'Aprobar procedencia', 'approveProcedencia', observationsBody(false)],
  ['devolver', 'Devolver caso en validación', 'returnProcedencia', observationsBody(true)],
  ['rechazar', 'Rechazar procedencia', 'rejectProcedencia', observationsBody(true)],
];

for (const [path, summary, operationId, requestBody] of validationActions) {
  paths[`/validaciones-procedencia/{idCaso}/${path}`] = {
    post: operation({
      tag: 'Validaciones',
      summary,
      operationId,
      parameters: [parameterRef('IdCaso')],
      requestBody,
      dataSchema: objectSchema({
        caso: ref('Caso'),
        validacion: { type: 'object', additionalProperties: true },
      }),
    }),
  };
}

paths['/validaciones-procedencia/caso/{idCaso}'] = {
  get: operation({
    tag: 'Validaciones',
    summary: 'Listar validaciones de un caso',
    operationId: 'listValidacionesByCaso',
    parameters: [parameterRef('IdCaso')],
    dataSchema: objectSchema({
      validaciones: arrayOf({ type: 'object', additionalProperties: true }),
    }),
  }),
};

const actionBody = objectSchema({
  idCaso: { type: 'integer', minimum: 1 },
  idResponsable: { type: 'integer', minimum: 1 },
  descripcion: { type: 'string' },
  fechaCompromiso: { type: 'string', format: 'date-time' },
  observaciones: { type: 'string' },
});

paths['/acciones-correctivas'] = {
  get: operation({
    tag: 'Acciones Correctivas',
    summary: 'Listar acciones correctivas paginadas',
    operationId: 'listAccionesCorrectivas',
    description:
      'Admite paginación de alto volumen. `page` por defecto es 1, `limit` por defecto es 50 y el máximo es 1000.',
    parameters: [
      ...paginationParameters,
      queryParameter('sortBy', 'Campo de ordenamiento.', {
        type: 'string',
        enum: ['id', 'fechaCompromiso', 'fechaCierre', 'porcentajeAvance', 'createdAt'],
        default: 'createdAt',
      }),
      sortDirectionParameter,
      idOrNameFilter('estado', 'Id o nombre del estado de la acción.'),
      idOrNameFilter('responsable', 'Id o nombre/correo del responsable.'),
      idOrNameFilter('caso', 'Id o correlativo del caso.'),
      dateFilter('fechaDesde'),
      dateFilter('fechaHasta'),
      queryParameter('vencidas', 'Filtra acciones vencidas.', { type: 'boolean' }),
    ],
    dataSchema: paginatedData('acciones', ref('AccionCorrectiva')),
  }),
  post: operation({
    tag: 'Acciones Correctivas',
    summary: 'Crear acción correctiva',
    operationId: 'createAccionCorrectiva',
    successStatus: 201,
    requestBody: jsonBody({
      ...actionBody,
      required: ['idCaso', 'idResponsable', 'descripcion', 'fechaCompromiso'],
    }),
    dataSchema: objectSchema({ accion: ref('AccionCorrectiva') }, ['accion']),
  }),
};

paths['/acciones-correctivas/caso/{idCaso}'] = {
  get: operation({
    tag: 'Acciones Correctivas',
    summary: 'Listar acciones correctivas de un caso',
    operationId: 'listAccionesByCaso',
    parameters: [parameterRef('IdCaso')],
    dataSchema: objectSchema({ acciones: arrayOf(ref('AccionCorrectiva')) }, ['acciones']),
  }),
};

paths['/acciones-correctivas/{id}'] = {
  get: operation({
    tag: 'Acciones Correctivas',
    summary: 'Obtener acción correctiva por id',
    operationId: 'getAccionCorrectivaById',
    parameters: [parameterRef('Id')],
    dataSchema: objectSchema({ accion: ref('AccionCorrectiva') }, ['accion']),
  }),
  put: operation({
    tag: 'Acciones Correctivas',
    summary: 'Actualizar acción correctiva',
    operationId: 'updateAccionCorrectiva',
    parameters: [parameterRef('Id')],
    requestBody: jsonBody(actionBody),
    dataSchema: objectSchema({ accion: ref('AccionCorrectiva') }, ['accion']),
  }),
};

const actionTransitions = [
  ['iniciar', 'Iniciar acción correctiva', 'startAccionCorrectiva', undefined],
  [
    'enviar-validacion',
    'Enviar acción a validación',
    'sendAccionToValidation',
    observationsBody(false),
  ],
  ['cerrar', 'Cerrar acción correctiva', 'closeAccionCorrectiva', observationsBody(false)],
  ['devolver', 'Devolver acción correctiva', 'returnAccionCorrectiva', observationsBody(true)],
];

for (const [path, summary, operationId, requestBody] of actionTransitions) {
  paths[`/acciones-correctivas/{id}/${path}`] = {
    post: operation({
      tag: 'Acciones Correctivas',
      summary,
      operationId,
      parameters: [parameterRef('Id')],
      requestBody,
      dataSchema: objectSchema({
        accion: ref('AccionCorrectiva'),
        caso: ref('Caso'),
      }),
    }),
  };
}

const evidenceUploadBody = {
  required: true,
  content: {
    'multipart/form-data': {
      schema: objectSchema(
        {
          archivo: {
            type: 'string',
            format: 'binary',
            description: 'JPEG, PNG, WEBP o PDF; máximo 5 MB.',
          },
          descripcion: { type: 'string' },
        },
        ['archivo'],
      ),
    },
  },
};

paths['/evidencias/caso/{idCaso}'] = {
  get: operation({
    tag: 'Evidencias',
    summary: 'Listar evidencias de un caso',
    operationId: 'listEvidenciasByCaso',
    parameters: [parameterRef('IdCaso')],
    dataSchema: objectSchema({
      evidencias: arrayOf({ type: 'object', additionalProperties: true }),
    }),
  }),
  post: operation({
    tag: 'Evidencias',
    summary: 'Cargar evidencia de un caso',
    operationId: 'uploadEvidenciaCaso',
    parameters: [parameterRef('IdCaso')],
    requestBody: evidenceUploadBody,
    successStatus: 201,
    dataSchema: objectSchema({ evidencia: { type: 'object', additionalProperties: true } }, [
      'evidencia',
    ]),
  }),
};

paths['/evidencias/accion/{idAccion}'] = {
  get: operation({
    tag: 'Evidencias',
    summary: 'Listar evidencias de una acción',
    operationId: 'listEvidenciasByAccion',
    parameters: [parameterRef('IdAccion')],
    dataSchema: objectSchema({
      evidencias: arrayOf({ type: 'object', additionalProperties: true }),
    }),
  }),
  post: operation({
    tag: 'Evidencias',
    summary: 'Cargar evidencia de una acción',
    operationId: 'uploadEvidenciaAccion',
    parameters: [parameterRef('IdAccion')],
    requestBody: evidenceUploadBody,
    successStatus: 201,
    dataSchema: objectSchema({ evidencia: { type: 'object', additionalProperties: true } }, [
      'evidencia',
    ]),
  }),
};

paths['/evidencias/{id}/descargar'] = {
  get: {
    tags: ['Evidencias'],
    summary: 'Descargar archivo de evidencia',
    operationId: 'downloadEvidencia',
    parameters: [parameterRef('Id')],
    responses: {
      200: {
        description: 'Contenido binario de la evidencia.',
        content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } },
      },
      ...standardErrors,
    },
  },
};

const closureActions = [
  ['cerrar', 'Cerrar caso con acciones', 'closeCaso', observationsBody(false)],
  [
    'cerrar-sin-acciones',
    'Cerrar caso sin acciones correctivas',
    'closeCasoWithoutActions',
    observationsBody(false),
  ],
  [
    'devolver-cierre',
    'Devolver cierre del caso',
    'returnCasoClosure',
    observationsBody(true),
  ],
];

for (const [path, summary, operationId, requestBody] of closureActions) {
  paths[`/cierre-casos/{idCaso}/${path}`] = {
    post: operation({
      tag: 'Cierre de Casos',
      summary,
      operationId,
      parameters: [parameterRef('IdCaso')],
      requestBody,
      dataSchema: objectSchema({ caso: ref('Caso') }, ['caso']),
    }),
  };
}

paths['/notificaciones'] = {
  get: operation({
    tag: 'Notificaciones',
    summary: 'Listar notificaciones paginadas del usuario',
    operationId: 'listNotificaciones',
    description:
      'Admite paginación de alto volumen. `page` por defecto es 1, `limit` por defecto es 50 y el máximo es 1000.',
    parameters: [
      ...paginationParameters,
      queryParameter('sortBy', 'Campo de ordenamiento.', {
        type: 'string',
        enum: ['id', 'createdAt', 'fechaLectura'],
        default: 'createdAt',
      }),
      sortDirectionParameter,
      queryParameter('leida', 'Filtra por estado de lectura.', { type: 'boolean' }),
      dateFilter('fechaDesde'),
      dateFilter('fechaHasta'),
    ],
    dataSchema: paginatedData('notificaciones', ref('Notificacion')),
  }),
};

paths['/notificaciones/resumen'] = {
  get: operation({
    tag: 'Notificaciones',
    summary: 'Obtener resumen de notificaciones',
    operationId: 'getNotificacionesResumen',
    dataSchema: objectSchema({
      total: { type: 'integer', minimum: 0 },
      noLeidas: { type: 'integer', minimum: 0 },
    }),
  }),
};

paths['/notificaciones/{id}/leida'] = {
  put: operation({
    tag: 'Notificaciones',
    summary: 'Marcar notificación como leída',
    operationId: 'markNotificacionAsRead',
    parameters: [parameterRef('Id')],
    dataSchema: objectSchema({ notificacion: ref('Notificacion') }, ['notificacion']),
  }),
};

paths['/notificaciones/marcar-todas-leidas'] = {
  put: operation({
    tag: 'Notificaciones',
    summary: 'Marcar todas las notificaciones como leídas',
    operationId: 'markAllNotificacionesAsRead',
    dataSchema: objectSchema({ actualizadas: { type: 'integer', minimum: 0 } }),
  }),
};

const brigadaBody = objectSchema({
  numero: { type: 'string', maxLength: 30 },
  nombre: { type: 'string', maxLength: 150 },
  tipoBrigadaId: { type: 'integer', minimum: 1 },
  regionId: { type: 'integer', minimum: 1 },
  departamentoId: { type: 'integer', minimum: 1, nullable: true },
  municipioId: { type: 'integer', minimum: 1, nullable: true },
  activo: { type: 'boolean' },
});

paths['/brigadas'] = {
  get: operation({
    tag: 'Brigadas',
    summary: 'Listar brigadas',
    operationId: 'listBrigadas',
    description:
      'Sin parámetros de paginación conserva `data.brigadas` para compatibilidad con integraciones existentes. Al enviar `page`, `limit`, `sortBy` o `sortDir`, devuelve metadata paginada. El límite máximo paginado es 500.',
    parameters: [
      parameterRef('Page'),
      queryParameter('limit', 'Cantidad de brigadas por página; máximo 500.', {
        type: 'integer',
        minimum: 1,
        maximum: 500,
        default: 50,
      }),
      queryParameter('sortBy', 'Campo de ordenamiento.', {
        type: 'string',
        enum: ['id', 'numero', 'nombre', 'activo', 'createdAt'],
        default: 'numero',
      }),
      sortDirectionParameter,
      queryParameter('texto', 'Busca por número o nombre.', { type: 'string', maxLength: 150 }),
      queryParameter('activo', 'Filtra por estado activo.', { type: 'boolean' }),
      queryParameter('tipoBrigadaId', 'Filtra por tipo de brigada.', {
        type: 'integer',
        minimum: 1,
      }),
      queryParameter('regionId', 'Filtra por región.', { type: 'integer', minimum: 1 }),
      queryParameter('departamentoId', 'Filtra por departamento.', {
        type: 'integer',
        minimum: 1,
      }),
      queryParameter('municipioId', 'Filtra por municipio.', { type: 'integer', minimum: 1 }),
    ],
    dataSchema: {
      oneOf: [
        objectSchema({ brigadas: arrayOf(ref('Brigada')) }, ['brigadas']),
        paginatedData('brigadas', ref('Brigada')),
      ],
    },
  }),
  post: operation({
    tag: 'Brigadas',
    summary: 'Crear brigada',
    operationId: 'createBrigada',
    successStatus: 201,
    requestBody: jsonBody({
      ...brigadaBody,
      required: ['numero', 'nombre', 'tipoBrigadaId', 'regionId'],
    }),
    dataSchema: objectSchema({ brigada: ref('Brigada') }, ['brigada']),
  }),
};

paths['/brigadas/opciones'] = {
  get: operation({
    tag: 'Brigadas',
    summary: 'Buscar opciones livianas de brigada',
    operationId: 'listBrigadaOptions',
    description:
      'Proyección paginada para filtros y autocompletes. Devuelve 20 elementos por defecto y hasta 100; omite miembros, conteos, fechas y relaciones administrativas. No está disponible para Extractor API.',
    parameters: [
      parameterRef('Page'),
      queryParameter('limit', 'Cantidad de opciones por página; máximo 100.', {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 20,
      }),
      queryParameter('texto', 'Busca por número o nombre.', { type: 'string', maxLength: 150 }),
      queryParameter('activo', 'Filtra por estado; por defecto es true.', {
        type: 'boolean',
        default: true,
      }),
      queryParameter('tipoBrigadaId', 'Filtra por tipo de brigada.', {
        type: 'integer',
        minimum: 1,
      }),
      queryParameter('regionId', 'Filtra por región.', { type: 'integer', minimum: 1 }),
      queryParameter('departamentoId', 'Filtra por departamento.', {
        type: 'integer',
        minimum: 1,
      }),
      queryParameter('municipioId', 'Filtra por municipio.', { type: 'integer', minimum: 1 }),
    ],
    dataSchema: objectSchema(
      {
        brigadas: arrayOf(ref('BrigadaOpcion')),
        pagination: ref('PaginationMetadata'),
      },
      ['brigadas', 'pagination'],
    ),
  }),
};

paths['/brigadas/mis-brigadas'] = {
  get: operation({
    tag: 'Brigadas',
    summary: 'Listar brigadas del usuario autenticado',
    operationId: 'listMisBrigadas',
    dataSchema: objectSchema({ brigadas: arrayOf(ref('Brigada')) }, ['brigadas']),
  }),
};

paths['/brigadas/{id}'] = {
  get: operation({
    tag: 'Brigadas',
    summary: 'Obtener brigada por id',
    operationId: 'getBrigadaById',
    parameters: [parameterRef('Id')],
    dataSchema: objectSchema({ brigada: ref('Brigada') }, ['brigada']),
  }),
  put: operation({
    tag: 'Brigadas',
    summary: 'Actualizar brigada',
    operationId: 'updateBrigada',
    parameters: [parameterRef('Id')],
    requestBody: jsonBody(brigadaBody),
    dataSchema: objectSchema({ brigada: ref('Brigada') }, ['brigada']),
  }),
  delete: operation({
    tag: 'Brigadas',
    summary: 'Desactivar brigada',
    operationId: 'deleteBrigada',
    parameters: [parameterRef('Id')],
    dataSchema: objectSchema({ brigada: ref('Brigada') }, ['brigada']),
  }),
};

paths['/brigadas/{id}/miembros'] = {
  get: operation({
    tag: 'Brigadas',
    summary: 'Listar miembros de una brigada',
    operationId: 'listBrigadaMiembros',
    parameters: [
      parameterRef('Id'),
      queryParameter('activo', 'Filtra miembros activos.', { type: 'boolean' }),
    ],
    dataSchema: objectSchema({ miembros: arrayOf(ref('BrigadaMiembro')) }, ['miembros']),
  }),
  post: operation({
    tag: 'Brigadas',
    summary: 'Agregar miembro a una brigada',
    operationId: 'addBrigadaMiembro',
    parameters: [parameterRef('Id')],
    successStatus: 201,
    requestBody: jsonBody(
      objectSchema(
        {
          idUsuario: { type: 'integer', minimum: 1 },
          cargoEnBrigada: { type: 'string', nullable: true },
          esLider: { type: 'boolean', default: false },
          fechaDesde: { type: 'string', format: 'date-time' },
          fechaHasta: { type: 'string', format: 'date-time', nullable: true },
        },
        ['idUsuario'],
      ),
    ),
    dataSchema: objectSchema({ miembro: ref('BrigadaMiembro') }, ['miembro']),
  }),
};

paths['/brigadas/{id}/miembros/{idMiembro}'] = {
  put: operation({
    tag: 'Brigadas',
    summary: 'Actualizar miembro de brigada',
    operationId: 'updateBrigadaMiembro',
    parameters: [parameterRef('Id'), parameterRef('IdMiembro')],
    requestBody: jsonBody(
      objectSchema({
        cargoEnBrigada: { type: 'string', nullable: true },
        esLider: { type: 'boolean' },
        activo: { type: 'boolean' },
        fechaDesde: { type: 'string', format: 'date-time' },
        fechaHasta: { type: 'string', format: 'date-time', nullable: true },
      }),
    ),
    dataSchema: objectSchema({ miembro: ref('BrigadaMiembro') }, ['miembro']),
  }),
  delete: operation({
    tag: 'Brigadas',
    summary: 'Retirar miembro de brigada',
    operationId: 'deleteBrigadaMiembro',
    parameters: [parameterRef('Id'), parameterRef('IdMiembro')],
    dataSchema: objectSchema({ miembro: ref('BrigadaMiembro') }, ['miembro']),
  }),
};

const dashboardEndpoints = [
  ['resumen', 'Obtener resumen general', 'getDashboardResumen', ref('DashboardResumen')],
  [
    'casos-por-estado',
    'Obtener casos agrupados por estado',
    'getDashboardCasosPorEstado',
    objectSchema({ items: arrayOf({ type: 'object', additionalProperties: true }) }),
  ],
  [
    'casos-por-area',
    'Obtener casos agrupados por área',
    'getDashboardCasosPorArea',
    objectSchema({ items: arrayOf({ type: 'object', additionalProperties: true }) }),
  ],
  [
    'casos-por-criticidad',
    'Obtener casos agrupados por criticidad',
    'getDashboardCasosPorCriticidad',
    objectSchema({ items: arrayOf({ type: 'object', additionalProperties: true }) }),
  ],
  [
    'acciones-vencidas',
    'Obtener acciones vencidas',
    'getDashboardAccionesVencidas',
    objectSchema({
      acciones: arrayOf(ref('AccionCorrectiva')),
      pagination: ref('PaginationMetadata'),
    }),
    paginationParameters,
  ],
  [
    'ultimos-casos',
    'Obtener últimos casos',
    'getDashboardUltimosCasos',
    objectSchema({ casos: arrayOf(ref('Caso')) }),
    [queryParameter('limit', 'Cantidad máxima de casos.', { type: 'integer', minimum: 1 })],
  ],
];

for (const [path, summary, operationId, dataSchema, parameters] of dashboardEndpoints) {
  paths[`/dashboard/${path}`] = {
    get: operation({ tag: 'Dashboard', summary, operationId, dataSchema, parameters }),
  };
}

const brigadaDashboardFilters = [
  queryParameter('region', 'Id de región.', { type: 'integer', minimum: 1 }),
  queryParameter('departamento', 'Id de departamento.', { type: 'integer', minimum: 1 }),
  queryParameter('municipio', 'Id de municipio.', { type: 'integer', minimum: 1 }),
  queryParameter('tipoBrigada', 'Id de tipo de brigada.', { type: 'integer', minimum: 1 }),
];
const brigadaRankingLimitParameter = queryParameter(
  'limit',
  'Cantidad máxima del ranking. El frontend usa 10; máximo 100. Si se omite, se conserva el listado completo por compatibilidad.',
  { type: 'integer', minimum: 1, maximum: 100, example: 10 },
);
const brigadaRankingSchemas = {
  'casos-por-brigada': ref('DashboardCasosPorBrigadaItem'),
  'integrantes-por-brigada': ref('DashboardIntegrantesPorBrigadaItem'),
  'casos-abiertos-por-brigada': ref('DashboardCasosAbiertosPorBrigadaItem'),
};

const brigadaDashboardEndpoints = [
  ['resumen', 'Obtener resumen de brigadas', 'getDashboardBrigadasResumen'],
  ['casos-por-region', 'Obtener casos de brigadas por región', 'getBrigadaCasesByRegion'],
  [
    'casos-por-departamento',
    'Obtener casos de brigadas por departamento',
    'getBrigadaCasesByDepartamento',
  ],
  ['casos-por-municipio', 'Obtener casos de brigadas por municipio', 'getBrigadaCasesByMunicipio'],
  ['casos-por-brigada', 'Obtener casos agrupados por brigada', 'getCasesByBrigada'],
  [
    'integrantes-por-brigada',
    'Obtener integrantes activos por brigada',
    'getActiveMembersByBrigada',
  ],
  [
    'casos-abiertos-por-brigada',
    'Obtener casos abiertos por brigada',
    'getOpenCasesByBrigada',
  ],
];

for (const [path, summary, operationId] of brigadaDashboardEndpoints) {
  const rankingSchema = brigadaRankingSchemas[path];
  paths[`/dashboard/brigadas/${path}`] = {
    get: operation({
      tag: 'Dashboard',
      summary,
      operationId,
      description: rankingSchema
        ? 'Cuando se envía `limit`, PostgreSQL devuelve directamente el Top N con orden estable. Los valores cero se incluyen sólo si no hay suficientes brigadas con valores positivos.'
        : undefined,
      parameters: rankingSchema
        ? [...brigadaDashboardFilters, brigadaRankingLimitParameter]
        : brigadaDashboardFilters,
      dataSchema:
        path === 'resumen'
          ? ref('DashboardBrigadasResumen')
          : objectSchema({
              items: arrayOf(
                rankingSchema ?? { type: 'object', additionalProperties: true },
              ),
            }),
    }),
  };
}

module.exports = paths;
