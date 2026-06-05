const { pool } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const { sendCreated, sendSuccess } = require('../utils/response');
const {
  parseId,
  validateCategoryCreate,
  validateCategoryUpdate
} = require('../utils/validators');

function formatCategory(row) {
  return {
    ...row,
    is_default: Boolean(row.is_default)
  };
}

async function findCategoryById(client, id) {
  const [rows] = await client.execute(
    `SELECT id, name, type, is_default, created_at, updated_at
     FROM categories
     WHERE id = ?`,
    [id]
  );

  return rows[0] ? formatCategory(rows[0]) : null;
}

async function listCategories(req, res) {
  const params = [];
  let sql = `SELECT id, name, type, is_default, created_at, updated_at
             FROM categories`;

  if (req.query.type && req.query.type !== 'all') {
    if (!['income', 'expense'].includes(req.query.type)) {
      throw new ApiError(400, 'type harus income, expense, atau all.');
    }

    sql += ' WHERE type = ?';
    params.push(req.query.type);
  }

  sql += ' ORDER BY type, name';

  const [rows] = await pool.execute(sql, params);
  sendSuccess(res, rows.map(formatCategory), 'Daftar kategori berhasil diambil.');
}

async function createCategory(req, res) {
  const payload = validateCategoryCreate(req.body);
  const [result] = await pool.execute(
    `INSERT INTO categories (name, type, is_default)
     VALUES (?, ?, ?)`,
    [payload.name, payload.type, payload.is_default]
  );
  const category = await findCategoryById(pool, result.insertId);

  sendCreated(res, category, 'Kategori berhasil dibuat.');
}

async function updateCategory(req, res) {
  const id = parseId(req.params.id);
  const payload = validateCategoryUpdate(req.body);
  const category = await findCategoryById(pool, id);

  if (!category) {
    throw new ApiError(404, 'Kategori tidak ditemukan.');
  }

  if (category.is_default) {
    throw new ApiError(403, 'Kategori default tidak dapat diubah.');
  }

  await pool.execute(
    `UPDATE categories
     SET name = ?
     WHERE id = ?
       AND is_default = FALSE`,
    [payload.name, id]
  );

  const updatedCategory = await findCategoryById(pool, id);
  sendSuccess(res, updatedCategory, 'Kategori berhasil diperbarui.');
}

async function deleteCategory(req, res) {
  const id = parseId(req.params.id);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [categoryRows] = await connection.execute(
      `SELECT id, name, type, is_default
       FROM categories
       WHERE id = ?
       FOR UPDATE`,
      [id]
    );
    const category = categoryRows[0] ? formatCategory(categoryRows[0]) : null;

    if (!category) {
      throw new ApiError(404, 'Kategori tidak ditemukan.');
    }

    if (category.is_default) {
      throw new ApiError(403, 'Kategori default tidak dapat dihapus.');
    }

    const [fallbackRows] = await connection.execute(
      `SELECT id
       FROM categories
       WHERE name = 'Lainnya'
         AND type = ?
       LIMIT 1`,
      [category.type]
    );

    if (!fallbackRows[0]) {
      throw new ApiError(409, 'Kategori fallback Lainnya tidak ditemukan.');
    }

    const fallbackCategoryId = fallbackRows[0].id;
    const [moveResult] = await connection.execute(
      `UPDATE transactions
       SET category_id = ?
       WHERE category_id = ?`,
      [fallbackCategoryId, id]
    );

    await connection.execute(
      `DELETE FROM categories
       WHERE id = ?
         AND is_default = FALSE`,
      [id]
    );

    await connection.commit();

    sendSuccess(res, {
      fallback_category_id: fallbackCategoryId,
      id,
      moved_transactions: moveResult.affectedRows
    }, 'Kategori berhasil dihapus.');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory
};
