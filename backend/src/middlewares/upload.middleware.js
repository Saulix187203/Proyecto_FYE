const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const AppError = require('../utils/app-error');

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const UPLOAD_DIRECTORY = path.resolve(__dirname, '../../uploads/evidencias');
const allowedTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['application/pdf', '.pdf'],
]);

fs.mkdirSync(UPLOAD_DIRECTORY, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, UPLOAD_DIRECTORY),
  filename: (_req, file, callback) => {
    const extension = allowedTypes.get(file.mimetype);
    callback(null, `${Date.now()}-${randomUUID()}${extension}`);
  },
});

const uploader = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      return callback(
        new AppError('Tipo de archivo no permitido. Use JPEG, PNG, WEBP o PDF', 400),
      );
    }

    return callback(null, true);
  },
});

function uploadEvidence(req, res, next) {
  uploader.single('archivo')(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      const message =
        error.code === 'LIMIT_FILE_SIZE'
          ? 'El archivo supera el límite de 5 MB'
          : 'La carga del archivo no es válida';
      return next(new AppError(message, 400));
    }

    return next(error);
  });
}

module.exports = { uploadEvidence, UPLOAD_DIRECTORY, MAX_FILE_SIZE };
