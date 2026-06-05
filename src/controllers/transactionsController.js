const { pool } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const { sendCreated, sendSuccess } = require('../utils/response');
const {
  parseId,
  validateTransactionFilters,
  validateTransactionPayload
} = require('../utils/validators');

const transactionSelect = `
  SELECT
    t.id,
    DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transaction_date,
    t.category_id,
    c.name AS category,
    t.description,
    t.type,
    t.amount,
    t.payment_method_id,
    pm.name AS payment_method,
    t.status,
    t.note,
    t.created_at,
    t.updated_at
  FROM transactions AS t
  JOIN categories AS c ON c.id = t.category_id
  JOIN payment_methods AS pm ON pm.id = t.payment_method_id
`;

function formatTransaction(row) {
  return {
    ...row,
    amount: Number(row.amount)
  };
}

async function findTransactionById(id) {
  const [rows] = await pool.execute(
    `${transactionSelect}
     WHERE t.id = ?`,
    [id]
  );

  return rows[0] ? formatTransaction(rows[0]) : null;
}

async function ensureCategoryMatchesType(categoryId, type) {
  const [rows] = await pool.execute(
    `SELECT id, type
     FROM categories
     WHERE id = ?`,
    [categoryId]
  );

  if (!rows[0]) {
    throw new ApiError(400, 'category_id tidak ditemukan.');
  }

  if (rows[0].type !== type) {
    throw new ApiError(400, 'category_id harus sesuai dengan type transaksi.');
  }
}

async function ensurePaymentMethodExists(paymentMethodId) {
  const [rows] = await pool.execute(
    `SELECT id
     FROM payment_methods
     WHERE id = ?`,
    [paymentMethodId]
  );

  if (!rows[0]) {
    throw new ApiError(400, 'payment_method_id tidak ditemukan.');
  }
}

async function validateTransactionRelations(payload) {
  await ensureCategoryMatchesType(payload.category_id, payload.type);
  await ensurePaymentMethodExists(payload.payment_method_id);
}

async function listTransactions(req, res) {
  const filters = validateTransactionFilters(req.query);
  const where = [];
  const params = [];

  if (filters.keyword) {
    where.push(`(
      t.description LIKE ?
      OR c.name LIKE ?
      OR pm.name LIKE ?
    )`);
    params.push(`%${filters.keyword}%`, `%${filters.keyword}%`, `%${filters.keyword}%`);
  }

  if (filters.type !== 'all') {
    where.push('t.type = ?');
    params.push(filters.type);
  }

  if (filters.status !== 'all') {
    where.push('t.status = ?');
    params.push(filters.status);
  }

  if (filters.start_date && filters.end_date) {
    where.push('t.transaction_date BETWEEN ? AND ?');
    params.push(filters.start_date, filters.end_date);
  }

  let sql = transactionSelect;

  if (where.length > 0) {
    sql += ` WHERE ${where.join(' AND ')}`;
  }

  sql += ' ORDER BY t.transaction_date DESC, t.id DESC LIMIT ? OFFSET ?';
  params.push(filters.limit, filters.offset);

  const [rows] = await pool.execute(sql, params);

  sendSuccess(
    res,
    rows.map(formatTransaction),
    'Daftar transaksi berhasil diambil.',
    200,
    {
      limit: filters.limit,
      offset: filters.offset
    }
  );
}

async function createTransaction(req, res) {
  const payload = validateTransactionPayload(req.body);
  await validateTransactionRelations(payload);

  const [result] = await pool.execute(
    `INSERT INTO transactions (
       transaction_date,
       type,
       category_id,
       description,
       amount,
       payment_method_id,
       status,
       note
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.transaction_date,
      payload.type,
      payload.category_id,
      payload.description,
      payload.amount,
      payload.payment_method_id,
      payload.status,
      payload.note
    ]
  );

  const transaction = await findTransactionById(result.insertId);
  sendCreated(res, transaction, 'Transaksi berhasil dibuat.');
}

async function updateTransaction(req, res) {
  const id = parseId(req.params.id);
  const currentTransaction = await findTransactionById(id);

  if (!currentTransaction) {
    throw new ApiError(404, 'Transaksi tidak ditemukan.');
  }

  const payload = validateTransactionPayload(req.body, { isUpdate: true });
  await validateTransactionRelations(payload);

  await pool.execute(
    `UPDATE transactions
     SET
       transaction_date = ?,
       type = ?,
       category_id = ?,
       description = ?,
       amount = ?,
       payment_method_id = ?,
       status = ?,
       note = ?
     WHERE id = ?`,
    [
      payload.transaction_date,
      payload.type,
      payload.category_id,
      payload.description,
      payload.amount,
      payload.payment_method_id,
      payload.status,
      payload.note,
      id
    ]
  );

  const updatedTransaction = await findTransactionById(id);
  sendSuccess(res, updatedTransaction, 'Transaksi berhasil diperbarui.');
}

async function deleteTransaction(req, res) {
  const id = parseId(req.params.id);
  const [result] = await pool.execute(
    `DELETE FROM transactions
     WHERE id = ?`,
    [id]
  );

  if (result.affectedRows === 0) {
    throw new ApiError(404, 'Transaksi tidak ditemukan.');
  }

  sendSuccess(res, { id }, 'Transaksi berhasil dihapus.');
}

module.exports = {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction
};
