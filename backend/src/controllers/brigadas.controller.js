const brigadasService = require('../services/brigadas.service');

async function list(req, res) {
  const result = await brigadasService.listBrigadas(req.query);
  const data = Array.isArray(result) ? { brigadas: result } : result;

  res.status(200).json({
    success: true,
    message: 'Brigadas obtenidas correctamente',
    data,
  });
}

async function listOptions(req, res) {
  const result = await brigadasService.listBrigadaOptions(req.query);

  res.status(200).json({
    success: true,
    message: 'Opciones de brigada obtenidas correctamente',
    data: result,
  });
}

async function getById(req, res) {
  const brigada = await brigadasService.getBrigadaById(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Brigada obtenida correctamente',
    data: { brigada },
  });
}

async function create(req, res) {
  const brigada = await brigadasService.createBrigada(req.body);

  res.status(201).json({
    success: true,
    message: 'Brigada creada correctamente',
    data: { brigada },
  });
}

async function update(req, res) {
  const brigada = await brigadasService.updateBrigada(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Brigada actualizada correctamente',
    data: { brigada },
  });
}

async function remove(req, res) {
  const brigada = await brigadasService.deactivateBrigada(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Brigada desactivada correctamente',
    data: { brigada },
  });
}

async function listMiembros(req, res) {
  const miembros = await brigadasService.listMiembrosBrigada(req.params.id, req.query);

  res.status(200).json({
    success: true,
    message: 'Miembros de brigada obtenidos correctamente',
    data: { miembros },
  });
}

async function addMiembro(req, res) {
  const miembro = await brigadasService.addMiembroBrigada(req.params.id, req.body);

  res.status(201).json({
    success: true,
    message: 'Miembro de brigada agregado correctamente',
    data: { miembro },
  });
}

async function updateMiembro(req, res) {
  const miembro = await brigadasService.updateMiembroBrigada(
    req.params.id,
    req.params.idMiembro,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: 'Miembro de brigada actualizado correctamente',
    data: { miembro },
  });
}

async function removeMiembro(req, res) {
  const miembro = await brigadasService.deactivateMiembroBrigada(
    req.params.id,
    req.params.idMiembro,
  );

  res.status(200).json({
    success: true,
    message: 'Miembro de brigada desactivado correctamente',
    data: { miembro },
  });
}

async function misBrigadas(req, res) {
  const brigadas = await brigadasService.listMisBrigadas(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Brigadas del usuario obtenidas correctamente',
    data: { brigadas },
  });
}

module.exports = {
  list,
  listOptions,
  getById,
  create,
  update,
  remove,
  listMiembros,
  addMiembro,
  updateMiembro,
  removeMiembro,
  misBrigadas,
};
