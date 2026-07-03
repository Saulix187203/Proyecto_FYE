const app = require('./src/app');
const env = require('./src/config/env');
const prisma = require('./src/config/prisma');

const server = app.listen(env.port, () => {
  console.log(`SISCA API running on http://localhost:${env.port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
