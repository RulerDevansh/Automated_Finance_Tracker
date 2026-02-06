import { getCategoryById } from '../models/categoryModel.js';
import { categoryTotals } from '../models/transactionModel.js';
import { deleteBudget, listBudgets, upsertBudget } from '../models/budgetModel.js';

export const setBudget = async ({ userId, categoryId, amount, periodMonth, periodYear }) => {
  const category = await getCategoryById({ id: categoryId, userId });
  if (!category) {
    const err = new Error('Category not found');
    err.status = 404;
    throw err;
  }
  if (category.type !== 'expense') {
    const err = new Error('Budgets can only be set for expense categories');
    err.status = 400;
    throw err;
  }
  return upsertBudget({ userId, categoryId, amount: Number.parseFloat(amount).toFixed(2), periodMonth, periodYear });
};

export const getBudgets = async ({ userId, periodMonth, periodYear }) => {
  return listBudgets({ userId, periodMonth, periodYear });
};

export const removeBudget = async ({ id, userId }) => {
  const ok = await deleteBudget({ id, userId });
  if (!ok) {
    const err = new Error('Budget not found');
    err.status = 404;
    throw err;
  }
  return ok;
};

export const getBudgetProgress = async ({ userId, periodMonth, periodYear }) => {
  const [budgets, spending] = await Promise.all([
    listBudgets({ userId, periodMonth, periodYear }),
    categoryTotals({ userId, year: periodYear, month: periodMonth, type: 'expense' })
  ]);

  const spendByCategory = spending.reduce((acc, row) => {
    acc[row.category_id] = Number(row.total || 0);
    return acc;
  }, {});

  return budgets.map((b) => {
    const spent = spendByCategory[b.category_id] || 0;
    const remaining = Number(b.amount) - spent;
    return {
      budgetId: b.id,
      categoryId: b.category_id,
      amount: Number(b.amount),
      spent,
      remaining
    };
  });
};
