function sendSuccess(res, data = null, message = 'OK', statusCode = 200, meta = null) {
  const body = {
    success: true,
    message,
    data
  };

  if (meta) {
    body.meta = meta;
  }

  return res.status(statusCode).json(body);
}

function sendCreated(res, data = null, message = 'Data berhasil dibuat.') {
  return sendSuccess(res, data, message, 201);
}

module.exports = {
  sendCreated,
  sendSuccess
};
