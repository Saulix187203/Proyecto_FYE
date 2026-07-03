function getStatus() {
  return {
    status: 'ok',
    service: 'sisca-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}

module.exports = { getStatus };
