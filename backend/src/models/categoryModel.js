import { query } from '../config/db.js';

export const createCategory = async ({ userId, name, type }) => {
  const result = await query(
    `INSERT INTO categories (user_id, name, type)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, name, type, created_at`,
    [userId, name, type]
  );
  return result.rows[0];
};

export const listCategories = async ({ userId, type }) => {
  const params = [userId];
  let filter = '';
  if (type) {
    params.push(type);
    filter = 'AND type = $2';
  }
  const result = await query(
    `SELECT id, user_id, name, type, created_at, updated_at
     FROM categories
     WHERE user_id = $1 ${filter}
     ORDER BY type, name`,
    params
  );
  return result.rows;
};

export const getCategoryById = async ({ id, userId }) => {
  const result = await query(
    `SELECT id, user_id, name, type, created_at, updated_at
     FROM categories WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0] || null;
};

export const updateCategory = async ({ id, userId, name }) => {
  const result = await query(
    `UPDATE categories SET name = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING id, user_id, name, type, created_at, updated_at`,
    [name, id, userId]
  );
  return result.rows[0] || null;
};

export const deleteCategory = async ({ id, userId }) => {
  const hasTx = await categoryHasTransactions({ id, userId });
  if (hasTx) {
    const err = new Error('Cannot delete category with existing transactions');
    err.status = 400;
    throw err;
  }
  const result = await query(
    `DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId]
  );
  return result.rowCount > 0;
};

export const categoryHasTransactions = async ({ id, userId }) => {
  const result = await query(
    `SELECT 1 FROM transactions WHERE category_id = $1 AND user_id = $2 LIMIT 1`,
    [id, userId]
  );
  return result.rowCount > 0;
};
