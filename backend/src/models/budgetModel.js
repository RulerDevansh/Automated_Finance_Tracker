import { query } from '../config/db.js';

export const upsertBudget = async ({ userId, categoryId, amount, periodMonth, periodYear }) => {
  const result = await query(
    `INSERT INTO budgets (user_id, category_id, amount, period_month, period_year)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, category_id, period_month, period_year)
     DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()
     RETURNING id, user_id, category_id, amount, period_month, period_year, created_at, updated_at`,
    [userId, categoryId, amount, periodMonth, periodYear]
  );
  return result.rows[0];
};

export const listBudgets = async ({ userId, periodMonth, periodYear }) => {
  const params = [userId];
  const filters = ['user_id = $1'];
  if (periodYear) {
    params.push(periodYear);
    filters.push(`period_year = $${params.length}`);
  }
  if (periodMonth) {
    params.push(periodMonth);
    filters.push(`period_month = $${params.length}`);
  }

  const result = await query(
    `SELECT id, user_id, category_id, amount, period_month, period_year, created_at, updated_at
     FROM budgets
     WHERE ${filters.join(' AND ')}
     ORDER BY period_year DESC, period_month DESC`,
    params
  );
  return result.rows;
};

export const deleteBudget = async ({ id, userId }) => {
  const result = await query(
    `DELETE FROM budgets WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rowCount > 0;
};
