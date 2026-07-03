function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || error.status || 500;
  const isOperational = error.isOperational || statusCode < 500;

  if (!isOperational) {
    console.error(error);
  }

  const response = {
    success: false,
    message: isOperational ? error.message : 'Error interno del servidor',
  };

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
