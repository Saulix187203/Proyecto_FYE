const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const port = Number.parseInt(process.env.PORT || '3000', 10);

if (Number.isNaN(port)) {
  throw new Error('PORT must be a valid number');
}

module.exports = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port,
  databaseUrl: process.env.DATABASE_URL,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
});
