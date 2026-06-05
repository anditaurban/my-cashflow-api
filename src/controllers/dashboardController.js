const { pool } = require('../config/database');
const { sendSuccess } = require('../utils/response');
const { todayInJakarta } = require('../utils/dates');
const { validateDate, validateLimit } = require('../utils/validators');

function formatMoneySummary(row) {
  return {
    net_balance: Number(row.net_balance || 0),
    total_expense: Number(row.total_expense || 0),
    total_income: Number(row.total_income || 0),
    total_transactions: Number(row.total_transactions || 0)
  };
}

async function getDashboardSummary(req, res) {
  const date = validateDate(req.query.date || todayInJakarta(), 'date');
  const [rows] = await pool.execute(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' AND status = 'Selesai' THEN amount ELSE 0 END), 0) AS total_income,
       COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'Selesai' THEN amount ELSE 0 END), 0) AS total_expense,
       COALESCE(SUM(CASE
         WHEN type = 'income' AND status = 'Selesai' THEN amount
         WHEN type = 'expense' AND status = 'Selesai' THEN -amount
         ELSE 0
       END), 0) AS net_balance,
       COUNT(*) AS total_transactions
     FROM transactions
     WHERE transaction_date = ?`,
    [date]
  );

  sendSuccess(res, {
    date,
    ...formatMoneySummary(rows[0])
  }, 'Ringkasan dashboard berhasil diambil.');
}

async function getRecentTransactions(req, res) {
  const limit = validateLimit(req.query.limit, 5, 20);
  const [rows] = await pool.execute(
    `SELECT
       t.id,
       DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transaction_date,
       c.name AS category,
       t.description,
       t.type,
       t.amount,
       t.status
     FROM transactions AS t
     JOIN categories AS c ON c.id = t.category_id
     ORDER BY t.transaction_date DESC, t.id DESC
     LIMIT ?`,
    [limit]
  );

  sendSuccess(res, rows.map((row) => ({
    ...row,
    amount: Number(row.amount)
  })), 'Transaksi terbaru berhasil diambil.');
}

async function getCashflowChart(req, res) {
  const date = validateDate(req.query.date || todayInJakarta(), 'date');
  const [rows] = await pool.execute(
    `SELECT
       DATE_FORMAT(transaction_date, '%Y-%m-%d') AS transaction_date,
       SUM(CASE WHEN type = 'income' AND status = 'Selesai' THEN amount ELSE 0 END) AS income_total,
       SUM(CASE WHEN type = 'expense' AND status = 'Selesai' THEN amount ELSE 0 END) AS expense_total
     FROM transactions
     WHERE transaction_date BETWEEN DATE_SUB(?, INTERVAL 6 DAY) AND ?
     GROUP BY transaction_date
     ORDER BY transaction_date`,
    [date, date]
  );

  sendSuccess(res, rows.map((row) => ({
    ...row,
    expense_total: Number(row.expense_total || 0),
    income_total: Number(row.income_total || 0)
  })), 'Data grafik cashflow berhasil diambil.');
}

module.exports = {
  getCashflowChart,
  getDashboardSummary,
  getRecentTransactions
};
