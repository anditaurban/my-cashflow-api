class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

function normalizeDatabaseError(error) {
  if (!error || !error.code) {
    return error;
  }

  if (error.code === 'ER_DUP_ENTRY') {
    return new ApiError(409, 'Data dengan nilai tersebut sudah ada.');
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return new ApiError(400, 'Relasi data tidak valid.');
  }

  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    return new ApiError(409, 'Data masih dipakai oleh data lain.');
  }

  return error;
}

function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`));
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const normalizedError = normalizeDatabaseError(error);
  const statusCode = normalizedError.statusCode || 500;
  const body = {
    success: false,
    message: normalizedError.message || 'Terjadi kesalahan pada server.'
  };

  if (normalizedError.details) {
    body.errors = normalizedError.details;
  }

  if (process.env.NODE_ENV === 'development' && normalizedError.stack) {
    body.stack = normalizedError.stack;
  }

  return res.status(statusCode).json(body);
}

module.exports = {
  ApiError,
  errorHandler,
  notFoundHandler
};
