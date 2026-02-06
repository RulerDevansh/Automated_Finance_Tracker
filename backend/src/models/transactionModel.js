import { query } from '../config/db.js';

export const createTransaction = async ({ userId, categoryId, type, amount, description, occurredOn }) => {
  const result = await query(
    `INSERT INTO transactions (user_id, category_id, type, amount, description, occurred_on)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, category_id, type, amount, description, occurred_on, created_at`,
    [userId, categoryId || null, type, amount, description || null, occurredOn]
  );
  return result.rows[0];
};

export const getTransactionById = async ({ id, userId }) => {
  const result = await query(
    `SELECT id, user_id, category_id, type, amount, description, occurred_on, created_at, updated_at
     FROM transactions WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0] || null;
};

export const updateTransaction = async ({ id, userId, categoryId, type, amount, description, occurredOn }) => {
  const result = await query(
    `UPDATE transactions
     SET category_id = $1,
         type = $2,
         amount = $3,
         description = $4,
         occurred_on = $5,
         updated_at = NOW()
     WHERE id = $6 AND user_id = $7
     RETURNING id, user_id, category_id, type, amount, description, occurred_on, created_at, updated_at`,
    [categoryId || null, type, amount, description || null, occurredOn, id, userId]
  );
  return result.rows[0] || null;
};

export const deleteTransaction = async ({ id, userId }) => {
  const result = await query(
    `DELETE FROM transactions WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rowCount > 0;
};

export const listTransactions = async ({ userId, from, to, type, categoryId, limit = 50, offset = 0 }) => {
  const params = [userId];
  const filters = ['user_id = $1'];

  if (from) {
    params.push(from);
    filters.push(`occurred_on >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    filters.push(`occurred_on <= $${params.length}`);
  }
  if (type) {
    params.push(type);
    filters.push(`type = $${params.length}`);
  }
  if (categoryId) {
    params.push(categoryId);
    filters.push(`category_id = $${params.length}`);
  }

  params.push(limit, offset);

  const result = await query(
    `SELECT id, user_id, category_id, type, amount, description, occurred_on, created_at, updated_at
     FROM transactions
     WHERE ${filters.join(' AND ')}
     ORDER BY occurred_on DESC, created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return result.rows;
};

export const monthlyTotals = async ({ userId, year }) => {
  const result = await query(
    `SELECT date_part('month', occurred_on) AS month,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
     FROM transactions
     WHERE user_id = $1 AND date_part('year', occurred_on) = $2
     GROUP BY month
     ORDER BY month`,
    [userId, year]
  );
  return result.rows;
};

export const categoryTotals = async ({ userId, year, month, type }) => {
  const params = [userId];
  const filters = ['user_id = $1'];
  if (year) {
    params.push(year);
    filters.push(`date_part('year', occurred_on) = $${params.length}`);
  }
  if (month) {
    params.push(month);
    filters.push(`date_part('month', occurred_on) = $${params.length}`);
  }
  if (type) {
    params.push(type);
    filters.push(`type = $${params.length}`);
  }

  const result = await query(
    `SELECT category_id,
            SUM(amount) AS total,
            MIN(type) AS type
     FROM transactions
     WHERE ${filters.join(' AND ')}
     GROUP BY category_id`,
    params
  );
  return result.rows;
};

export const totals = async ({ userId }) => {
  const result = await query(
    `SELECT
       SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
       SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
     FROM transactions
     WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0];
};
