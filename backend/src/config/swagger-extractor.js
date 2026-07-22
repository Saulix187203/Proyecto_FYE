const swaggerSpec = require('./swagger');
const filterOpenApiSpec = require('../docs/filter-openapi-spec');

const extractorAllowedOperations = Object.freeze({
  '/auth/login': ['post'],
  '/auth/me': ['get'],
  '/catalogos/areas': ['get'],
  '/catalogos/procesos': ['get'],
  '/catalogos/tipos-evento': ['get'],
  '/catalogos/criticidades': ['get'],
  '/catalogos/estados-caso': ['get'],
  '/catalogos/estados-accion': ['get'],
  '/catalogos/regiones': ['get'],
  '/catalogos/departamentos': ['get'],
  '/catalogos/municipios': ['get'],
  '/catalogos/tipos-brigada': ['get'],
  '/casos': ['get'],
  '/casos/{id}': ['get'],
  '/expedientes/{idCaso}': ['get'],
  '/acciones-correctivas': ['get'],
  '/acciones-correctivas/caso/{idCaso}': ['get'],
  '/acciones-correctivas/{id}': ['get'],
  '/brigadas': ['get'],
  '/brigadas/{id}': ['get'],
  '/brigadas/{id}/miembros': ['get'],
  '/dashboard/resumen': ['get'],
  '/dashboard/casos-por-estado': ['get'],
  '/dashboard/casos-por-area': ['get'],
  '/dashboard/casos-por-criticidad': ['get'],
  '/dashboard/acciones-vencidas': ['get'],
  '/dashboard/ultimos-casos': ['get'],
  '/dashboard/brigadas/resumen': ['get'],
  '/dashboard/brigadas/casos-por-region': ['get'],
  '/dashboard/brigadas/casos-por-departamento': ['get'],
  '/dashboard/brigadas/casos-por-municipio': ['get'],
  '/dashboard/brigadas/casos-por-brigada': ['get'],
  '/dashboard/brigadas/integrantes-por-brigada': ['get'],
  '/dashboard/brigadas/casos-abiertos-por-brigada': ['get'],
});

const extractorOpenApiSpec = filterOpenApiSpec(swaggerSpec, extractorAllowedOperations);

extractorOpenApiSpec.info = {
  ...extractorOpenApiSpec.info,
  title: 'SISCA API - Extractor de Datos',
  description:
    'Documentación de solo lectura para extracción técnica mediante API. Ejecute `POST /auth/login`, copie `data.token`, presione **Authorize**, pegue únicamente el token y consulte los endpoints GET paginados. Esta vista filtrada no sustituye los guards ni los middleware de autorización del backend.',
};

module.exports = extractorOpenApiSpec;
