const swaggerJSDoc = require('swagger-jsdoc');
const paths = require('../docs/openapi.paths');
const { schemas, parameters, responses } = require('../docs/openapi.schemas');

const tags = [
  'Auth',
  'Usuarios',
  'Roles',
  'Catálogos',
  'Casos',
  'Expedientes',
  'Reportes Iniciales',
  'Validaciones',
  'Acciones Correctivas',
  'Evidencias',
  'Cierre de Casos',
  'Notificaciones',
  'Brigadas',
  'Dashboard',
  'Health',
].map((name) => ({ name }));

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'SISCA API',
    version: '1.0.0',
    description:
      'Documentación interactiva de la API del Sistema Inteligente de Seguimiento a Casi-Accidentes. Para extracciones use el usuario técnico con rol **Extractor API**: (1) autentíquese en `POST /auth/login`, (2) copie el JWT, (3) abra **Authorize** e ingrese únicamente el token y (4) consuma los endpoints de consulta paginados. Swagger UI agrega el prefijo `Bearer` automáticamente. No use ni comparta una cuenta administradora para integraciones.',
  },
  servers: [
    {
      url: '/api',
      description: 'Servidor actual',
    },
  ],
  tags,
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Ingrese únicamente el JWT, sin escribir la palabra Bearer. Swagger UI construye el encabezado `Authorization: Bearer <token>`.',
      },
    },
    schemas,
    parameters,
    responses,
  },
  paths,
};

const swaggerSpec = swaggerJSDoc({
  definition,
  apis: [],
});

module.exports = swaggerSpec;
