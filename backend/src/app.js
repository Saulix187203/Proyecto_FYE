const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const corsOptions = require('./config/cors');
const env = require('./config/env');
const extractorOpenApiSpec = require('./config/swagger-extractor');
const swaggerSpec = require('./config/swagger');
const apiRoutes = require('./routes');
const notFound = require('./middlewares/not-found.middleware');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

app.disable('x-powered-by');
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.enableSwagger) {
  app.get('/api/openapi.json', (_req, res) => {
    res.status(200).json(swaggerSpec);
  });
  app.get('/api/openapi-extractor.json', (_req, res) => {
    res.status(200).json(extractorOpenApiSpec);
  });
  app.get(/^\/api\/docs\/extractor$/, (_req, res) => res.redirect(308, '/api/docs/extractor/'));
  app.use(
    '/api/docs/extractor/',
    swaggerUi.serve,
    swaggerUi.setup(extractorOpenApiSpec, {
      customSiteTitle: 'SISCA API - Extractor de Datos',
      swaggerOptions: {
        displayRequestDuration: true,
        persistAuthorization: true,
      },
    }),
  );
  app.get(/^\/api\/docs$/, (_req, res) => res.redirect(308, '/api/docs/'));
  app.use(
    '/api/docs/',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'SISCA API Docs',
      swaggerOptions: {
        displayRequestDuration: true,
        persistAuthorization: true,
      },
    }),
  );
}

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
