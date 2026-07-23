const schemas = {
  ApiResponse: {
    type: 'object',
    required: ['success', 'message', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Operación completada correctamente' },
      data: { type: 'object', additionalProperties: true },
    },
  },
  ErrorResponse: {
    type: 'object',
    required: ['success', 'message'],
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'La solicitud no es válida' },
    },
  },
  PaginationMetadata: {
    type: 'object',
    required: [
      'page',
      'limit',
      'totalItems',
      'totalPages',
      'hasNextPage',
      'hasPreviousPage',
    ],
    properties: {
      page: { type: 'integer', minimum: 1, example: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 1000, example: 50 },
      totalItems: { type: 'integer', minimum: 0, example: 1250 },
      totalPages: { type: 'integer', minimum: 0, example: 25 },
      hasNextPage: { type: 'boolean', example: true },
      hasPreviousPage: { type: 'boolean', example: false },
    },
  },
  Catalogo: {
    type: 'object',
    required: ['id', 'nombre'],
    properties: {
      id: { type: 'integer', example: 1 },
      nombre: { type: 'string', example: 'Operaciones' },
      codigo: { type: 'string', nullable: true, example: 'OP' },
      descripcion: { type: 'string', nullable: true },
      activo: { type: 'boolean', example: true },
    },
  },
  LoginRequest: {
    type: 'object',
    required: ['correo', 'password'],
    properties: {
      correo: { type: 'string', format: 'email', example: 'usuario@sisca.local' },
      password: { type: 'string', format: 'password', example: 'su_contrasena' },
    },
  },
  LoginResponse: {
    allOf: [
      { $ref: '#/components/schemas/ApiResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            required: ['usuario', 'token'],
            properties: {
              usuario: { $ref: '#/components/schemas/Usuario' },
              token: {
                type: 'string',
                description: 'JWT de acceso. El valor mostrado es ilustrativo.',
                example: 'eyJhbGciOiJIUzI1NiJ9.token_de_ejemplo',
              },
            },
          },
        },
      },
    ],
  },
  Rol: {
    type: 'object',
    required: ['id', 'nombre'],
    properties: {
      id: { type: 'integer', example: 1 },
      nombre: { type: 'string', example: 'Administrador' },
      descripcion: { type: 'string', nullable: true },
      activo: { type: 'boolean', example: true },
      esBase: { type: 'boolean', example: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  Usuario: {
    type: 'object',
    required: ['id', 'nombre', 'correo', 'activo', 'roles'],
    properties: {
      id: { type: 'integer', example: 12 },
      nombre: { type: 'string', example: 'Usuario SISCA' },
      correo: { type: 'string', format: 'email', example: 'usuario@sisca.local' },
      activo: { type: 'boolean', example: true },
      roles: { type: 'array', items: { $ref: '#/components/schemas/Rol' } },
      ultimoAcceso: { type: 'string', format: 'date-time', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  UsuarioOpcion: {
    type: 'object',
    required: ['id', 'nombre', 'correo'],
    description:
      'Proyección liviana para selectores remotos. No contiene roles ni datos administrativos.',
    properties: {
      id: { type: 'integer', example: 12 },
      nombre: { type: 'string', example: 'Usuario SISCA' },
      correo: { type: 'string', format: 'email', example: 'usuario@sisca.local' },
    },
  },
  Caso: {
    type: 'object',
    required: ['id', 'correlativo', 'fechaEvento', 'estado'],
    properties: {
      id: { type: 'integer', example: 101 },
      correlativo: { type: 'string', example: 'CA-2026-000101' },
      titulo: { type: 'string', nullable: true },
      descripcion: { type: 'string', nullable: true },
      fechaEvento: { type: 'string', format: 'date-time' },
      fechaReporte: { type: 'string', format: 'date-time' },
      lugar: { type: 'string', nullable: true },
      area: { $ref: '#/components/schemas/Catalogo' },
      proceso: { $ref: '#/components/schemas/Catalogo' },
      tipoEvento: { $ref: '#/components/schemas/Catalogo' },
      criticidad: { $ref: '#/components/schemas/Catalogo' },
      estado: { $ref: '#/components/schemas/Catalogo' },
      usuarioReporta: { $ref: '#/components/schemas/Usuario' },
      brigadaReportante: {
        allOf: [{ $ref: '#/components/schemas/Brigada' }],
        nullable: true,
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  Brigada: {
    type: 'object',
    required: ['id', 'numero', 'nombre', 'activo'],
    properties: {
      id: { type: 'integer', example: 8 },
      numero: { type: 'string', example: 'BR-008' },
      nombre: { type: 'string', example: 'Brigada Central' },
      activo: { type: 'boolean', example: true },
      tipoBrigada: { $ref: '#/components/schemas/Catalogo' },
      region: { $ref: '#/components/schemas/Catalogo' },
      departamento: { $ref: '#/components/schemas/Catalogo' },
      municipio: { $ref: '#/components/schemas/Catalogo' },
      miembrosActivos: { type: 'integer', minimum: 0, example: 6 },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  BrigadaOpcion: {
    type: 'object',
    required: ['id', 'numero', 'nombre', 'tipoBrigada', 'region'],
    properties: {
      id: { type: 'integer', example: 8 },
      numero: { type: 'string', example: 'BR-008' },
      nombre: { type: 'string', example: 'Brigada Central' },
      tipoBrigada: { $ref: '#/components/schemas/Catalogo' },
      region: { $ref: '#/components/schemas/Catalogo' },
      departamento: {
        allOf: [{ $ref: '#/components/schemas/Catalogo' }],
        nullable: true,
      },
      municipio: {
        allOf: [{ $ref: '#/components/schemas/Catalogo' }],
        nullable: true,
      },
    },
  },
  BrigadaMiembro: {
    type: 'object',
    required: ['id', 'usuario', 'activo'],
    properties: {
      id: { type: 'integer', example: 24 },
      cargoEnBrigada: { type: 'string', nullable: true, example: 'Coordinador' },
      esLider: { type: 'boolean', example: false },
      activo: { type: 'boolean', example: true },
      usuario: { $ref: '#/components/schemas/Usuario' },
      fechaDesde: { type: 'string', format: 'date-time' },
      fechaHasta: { type: 'string', format: 'date-time', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  Expediente: {
    type: 'object',
    required: ['datosGenerales'],
    properties: {
      datosGenerales: { $ref: '#/components/schemas/Caso' },
      reporteInicial: { type: 'object', nullable: true, additionalProperties: true },
      validacionesProcedencia: {
        type: 'array',
        items: { type: 'object', additionalProperties: true },
      },
      divulgaciones: { type: 'array', items: { type: 'object', additionalProperties: true } },
      accionesCorrectivas: {
        type: 'array',
        items: { $ref: '#/components/schemas/AccionCorrectiva' },
      },
      evidencias: { type: 'array', items: { type: 'object', additionalProperties: true } },
      comentariosObservacion: {
        type: 'array',
        items: { type: 'object', additionalProperties: true },
      },
      bitacora: { type: 'array', items: { type: 'object', additionalProperties: true } },
      notificaciones: { type: 'array', items: { $ref: '#/components/schemas/Notificacion' } },
    },
  },
  AccionCorrectiva: {
    type: 'object',
    required: ['id', 'descripcion', 'fechaCompromiso'],
    properties: {
      id: { type: 'integer', example: 44 },
      idCaso: { type: 'integer', example: 101 },
      titulo: { type: 'string' },
      descripcion: { type: 'string', example: 'Corregir la condición detectada' },
      responsable: { $ref: '#/components/schemas/Usuario' },
      estado: { $ref: '#/components/schemas/Catalogo' },
      fechaCompromiso: { type: 'string', format: 'date-time' },
      fechaCierre: { type: 'string', format: 'date-time', nullable: true },
      porcentajeAvance: { type: 'integer', minimum: 0, maximum: 100, example: 50 },
      observaciones: { type: 'string', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  Notificacion: {
    type: 'object',
    required: ['id', 'titulo', 'mensaje', 'leida'],
    properties: {
      id: { type: 'integer', example: 90 },
      tipo: { type: 'string', nullable: true, example: 'CASO_ACTUALIZADO' },
      titulo: { type: 'string' },
      mensaje: { type: 'string' },
      leida: { type: 'boolean', example: false },
      fechaLectura: { type: 'string', format: 'date-time', nullable: true },
      casiAccidente: {
        type: 'object',
        nullable: true,
        properties: {
          id: { type: 'integer' },
          correlativo: { type: 'string' },
          titulo: { type: 'string', nullable: true },
        },
      },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  DashboardResumen: {
    type: 'object',
    properties: {
      totalCasos: { type: 'integer', minimum: 0, example: 1250 },
      casosAbiertos: { type: 'integer', minimum: 0, example: 180 },
      casosCerrados: { type: 'integer', minimum: 0, example: 1070 },
      casosEnRevision: { type: 'integer', minimum: 0, example: 15 },
      accionesPendientes: { type: 'integer', minimum: 0, example: 35 },
      accionesVencidas: { type: 'integer', minimum: 0, example: 4 },
      accionesEnValidacion: { type: 'integer', minimum: 0, example: 8 },
    },
  },
  DashboardBrigadasResumen: {
    type: 'object',
    properties: {
      totalBrigadas: { type: 'integer', minimum: 0, example: 45 },
      brigadasActivas: { type: 'integer', minimum: 0, example: 42 },
      brigadasInactivas: { type: 'integer', minimum: 0, example: 3 },
      totalMiembrosActivos: { type: 'integer', minimum: 0, example: 260 },
      totalCasosConBrigada: { type: 'integer', minimum: 0, example: 1180 },
      totalCasosSinBrigada: { type: 'integer', minimum: 0, example: 70 },
      brigadasConCasosAbiertos: { type: 'integer', minimum: 0, example: 18 },
    },
  },
  DashboardCasosPorBrigadaItem: {
    type: 'object',
    required: [
      'brigadaId',
      'numero',
      'nombre',
      'region',
      'departamento',
      'municipio',
      'totalCasos',
    ],
    properties: {
      brigadaId: { type: 'integer', minimum: 1 },
      numero: { type: 'string' },
      nombre: { type: 'string' },
      region: { type: 'string' },
      departamento: { type: 'string' },
      municipio: { type: 'string' },
      totalCasos: { type: 'integer', minimum: 0 },
    },
  },
  DashboardIntegrantesPorBrigadaItem: {
    type: 'object',
    required: [
      'brigadaId',
      'numero',
      'nombre',
      'totalIntegrantesActivos',
      'totalLideresActivos',
    ],
    properties: {
      brigadaId: { type: 'integer', minimum: 1 },
      numero: { type: 'string' },
      nombre: { type: 'string' },
      totalIntegrantesActivos: { type: 'integer', minimum: 0 },
      totalLideresActivos: { type: 'integer', minimum: 0 },
    },
  },
  DashboardCasosAbiertosPorBrigadaItem: {
    type: 'object',
    required: ['brigadaId', 'numero', 'nombre', 'casosAbiertos'],
    properties: {
      brigadaId: { type: 'integer', minimum: 1 },
      numero: { type: 'string' },
      nombre: { type: 'string' },
      casosAbiertos: { type: 'integer', minimum: 0 },
    },
  },
};

const parameters = {
  Id: {
    name: 'id',
    in: 'path',
    required: true,
    description: 'Identificador entero positivo del recurso.',
    schema: { type: 'integer', minimum: 1 },
  },
  IdCaso: {
    name: 'idCaso',
    in: 'path',
    required: true,
    description: 'Identificador entero positivo del caso.',
    schema: { type: 'integer', minimum: 1 },
  },
  IdAccion: {
    name: 'idAccion',
    in: 'path',
    required: true,
    description: 'Identificador entero positivo de la acción correctiva.',
    schema: { type: 'integer', minimum: 1 },
  },
  IdMiembro: {
    name: 'idMiembro',
    in: 'path',
    required: true,
    description: 'Identificador entero positivo del miembro de brigada.',
    schema: { type: 'integer', minimum: 1 },
  },
  Page: {
    name: 'page',
    in: 'query',
    description: 'Página solicitada (base 1).',
    schema: { type: 'integer', minimum: 1, default: 1 },
  },
  Limit: {
    name: 'limit',
    in: 'query',
    description: 'Registros por página. El máximo permitido es 1000.',
    schema: { type: 'integer', minimum: 1, maximum: 1000, default: 50 },
  },
  SortDir: {
    name: 'sortDir',
    in: 'query',
    description: 'Dirección del ordenamiento.',
    schema: { type: 'string', enum: ['asc', 'desc'] },
  },
};

const errorResponse = (description) => ({
  description,
  content: {
    'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
  },
});

const responses = {
  BadRequest: errorResponse('Solicitud inválida.'),
  Unauthorized: errorResponse('Token ausente, inválido o expirado.'),
  Forbidden: errorResponse('El usuario no posee los permisos requeridos.'),
  NotFound: errorResponse('Recurso no encontrado.'),
  InternalError: errorResponse('Error interno del servidor.'),
};

module.exports = { schemas, parameters, responses };
