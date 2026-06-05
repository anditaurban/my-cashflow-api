const { pool } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/response');
const { validateSettingsPayload } = require('../utils/validators');

function formatSettings(row) {
  return {
    ...row,
    notifications_enabled: Boolean(row.notifications_enabled)
  };
}

async function getSettings(req, res) {
  const [rows] = await pool.execute(
    `SELECT
       id,
       business_name,
       owner_name,
       currency,
       date_format,
       display_mode,
       notifications_enabled,
       created_at,
       updated_at
     FROM business_settings
     WHERE id = 1`
  );

  if (!rows[0]) {
    throw new ApiError(404, 'Pengaturan bisnis tidak ditemukan.');
  }

  sendSuccess(res, formatSettings(rows[0]), 'Pengaturan bisnis berhasil diambil.');
}

async function updateSettings(req, res) {
  const payload = validateSettingsPayload(req.body);
  const [result] = await pool.execute(
    `UPDATE business_settings
     SET
       business_name = ?,
       owner_name = ?,
       currency = ?,
       date_format = ?,
       display_mode = ?,
       notifications_enabled = ?
     WHERE id = 1`,
    [
      payload.business_name,
      payload.owner_name,
      payload.currency,
      payload.date_format,
      payload.display_mode,
      payload.notifications_enabled
    ]
  );

  if (result.affectedRows === 0) {
    throw new ApiError(404, 'Pengaturan bisnis tidak ditemukan.');
  }

  await getSettings(req, res);
}

module.exports = {
  getSettings,
  updateSettings
};
