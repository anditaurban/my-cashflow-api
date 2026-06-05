const { pool } = require('../config/database');
const { sendSuccess } = require('../utils/response');
const { validateDateRange } = require('../utils/validators');

function getDateRange(query) {
  return validateDateRange(query.start_date, query.end_date);
}

async function getReportSummary(req, res) {
  const range = getDateRange(req.query);
  const [rows] = await pool.execute(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' AND status = 'Selesai' THEN amount ELSE 0 END), 0) AS total_income,
       COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'Selesai' THEN amount ELSE 0 END), 0) AS total_expense,
       COALESCE(SUM(CASE
         WHEN type = 'income' AND status = 'Selesai' THEN amount
         WHEN type = 'expense' AND status = 'Selesai' THEN -amount
         ELSE 0
       END), 0) AS ending_balance,
       COUNT(*) AS total_transactions
     FROM transactions
     WHERE transaction_date BETWEEN ? AND ?`,
    [range.start_date, range.end_date]
  );

  sendSuccess(res, {
    ending_balance: Number(rows[0].ending_balance || 0),
    end_date: range.end_date,
    start_date: range.start_date,
    total_expense: Number(rows[0].total_expense || 0),
    total_income: Number(rows[0].total_income || 0),
    total_transactions: Number(rows[0].total_transactions || 0)
  }, 'Ringkasan laporan berhasil diambil.');
}

async function getReportCategories(req, res) {
  const range = getDateRange(req.query);
  const [rows] = await pool.execute(
    `SELECT
       c.name AS category,
       t.type,
       SUM(t.amount) AS total_amount
     FROM transactions AS t
     JOIN categories AS c ON c.id = t.category_id
     WHERE t.status = 'Selesai'
       AND t.transaction_date BETWEEN ? AND ?
     GROUP BY c.name, t.type
     ORDER BY total_amount DESC`,
    [range.start_date, range.end_date]
  );

  sendSuccess(res, rows.map((row) => ({
    ...row,
    total_amount: Number(row.total_amount || 0)
  })), 'Laporan per kategori berhasil diambil.');
}

async function getReportTransactions(req, res) {
  const range = getDateRange(req.query);
  const [rows] = await pool.execute(
    `SELECT
       t.id,
       DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transaction_date,
       c.name AS category,
       t.description,
       t.type,
       t.amount,
       pm.name AS payment_method,
       t.status
     FROM transactions AS t
     JOIN categories AS c ON c.id = t.category_id
     JOIN payment_methods AS pm ON pm.id = t.payment_method_id
     WHERE t.transaction_date BETWEEN ? AND ?
     ORDER BY t.transaction_date DESC, t.id DESC`,
    [range.start_date, range.end_date]
  );

  sendSuccess(res, rows.map((row) => ({
    ...row,
    amount: Number(row.amount)
  })), 'Daftar transaksi laporan berhasil diambil.');
}

module.exports = {
  getReportCategories,
  getReportSummary,
  getReportTransactions
};
