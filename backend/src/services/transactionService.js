import { getCategoryById } from '../models/categoryModel.js';
import {
  categoryTotals,
  createTransaction,
  deleteTransaction,
  getTransactionById,
  listTransactions,
  monthlyTotals,
  totals,
  updateTransaction
} from '../models/transactionModel.js';

const normalizeAmount = (amount) => Number.parseFloat(amount).toFixed(2);

const ensureCategory = async (userId, categoryId, type) => {
  if (!categoryId) return null;
  const category = await getCategoryById({ id: categoryId, userId });
  if (!category) {
    const err = new Error('Category not found');
    err.status = 404;
    throw err;
  }
  if (type && category.type !== type) {
    const err = new Error('Category type does not match transaction type');
    err.status = 400;
    throw err;
  }
  return category;
};

export const addTransaction = async ({ userId, categoryId, type, amount, description, occurredOn }) => {
  await ensureCategory(userId, categoryId, type);
  const normalized = normalizeAmount(amount);
  return createTransaction({
    userId,
    categoryId,
    type,
    amount: normalized,
    description,
    occurredOn
  });
};

export const editTransaction = async ({ id, userId, categoryId, type, amount, description, occurredOn }) => {
  const existing = await getTransactionById({ id, userId });
  if (!existing) {
    const err = new Error('Transaction not found');
    err.status = 404;
    throw err;
  }
  await ensureCategory(userId, categoryId, type);
  const normalized = normalizeAmount(amount);
  return updateTransaction({ id, userId, categoryId, type, amount: normalized, description, occurredOn });
};

export const removeTransaction = async ({ id, userId }) => {
  const ok = await deleteTransaction({ id, userId });
  if (!ok) {
    const err = new Error('Transaction not found');
    err.status = 404;
    throw err;
  }
  return ok;
};

export const listUserTransactions = async (params) => listTransactions(params);

export const getDashboardData = async ({ userId, year }) => {
  const [totalRow, monthRows, categoryRows] = await Promise.all([
    totals({ userId }),
    monthlyTotals({ userId, year }),
    categoryTotals({ userId, year })
  ]);

  const income = Number(totalRow?.income || 0);
  const expense = Number(totalRow?.expense || 0);

  return {
    totals: {
      income,
      expense,
      savings: income - expense
    },
    monthly: monthRows.map((row) => ({
      month: Number(row.month),
      income: Number(row.income || 0),
      expense: Number(row.expense || 0)
    })),
    byCategory: categoryRows.map((row) => ({
      categoryId: row.category_id,
      total: Number(row.total || 0),
      type: row.type
    }))
  };
};

export const getMonthlyReport = async ({ userId, year }) => {
  const monthData = await monthlyTotals({ userId, year });
  return monthData.map((row) => ({
    month: Number(row.month),
    income: Number(row.income || 0),
    expense: Number(row.expense || 0),
    savings: Number(row.income || 0) - Number(row.expense || 0)
  }));
};
