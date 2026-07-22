const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const port = Number.parseInt(process.env.PORT || '3000', 10);
const nodeEnv = process.env.NODE_ENV || 'development';
const corsOrigin =
  process.env.CORS_ORIGIN || (nodeEnv === 'production' ? '' : 'http://localhost:4200');

if (Number.isNaN(port)) {
  throw new Error('PORT must be a valid number');
}

const configuredCorsOrigins = corsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (configuredCorsOrigins.includes('*')) {
  throw new Error('CORS_ORIGIN no permite el origen comodín "*"');
}

const developmentCorsOrigins =
  nodeEnv === 'production'
    ? []
    : [`http://localhost:${port}`, `http://127.0.0.1:${port}`];
const corsOrigins = [...new Set([...configuredCorsOrigins, ...developmentCorsOrigins])];

module.exports = Object.freeze({
  nodeEnv,
  port,
  databaseUrl: process.env.DATABASE_URL,
  corsOrigin,
  corsOrigins: Object.freeze(corsOrigins),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  enableSwagger:
    nodeEnv !== 'production' || String(process.env.ENABLE_SWAGGER).toLowerCase() === 'true',
});
