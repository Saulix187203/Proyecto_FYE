const prisma = require('../config/prisma');

function registrarBitacora({
  idCaso,
  idUsuario,
  accion,
  estadoAnterior = null,
  estadoNuevo = null,
  observacion = null,
  client = prisma,
}) {
  return client.bitacoraCaso.create({
    data: {
      casiAccidenteId: idCaso,
      usuarioId: idUsuario,
      estadoAnteriorId: estadoAnterior,
      estadoNuevoId: estadoNuevo,
      accionRealizada: accion,
      observacion,
    },
  });
}

module.exports = { registrarBitacora };
