const AppError = require('./app-error');

const MAX_SEQUENCE = 999999;

async function generarCorrelativo(client, year = new Date().getFullYear()) {
  const prefix = `SISCA-${year}-`;
  const ultimoCaso = await client.casiAccidente.findFirst({
    where: { correlativo: { startsWith: prefix } },
    orderBy: { correlativo: 'desc' },
    select: { correlativo: true },
  });

  const ultimoNumero = ultimoCaso
    ? Number.parseInt(ultimoCaso.correlativo.slice(prefix.length), 10)
    : 0;
  const siguienteNumero = ultimoNumero + 1;

  if (!Number.isInteger(siguienteNumero) || siguienteNumero > MAX_SEQUENCE) {
    throw new AppError(`Se agotó la secuencia de correlativos para el año ${year}`, 500);
  }

  return `${prefix}${String(siguienteNumero).padStart(6, '0')}`;
}

module.exports = { generarCorrelativo };
