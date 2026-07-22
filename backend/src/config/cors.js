const env = require('./env');
const AppError = require('../utils/app-error');

module.exports = {
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new AppError(`Origen no permitido por CORS: ${origin}`, 403));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
