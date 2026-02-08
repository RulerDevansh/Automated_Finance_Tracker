import { getCategoryById } from '../models/categoryModel.js';
import {
  createTransaction,
  deleteTransaction,
  getTransactionById,
  listTransactions,
  updateTransaction
} from '../models/transactionModel.js';
import { findById } from '../models/userModel.js';
import { checkBudgetOverrunForExpense } from './budgetService.js';
import { convert } from '../utils/fx.js';

const normalizeAmount = (amount) => Number.parseFloat(amount).toFixed(2);

const getUserBaseCurrency = async (userId, overrideBase) => {
  if (overrideBase) return overrideBase.toUpperCase();
  const user = await findById(userId);
  return user?.base_currency || 'INR';
};

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

export const addTransaction = async ({ userId, categoryId, type, amount, currency = 'INR', description, occurredOn }) => {
  await ensureCategory(userId, categoryId, type);
  const normalized = normalizeAmount(amount);
  const tx = await createTransaction({
    userId,
    categoryId,
    type,
    amount: normalized,
    currency: currency.toUpperCase(),
    description,
    occurredOn
  });
  if (type === 'expense') {
    await checkBudgetOverrunForExpense({ userId, categoryId, occurredOn: tx.occurred_on });
  }
  return tx;
};

export const editTransaction = async ({ id, userId, categoryId, type, amount, currency = 'INR', description, occurredOn, receiptUrl }) => {
  const existing = await getTransactionById({ id, userId });
  if (!existing) {
    const err = new Error('Transaction not found');
    err.status = 404;
    throw err;
  }
  await ensureCategory(userId, categoryId, type);
  const normalized = normalizeAmount(amount);
  const tx = await updateTransaction({ id, userId, categoryId, type, amount: normalized, currency: currency.toUpperCase(), description, occurredOn, receiptUrl });
  if (tx.type === 'expense') {
    await checkBudgetOverrunForExpense({ userId, categoryId: tx.category_id, occurredOn: tx.occurred_on });
  }
  return tx;
};

export const attachReceipt = async ({ id, userId, receiptUrl }) => {
  const existing = await getTransactionById({ id, userId });
  if (!existing) {
    const err = new Error('Transaction not found');
    err.status = 404;
    throw err;
  }
  return updateTransaction({
    id,
    userId,
    categoryId: existing.category_id,
    type: existing.type,
    amount: existing.amount,
    currency: existing.currency || 'INR',
    description: existing.description,
    occurredOn: existing.occurred_on,
    receiptUrl
  });
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

export const getDashboardData = async ({ userId, year, baseCurrency }) => {
  const targetCurrency = await getUserBaseCurrency(userId, baseCurrency);
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const txs = await listTransactions({ userId, from, to, limit: 100000, offset: 0 });

  const totals = { income: 0, expense: 0 };
  const monthly = new Map();
  const byCategory = new Map();

  for (const tx of txs) {
    const amtBase = await convert(Number(tx.amount), tx.currency || 'INR', targetCurrency);
    totals[tx.type] += amtBase;

    const month = new Date(tx.occurred_on).getMonth() + 1;
    const monthRow = monthly.get(month) || { month, income: 0, expense: 0 };
    monthRow[tx.type] += amtBase;
    monthly.set(month, monthRow);

    const catKey = `${tx.category_id || 'uncategorized'}:${tx.type}`;
    const catRow = byCategory.get(catKey) || { categoryId: tx.category_id, total: 0, type: tx.type };
    catRow.total += amtBase;
    byCategory.set(catKey, catRow);
  }

  return {
    baseCurrency: targetCurrency,
    totals: {
      income: Number(totals.income.toFixed(2)),
      expense: Number(totals.expense.toFixed(2)),
      savings: Number((totals.income - totals.expense).toFixed(2))
    },
    monthly: Array.from(monthly.values()).sort((a, b) => a.month - b.month).map((row) => ({
      ...row,
      income: Number(row.income.toFixed(2)),
      expense: Number(row.expense.toFixed(2))
    })),
    byCategory: Array.from(byCategory.values()).map((row) => ({
      ...row,
      total: Number(row.total.toFixed(2))
    }))
  };
};

export const getMonthlyReport = async ({ userId, year, baseCurrency }) => {
  const targetCurrency = await getUserBaseCurrency(userId, baseCurrency);
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const txs = await listTransactions({ userId, from, to, limit: 100000, offset: 0 });
  const monthly = new Map();
  for (const tx of txs) {
    const month = new Date(tx.occurred_on).getMonth() + 1;
    const row = monthly.get(month) || { month, income: 0, expense: 0 };
    const amtBase = await convert(Number(tx.amount), tx.currency || 'INR', targetCurrency);
    row[tx.type] += amtBase;
    monthly.set(month, row);
  }
  return Array.from(monthly.values())
    .sort((a, b) => a.month - b.month)
    .map((row) => ({
      month: row.month,
      income: Number(row.income.toFixed(2)),
      expense: Number(row.expense.toFixed(2)),
      savings: Number((row.income - row.expense).toFixed(2))
    }));
};
