const { pool } = require('../config/database');
const { sendSuccess } = require('../utils/response');

async function listPaymentMethods(req, res) {
  const [rows] = await pool.execute(
    `SELECT id, name, created_at, updated_at
     FROM payment_methods
     ORDER BY name`
  );

  sendSuccess(res, rows, 'Daftar metode pembayaran berhasil diambil.');
}

module.exports = {
  listPaymentMethods
};
